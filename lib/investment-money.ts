export function parseBRLInput(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const raw = String(value ?? "").trim().replace(/R\$\s?/gi, "")
  if (!raw) return 0
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatBRL(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0)
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatUSD(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0)
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(amount) ? amount : 0)
}

export function annualToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

export function projectBalance(initial: number, monthlyContribution: number, annualRate: number, months: number): number {
  const rate = annualToMonthlyRate(annualRate)
  return Array.from({ length: Math.max(0, months) }).reduce<number>((balance) => balance * (1 + rate) + monthlyContribution, initial)
}
