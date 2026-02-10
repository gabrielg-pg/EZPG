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
      return 10
    case "Scale VÉRTEBRA+ BR":
    case "Scale Vértebra":
    case "Scale VÉRTEBRA+ GLOBAL":
    case "Scale Global":
      return 15
    default:
      return 7
  }
}

/**
 * Formata uma data para o formato brasileiro DD/MM/AAAA
 */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "-"

  let date: Date

  if (value instanceof Date) {
    date = value
  } else if (typeof value === "string") {
    // Se vier como YYYY-MM-DD ou ISO completo
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const isoDate = value.includes("T") ? value : `${value}T12:00:00`
      date = new Date(isoDate)
    }
    // Se vier como DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("/")
      date = new Date(`${yyyy}-${mm}-${dd}T12:00:00`)
    }
    // Fallback: tenta como Date normal
    else {
      date = new Date(value)
    }
  } else {
    return "-"
  }

  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR")
}

/**
 * Calcula a data de entrega baseada no plano e data de criação
 */
export function calculateDeliveryDate(createdAt: string | Date, plan: string): Date {
  let startDate: Date

  if (createdAt instanceof Date) {
    startDate = createdAt
  } else if (typeof createdAt === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(createdAt)) {
      const isoDate = createdAt.includes("T") ? createdAt : `${createdAt}T12:00:00`
      startDate = new Date(isoDate)
    } else {
      startDate = new Date(createdAt)
    }
  } else {
    startDate = new Date()
  }

  const businessDays = getBusinessDaysByPlan(plan)
  return addBusinessDays(startDate, businessDays)
}
