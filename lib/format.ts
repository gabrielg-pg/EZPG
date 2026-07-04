export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : (value ?? 0)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(num) ? num : 0)
}

const MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

export function formatMonthLabel(month: string): string {
  // month no formato YYYY-MM
  const [year, m] = month.split("-")
  const idx = Number(m) - 1
  if (idx < 0 || idx > 11) return month
  return `${MONTHS_PT[idx]}/${year.slice(2)}`
}
