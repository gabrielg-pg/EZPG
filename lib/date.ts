/**
 * Adiciona dias úteis (seg-sex) a uma data
 * @param date Data inicial
 * @param days Número de dias úteis a adicionar
 * @returns Nova data com dias úteis adicionados
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let addedDays = 0

  while (addedDays < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    // 0 = domingo, 6 = sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++
    }
  }

  return result
}

/**
 * Retorna o prazo em dias úteis baseado no plano
 */
export function getBusinessDaysByPlan(plan: string): number {
  switch (plan) {
    case "Start PRO GROWTH":
    case "Start Growth":
      return 7
    case "Pro VÉRTEBRA":
    case "Pro Vértebra":
      return 7
    case "Scale VÉRTEBRA+ BR":
    case "Scale Vértebra":
    case "Scale VÉRTEBRA+ GLOBAL":
    case "Scale Global":
      return 10
    default:
      return 7
  }
}

/**
 * Formata uma data para o formato brasileiro DD/MM/AAAA
 */
function dateFromCivilString(value: string): Date | null {
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
      ? date
      : null
  }

  const brMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return dateFromCivilString(`${year}-${month}-${day}`)
  }

  return null
}

function dateFromValue(value: string | Date): Date | null {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const civilDate = dateFromCivilString(value)
  if (civilDate) return civilDate

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

/**
 * Formata datas civis sem convertê-las para UTC. Isso preserva exatamente o dia
 * informado no formulário ou retornado pelo banco, sem deslocamento de fuso.
 */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "-"
  const date = dateFromValue(value)
  return date ? date.toLocaleDateString("pt-BR") : "-"
}

/**
 * Calcula a data de entrega baseada no plano e na data civil de criação.
 */
export function calculateDeliveryDate(createdAt: string | Date, plan: string): Date {
  const startDate = dateFromValue(createdAt) ?? new Date()
  return addBusinessDays(startDate, getBusinessDaysByPlan(plan))
}
