export const CREATIVE_STATUSES = [
  "briefing",
  "em_producao",
  "no_ar",
  "em_analise",
  "escalando",
  "pausado_positivo",
  "pausado_negativo",
] as const

export type CreativeStatus = (typeof CREATIVE_STATUSES)[number]

export type Creative = {
  id: number
  name: string
  format: string
  drive_link: string | null
  primary_text: string | null
  title: string | null
  description: string | null
  observation: string | null
  budget: string | null
  status: CreativeStatus
  pause_reason: string | null
  sort_order: number
  created_at: string
  updated_at: string
}
