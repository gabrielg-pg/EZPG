"use server"

import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export type GrowthLead = {
  id: string
  name: string
  source: string
  stage: string
  createdAt: string
  updatedAt: string | null
  funnel: "CRM" | "QUIZ" | "VÉRTEBRA"
  email?: string
  phone?: string
  profile?: string
}

export async function getGrowthAnalytics(): Promise<GrowthLead[]> {
  await requireAdmin()
  const [crm, quiz, vertebra] = await Promise.all([
    sql`SELECT id, nome, origem, etapa, created_at, updated_at FROM pg_crm_leads ORDER BY created_at DESC`,
    sql`SELECT id, nome, origem, created_at, created_at AS updated_at, email, whatsapp, perfil FROM quiz_leads ORDER BY created_at DESC`,
    sql`SELECT id, nome, COALESCE(utm_source, 'VÉRTEBRA') AS origem, status, created_at, NULL::timestamp AS updated_at, email, whatsapp FROM leads_vertebra ORDER BY created_at DESC`,
  ])
  return [
    ...crm.map((row: any) => ({ id: `crm-${row.id}`, name: row.nome, source: row.origem || "Não informado", stage: row.etapa || "novo", createdAt: row.created_at, updatedAt: row.updated_at, funnel: "CRM" as const })),
    ...quiz.map((row: any) => ({ id: `quiz-${row.id}`, name: row.nome, source: row.origem || "quiz", stage: "concluído", createdAt: row.created_at, updatedAt: row.updated_at, funnel: "QUIZ" as const, email: row.email, phone: row.whatsapp, profile: row.perfil })),
    ...vertebra.map((row: any) => ({ id: `vertebra-${row.id}`, name: row.nome, source: row.origem || "VÉRTEBRA", stage: row.status || "novo", createdAt: row.created_at, updatedAt: row.updated_at, funnel: "VÉRTEBRA" as const, email: row.email, phone: row.whatsapp })),
  ]
}
