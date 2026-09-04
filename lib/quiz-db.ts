import { sql } from "@/lib/db"
import {
  computePoints,
  computeScore,
  getProfile,
  getAnswerLabel,
  type QuizAnswers,
  type QuizProfile,
} from "@/lib/quiz"

export type QuizLead = {
  id: string
  nome: string
  whatsapp: string
  email: string
  score: number
  perfil: QuizProfile
  respostas: QuizAnswers
  pontos: Record<string, number>
  origem: string
  crm_id: string | null
  created_at: string
}

// Cria a tabela de leads do quiz (idempotente)
export async function ensureQuizLeadsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      perfil TEXT NOT NULL,
      respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
      pontos JSONB NOT NULL DEFAULT '{}'::jsonb,
      origem TEXT NOT NULL DEFAULT 'quiz',
      crm_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export type InsertQuizLeadInput = {
  nome: string
  whatsapp: string
  email: string
  respostas: QuizAnswers
}

export type InsertQuizLeadResult = {
  id: string
  score: number
  perfil: QuizProfile
  pontos: Record<string, number>
}

// Insere o lead recalculando score/perfil no servidor (autoritativo)
export async function insertQuizLead(input: InsertQuizLeadInput): Promise<InsertQuizLeadResult> {
  const score = computeScore(input.respostas)
  const perfil = getProfile(score)
  const pontos = computePoints(input.respostas)

  const rows = await sql`
    INSERT INTO quiz_leads (nome, whatsapp, email, score, perfil, respostas, pontos, origem)
    VALUES (
      ${input.nome.trim()},
      ${input.whatsapp.trim()},
      ${input.email.trim()},
      ${score},
      ${perfil},
      ${JSON.stringify(input.respostas)}::jsonb,
      ${JSON.stringify(pontos)}::jsonb,
      'quiz'
    )
    RETURNING id
  `
  const id = (rows as Array<{ id: string }>)[0]?.id
  return { id, score, perfil, pontos }
}

export async function setQuizLeadCrmId(id: string, crmId: string): Promise<void> {
  await sql`UPDATE quiz_leads SET crm_id = ${crmId} WHERE id = ${id}`
}

export async function listQuizLeads(): Promise<QuizLead[]> {
  const rows = await sql`
    SELECT id, nome, whatsapp, email, score, perfil, respostas, pontos, origem, crm_id, created_at
    FROM quiz_leads
    ORDER BY created_at DESC
  `
  return rows as QuizLead[]
}

// Encaminha o lead para o CRM via webhook (best-effort — não bloqueia o fluxo do quiz)
export async function forwardLeadToCrm(lead: {
  nome: string
  whatsapp: string
  email: string
  score: number
  perfil: QuizProfile
  respostas: QuizAnswers
  pontos: Record<string, number>
  created_at: string
}): Promise<string | null> {
  const url = process.env.CRM_WEBHOOK_URL
  const apiKey = process.env.CRM_API_KEY
  if (!url) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        nome: lead.nome,
        whatsapp: lead.whatsapp,
        email: lead.email,
        score: lead.score,
        perfil: lead.perfil,
        respostas: lead.respostas,
        data_preenchimento: lead.created_at,
        origem: "quiz",
        status: "Novo Lead",
        tags: ["quiz_completado", `perfil_${lead.perfil.toLowerCase()}`],
        pontos_por_pergunta: lead.pontos,
        capital: getAnswerLabel("q2", lead.respostas.q2),
        prazo: getAnswerLabel("q5", lead.respostas.q5),
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    if (!res.ok) {
      console.error("[v0] CRM webhook respondeu com status", res.status)
      return null
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null
    return data?.id ?? null
  } catch (error) {
    console.error("[v0] Falha ao enviar lead ao CRM:", error)
    return null
  }
}
