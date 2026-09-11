export type ContractStatus = "ativo" | "renovado" | "vencido" | "inadimplente"
export type PaymentStatus = "pago" | "aguardando" | "atrasado"
export type TabStatus = "ativos" | "pausados" | "nao_renovados"

export const CONTRACT_STATUSES: ContractStatus[] = ["ativo", "renovado", "vencido", "inadimplente"]
export const PAYMENT_STATUSES: PaymentStatus[] = ["pago", "aguardando", "atrasado"]

export const DEFAULT_RESPONSIBLE = "PG | Alisson Jordi"

export interface GrowthClient {
  id: number
  brand_name: string
  cycle_start: string
  cycle_end: string
  monthly_value: string | number
  current_cycle: number
  contract_status: ContractStatus
  payment_status: PaymentStatus
  responsible: string
  tab_status: TabStatus
  paused_at: string | null
  paused_days_remaining: number | null
  exit_date: string | null
  exit_reason: string | null
  completed_cycles: number
  created_at: string
  updated_at: string
}

export interface ClientCycle {
  id: number
  client_id: number
  cycle_number: number
  cycle_start: string
  cycle_end: string
  monthly_value: string | number
  payment_status: PaymentStatus
  created_at: string
}

// ----- Labels -----
export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  ativo: "Ativo",
  renovado: "Renovado",
  vencido: "Vencido",
  inadimplente: "Inadimplente",
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pago: "Pago",
  aguardando: "Aguardando",
  atrasado: "Atrasado",
}

// ----- Helpers -----

// Normaliza qualquer formato de data (Date, ISO completo ou YYYY-MM-DD) para meia-noite local
function parseDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  const datePart = String(value).slice(0, 10) // "YYYY-MM-DD"
  const [y, m, d] = datePart.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

// Dias restantes: término − hoje (em dias, arredondado)
export function daysRemaining(cycleEnd: string | Date): number {
  const end = parseDate(cycleEnd)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = end.getTime() - today.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

// Nível de alerta da linha
export type RowAlert = "none" | "warning" | "danger"
export function rowAlert(cycleEnd: string | Date): RowAlert {
  const d = daysRemaining(cycleEnd)
  if (d <= 2) return "danger" // ≤2 dias ou vencido
  if (d <= 5) return "warning" // ≤5 dias
  return "none"
}

export function formatCurrency(value: string | number): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value
  return (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDateBR(iso: string | Date | null): string {
  if (!iso) return "—"
  return parseDate(iso).toLocaleDateString("pt-BR")
}

// Converte para o formato aceito por <input type="date"> (YYYY-MM-DD)
export function toDateInput(value: string | Date): string {
  const d = parseDate(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
