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
  funnel: "CRM" | "QUIZ" | "VÉRTEBRA"
  profile?: string
}

export async function getGrowthAnalytics(): Promise<GrowthLead[]> {
  await requireFunisGrowth()
  const [crm, quiz, vertebra] = await Promise.all([
    sql`SELECT id, nome, origem, etapa, created_at, updated_at FROM pg_crm_leads ORDER BY created_at DESC`,
    sql`SELECT id, nome, origem, created_at, created_at AS updated_at, perfil FROM quiz_leads ORDER BY created_at DESC`,
    sql`SELECT id, nome, COALESCE(utm_source, 'VÉRTEBRA') AS origem, status, created_at, NULL::timestamp AS updated_at FROM leads_vertebra ORDER BY created_at DESC`,
  ])
  return [
    ...crm.map((row: any) => ({ id: `crm-${row.id}`, name: row.nome || "", source: row.origem || "Não informado", stage: row.etapa || "novo", createdAt: String(row.created_at), updatedAt: row.updated_at ? String(row.updated_at) : null, funnel: "CRM" as const })),
    ...quiz.map((row: any) => ({ id: `quiz-${row.id}`, name: row.nome || "", source: row.origem || "QUIZ", stage: row.perfil || "Não classificado", createdAt: String(row.created_at), updatedAt: row.updated_at ? String(row.updated_at) : null, funnel: "QUIZ" as const, profile: row.perfil || undefined })),
    ...vertebra.map((row: any) => ({ id: `vertebra-${row.id}`, name: row.nome || "", source: row.origem || "VÉRTEBRA", stage: row.status || "novo", createdAt: String(row.created_at), updatedAt: null, funnel: "VÉRTEBRA" as const })),
  ]
}

export async function getGrowthSourceOptions(): Promise<string[]> {
  const leads = await getGrowthAnalytics()
  return Array.from(new Set(leads.map((lead) => lead.source))).filter(Boolean).sort()
}
