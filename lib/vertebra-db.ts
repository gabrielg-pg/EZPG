import { sql } from "@/lib/db"
import {
  VERTEBRA_PIPELINE,
  type VertebraAnswers,
  type VertebraStatus,
  isVertebraStatus,
} from "@/lib/metodo-vertebra"

export type MetodoVertebraLead = {
  id: string
  nome: string
  email: string
  whatsapp: string
  target_income: string | null
  employment_status: string | null
  current_income: string | null
  status: VertebraStatus
  respostas: VertebraAnswers
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
}

// Cria a tabela de leads do funil VÉRTEBRA (idempotente)
export async function ensureVertebraLeadsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS leads_vertebra (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      target_income TEXT,
      employment_status TEXT,
      current_income TEXT,
      status TEXT NOT NULL DEFAULT 'prospect',
      respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export type InsertVertebraLeadInput = {
  nome: string
  email: string
  whatsapp: string
  respostas: VertebraAnswers
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

// Insere o lead do funil VÉRTEBRA. Status inicial = "aprovado"
// (o lead completou a qualificação e a tela de aprovação antes do contato).
export async function insertVertebraLead(input: InsertVertebraLeadInput): Promise<{ id: string }> {
  const respostas = input.respostas ?? {}
  const rows = await sql`
    INSERT INTO leads_vertebra (
      nome, email, whatsapp, target_income, employment_status, current_income,
      status, respostas, utm_source, utm_medium, utm_campaign
    )
    VALUES (
      ${input.nome.trim()},
      ${input.email.trim()},
      ${input.whatsapp.trim()},
      ${respostas.target_income ?? null},
      ${respostas.employment_status ?? null},
      ${respostas.current_income ?? null},
      'aprovado',
      ${JSON.stringify(respostas)}::jsonb,
      ${input.utm_source ?? null},
      ${input.utm_medium ?? null},
      ${input.utm_campaign ?? null}
    )
    RETURNING id
  `
  const id = (rows as Array<{ id: string }>)[0]?.id
  return { id }
}

// Atualiza o status do lead no pipeline (dashboard)
export async function updateVertebraLeadStatus(id: string, status: VertebraStatus): Promise<void> {
  const safe: VertebraStatus = isVertebraStatus(status) ? status : VERTEBRA_PIPELINE[0].key
  await sql`UPDATE leads_vertebra SET status = ${safe} WHERE id = ${id}`
}

export async function listVertebraLeads(): Promise<MetodoVertebraLead[]> {
  const rows = await sql`
    SELECT id, nome, email, whatsapp, target_income, employment_status, current_income,
           status, respostas, utm_source, utm_medium, utm_campaign, created_at
    FROM leads_vertebra
    ORDER BY created_at DESC
  `
  return rows as MetodoVertebraLead[]
}
