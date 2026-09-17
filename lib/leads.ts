export type LeadStatus = "parcial" | "qualificado" | "desqualificado"

export type PipelineStatus =
  | "qualificado"
  | "contato_feito"
  | "em_negociacao"
  | "fechado"
  | "perdido"

export type Lead = {
  id: string
  nome: string
  whatsapp: string
  email: string
  objetivo: string | null
  situacao: string | null
  experiencia: string | null
  capital: string | null
  prazo: string | null
  status: LeadStatus
  pipeline_status: PipelineStatus
  notas: string | null
  pipeline_updated_at: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  fbclid: string | null
  created_at: string
  updated_at: string
}

export type PipelineColumn = {
  key: PipelineStatus
  label: string
  color: string
  dot: string
  description: string
}

// Colunas do pipeline (Kanban) — na ordem de exibição
export const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    key: "qualificado",
    label: "Novo Lead",
    color: "#3B82F6",
    dot: "bg-blue-500",
    description: "Recém chegado, sem contato",
  },
  {
    key: "contato_feito",
    label: "Contato Feito",
    color: "#F59E0B",
    dot: "bg-amber-500",
    description: "Primeiro contato realizado",
  },
  {
    key: "em_negociacao",
    label: "Em Negociação",
    color: "#F97316",
    dot: "bg-orange-500",
    description: "Em conversa e proposta",
  },
  {
    key: "fechado",
    label: "Fechado",
    color: "#16A34A",
    dot: "bg-green-600",
    description: "Cliente fechado",
  },
  {
    key: "perdido",
    label: "Perdido",
    color: "#EF4444",
    dot: "bg-red-500",
    description: "Lead não convertido",
  },
]

// Faixas de capital (Step 5)
export const CAPITAL_TIERS: Record<string, { label: string; badge: string; premium?: boolean }> = {
  "2k_5k": { label: "R$ 2.000 – R$ 5.000", badge: "bg-muted text-muted-foreground border-border" },
  "5k_10k": { label: "R$ 5.000 – R$ 10.000", badge: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  "acima_10k": {
    label: "Acima de R$ 10.000",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    premium: true,
  },
  sem_capital: { label: "Sem capital", badge: "bg-red-500/15 text-red-400 border-red-500/25" },
}

// ---------- BOARD (Kanban) por VALOR ----------
// Colunas de entrada = faixas de capital (o lead cai automaticamente na faixa da resposta dele).
// Colunas de ação = etapas comerciais manuais (Contato Feito, Fechado, Perdido).
export type BoardColumnKey =
  | "cap_2k_5k"
  | "cap_5k_10k"
  | "cap_acima_10k"
  | "cap_sem_capital"
  | "contato_feito"
  | "fechado"
  | "perdido"

export type BoardColumn = {
  key: BoardColumnKey
  label: string
  color: string
  description: string
  kind: "capital" | "action"
  capital?: string
  pipelineStatus?: PipelineStatus
}

export const BOARD_COLUMNS: BoardColumn[] = [
  {
    key: "cap_2k_5k",
    label: "R$ 2.000 – R$ 5.000",
    color: "#94A3B8",
    description: "Novos leads dessa faixa",
    kind: "capital",
    capital: "2k_5k",
  },
  {
    key: "cap_5k_10k",
    label: "R$ 5.000 – R$ 10.000",
    color: "#F59E0B",
    description: "Novos leads dessa faixa",
    kind: "capital",
    capital: "5k_10k",
  },
  {
    key: "cap_acima_10k",
    label: "Acima de R$ 10.000",
    color: "#10B981",
    description: "Novos leads dessa faixa",
    kind: "capital",
    capital: "acima_10k",
  },
  {
    key: "cap_sem_capital",
    label: "Sem capital",
    color: "#71717A",
    description: "Sem faixa informada",
    kind: "capital",
    capital: "sem_capital",
  },
  {
    key: "contato_feito",
    label: "Contato Feito",
    color: "#0EA5E9",
    description: "Primeiro contato realizado",
    kind: "action",
    pipelineStatus: "contato_feito",
  },
  {
    key: "fechado",
    label: "Fechado",
    color: "#22C55E",
    description: "Cliente fechado",
    kind: "action",
    pipelineStatus: "fechado",
  },
  {
    key: "perdido",
    label: "Perdido",
    color: "#EF4444",
    description: "Lead não convertido",
    kind: "action",
    pipelineStatus: "perdido",
  },
]

// Determina em qual coluna o lead deve aparecer.
// Leads em etapa comercial usam o pipeline_status; os demais caem na faixa de capital.
export function getLeadColumnKey(lead: Pick<Lead, "pipeline_status" | "capital">): BoardColumnKey {
  if (lead.pipeline_status === "fechado") return "fechado"
  if (lead.pipeline_status === "perdido") return "perdido"
  if (lead.pipeline_status === "contato_feito" || lead.pipeline_status === "em_negociacao") {
    return "contato_feito"
  }
  // Entrada (qualificado / novo): agrupa por faixa de capital
  const cap = lead.capital && CAPITAL_TIERS[lead.capital] ? lead.capital : "sem_capital"
  return `cap_${cap}` as BoardColumnKey
}

// Alvos de movimentação manual (o que aparece no menu "Mover para").
// "reabrir" volta o lead para a coluna da faixa de capital dele.
export type MoveTargetKey = "reabrir" | "contato_feito" | "fechado" | "perdido"

export const MOVE_TARGETS: { key: MoveTargetKey; label: string; color: string }[] = [
  { key: "reabrir", label: "Novo (reabrir)", color: "#94A3B8" },
  { key: "contato_feito", label: "Contato Feito", color: "#0EA5E9" },
  { key: "fechado", label: "Fechado", color: "#22C55E" },
  { key: "perdido", label: "Perdido", color: "#EF4444" },
]

// Traduz um alvo de board (coluna ou move target) para o pipeline_status persistido.
export function boardKeyToPipelineStatus(key: string): PipelineStatus {
  if (key === "contato_feito") return "contato_feito"
  if (key === "fechado") return "fechado"
  if (key === "perdido") return "perdido"
  // qualquer coluna de capital ou "reabrir" => estado de entrada
  return "qualificado"
}

// Dado um lead, retorna o alvo "atual" para filtrar do menu de movimentação.
export function currentMoveTarget(lead: Pick<Lead, "pipeline_status" | "capital">): MoveTargetKey {
  const col = getLeadColumnKey(lead)
  if (col === "contato_feito" || col === "fechado" || col === "perdido") return col
  return "reabrir"
}

// Formata WhatsApp (11 dígitos) para link wa.me
export function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  // Garante DDI 55 para o Brasil
  return digits.startsWith("55") ? digits : `55${digits}`
}

// "há X horas" / "há X dias"
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "agora mesmo"
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`
  const months = Math.floor(days / 30)
  return `há ${months} ${months === 1 ? "mês" : "meses"}`
}
