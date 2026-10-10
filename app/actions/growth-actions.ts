"use server"

import { sql } from "@/lib/db"
import { requireFunisGrowth } from "@/lib/auth"

export type GrowthLead = {
  id: string
  name: string
  source: string
  stage: string
  createdAt: string
  updatedAt: string | null
  funnel: "FORMULÁRIO" | "QUIZ" | "VÉRTEBRA"
  profile?: string
}

export async function getGrowthAnalytics(): Promise<GrowthLead[]> {
  await requireFunisGrowth()
  const [formulario, quiz, vertebra] = await Promise.all([
    sql`SELECT id, nome, origem, etapa, created_at, updated_at FROM pg_crm_leads WHERE LOWER(TRIM(origem)) IN ('/qualificacao', 'qualificacao', 'formulario', 'formulário') ORDER BY created_at DESC`,
    sql`SELECT id, nome, created_at, created_at AS updated_at, perfil FROM quiz_leads ORDER BY created_at DESC`,
    sql`SELECT id, nome, utm_campaign, status, created_at, NULL::timestamp AS updated_at FROM leads_vertebra ORDER BY created_at DESC`,
  ])

  return [
    ...formulario.map((row: any) => ({ id: `form-${row.id}`, name: row.nome || "", source: "", stage: row.etapa || "novo", createdAt: String(row.created_at), updatedAt: row.updated_at ? String(row.updated_at) : null, funnel: "FORMULÁRIO" as const })),
    ...quiz.map((row: any) => ({ id: `quiz-${row.id}`, name: row.nome || "", source: "", stage: row.perfil || "Não classificado", createdAt: String(row.created_at), updatedAt: row.updated_at ? String(row.updated_at) : null, funnel: "QUIZ" as const, profile: row.perfil || undefined })),
    ...vertebra.map((row: any) => ({ id: `vertebra-${row.id}`, name: row.nome || "", source: row.utm_campaign || "", stage: row.status || "novo", createdAt: String(row.created_at), updatedAt: null, funnel: "VÉRTEBRA" as const })),
  ]
}

export async function getGrowthCampaignOptions(): Promise<string[]> {
  await requireFunisGrowth()
  const rows = await sql`
    SELECT DISTINCT utm_campaign FROM leads_vertebra WHERE NULLIF(TRIM(utm_campaign), '') IS NOT NULL ORDER BY utm_campaign
  `
  return rows.map((row: any) => String(row.utm_campaign)).filter(Boolean)
}
