export type Plano = "starter" | "pro" | "premium"

export const PLANOS: Plano[] = ["starter", "pro", "premium"]

export const PLANO_LABEL: Record<Plano, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
}

// Badges seguindo o branding: Starter=verde, Pro=primary, Premium=roxo
export const PLANO_BADGE: Record<Plano, string> = {
  starter: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pro: "bg-primary/15 text-primary border-primary/30",
  premium: "bg-purple-500/15 text-purple-400 border-purple-500/30",
}

export interface Cliente {
  id: number
  nome_completo: string
  cpf: string
  email: string
  whatsapp: string
  endereco: string
  estado: string
  cidade: string
  cep: string
  plano: Plano
  ativo: boolean
  created_at: string
  // Agregados (calculados na query)
  ltv: string | number
  primeira_compra: string | number
  total_compras: number
  ultima_compra: string | null
}

export interface Compra {
  id: number
  cliente_id: number
  valor: string | number
  data_compra: string
  tipo: string
  descricao: string
  created_at: string
}

// ----- Helpers de formatação -----

export function formatCurrency(value: string | number): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value
  return (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDateBR(iso: string | Date | null): string {
  if (!iso) return "—"
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR")
}

// ----- Máscaras (aplicadas nos inputs) -----

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  return digits.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,3})$/, "$1-$2")
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.replace(/(\d{0,2})/, "($1")
  if (digits.length <= 7) return digits.replace(/(\d{2})(\d{0,5})/, "($1) $2")
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}

// ----- Validações -----

export function isValidCPF(cpf: string): boolean {
  const s = cpf.replace(/\D/g, "")
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number.parseInt(s[i]) * (10 - i)
  let rev = (sum * 10) % 11
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== Number.parseInt(s[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number.parseInt(s[i]) * (11 - i)
  rev = (sum * 10) % 11
  if (rev === 10 || rev === 11) rev = 0
  return rev === Number.parseInt(s[10])
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// Link de WhatsApp a partir do telefone formatado (adiciona DDI 55)
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/55${digits}`
}

// Estados brasileiros
export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

export const TIPOS_COMPRA = ["Plano", "Produto Extra", "Upsell", "Renovação", "Outro"]
