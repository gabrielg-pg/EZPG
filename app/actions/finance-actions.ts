"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type Revenue = {
  id: number
  year: number
  month: number
  method: string | null
  occurred_on: string | null
  name: string
  plan: string | null
  operation: string | null
  amount: number
}

export type Expense = {
  id: number
  year: number
  month: number
  method: string | null
  occurred_on: string | null
  description: string
  category: string | null
  amount: number
}

export type Collaborator = {
  id: number
  name: string
  area: string | null
  contact: string | null
}

export type Payment = {
  id: number
  collaborator_id: number
  year: number
  month: number
  description: string | null
  amount: number
  paid_on: string | null
}

export type FinanceData = {
  revenues: Revenue[]
  expenses: Expense[]
  collaborators: Collaborator[]
  payments: Payment[]
  yearTotals: { month: number; total: number }[]
}

function num(v: unknown): number {
  return Number(v ?? 0)
}

export async function getFinanceData(year: number, month: number): Promise<FinanceData> {
  await requireAuth()

  const [revenues, expenses, collaborators, payments, yearTotals] = await Promise.all([
    sql`
      SELECT id, year, month, method, occurred_on, name, plan, operation, amount
      FROM finance_revenues
      WHERE year = ${year} AND month = ${month}
      ORDER BY occurred_on ASC NULLS LAST, id ASC
    `,
    sql`
      SELECT id, year, month, method, occurred_on, description, category, amount
      FROM finance_expenses
      WHERE year = ${year} AND month = ${month}
      ORDER BY occurred_on ASC NULLS LAST, id ASC
    `,
    sql`
      SELECT id, name, area, contact
      FROM finance_collaborators
      ORDER BY name ASC
    `,
    sql`
      SELECT id, collaborator_id, year, month, description, amount, paid_on
      FROM finance_payments
      WHERE year = ${year} AND month = ${month}
      ORDER BY id ASC
    `,
    sql`
      SELECT m.month, COALESCE(r.rev, 0) - COALESCE(e.exp, 0) - COALESCE(p.pay, 0) AS total
      FROM generate_series(1, 12) AS m(month)
      LEFT JOIN (
        SELECT month, SUM(amount) AS rev FROM finance_revenues WHERE year = ${year} GROUP BY month
      ) r ON r.month = m.month
      LEFT JOIN (
        SELECT month, SUM(amount) AS exp FROM finance_expenses WHERE year = ${year} GROUP BY month
      ) e ON e.month = m.month
      LEFT JOIN (
        SELECT month, SUM(amount) AS pay FROM finance_payments WHERE year = ${year} GROUP BY month
      ) p ON p.month = m.month
      ORDER BY m.month ASC
    `,
  ])

  return {
    revenues: revenues.map((r: any) => ({ ...r, amount: num(r.amount) })) as Revenue[],
    expenses: expenses.map((e: any) => ({ ...e, amount: num(e.amount) })) as Expense[],
    collaborators: collaborators as Collaborator[],
    payments: payments.map((p: any) => ({ ...p, amount: num(p.amount) })) as Payment[],
    yearTotals: yearTotals.map((t: any) => ({ month: Number(t.month), total: num(t.total) })),
  }
}

/* -------------------- Receitas -------------------- */

export async function createRevenue(data: {
  year: number
  month: number
  method?: string
  occurred_on?: string
  name: string
  plan?: string
  operation?: string
  amount: number
}) {
  const user = await requireAuth()
  if (!data.name?.trim()) return { success: false as const, error: "Informe o nome" }
  try {
    const rows = await sql`
      INSERT INTO finance_revenues (year, month, method, occurred_on, name, plan, operation, amount, created_by)
      VALUES (
        ${data.year}, ${data.month}, ${data.method?.trim() || null},
        ${data.occurred_on || null}, ${data.name.trim()},
        ${data.plan?.trim() || null}, ${data.operation?.trim() || null},
        ${data.amount || 0}, ${user.id}
      )
      RETURNING id, year, month, method, occurred_on, name, plan, operation, amount
    `
    revalidatePath("/financeiro")
    return { success: true as const, revenue: { ...rows[0], amount: num(rows[0].amount) } as Revenue }
  } catch (error) {
    console.error("createRevenue error:", error)
    return { success: false as const, error: "Erro ao salvar receita" }
  }
}

export async function deleteRevenue(id: number) {
  await requireAuth()
  try {
    await sql`DELETE FROM finance_revenues WHERE id = ${id}`
    revalidatePath("/financeiro")
    return { success: true as const }
  } catch (error) {
    console.error("deleteRevenue error:", error)
    return { success: false as const, error: "Erro ao excluir receita" }
  }
}

/* -------------------- Despesas -------------------- */

export async function createExpense(data: {
  year: number
  month: number
  method?: string
  occurred_on?: string
  description: string
  category?: string
  amount: number
}) {
  const user = await requireAuth()
  if (!data.description?.trim()) return { success: false as const, error: "Informe a descrição" }
  try {
    const rows = await sql`
      INSERT INTO finance_expenses (year, month, method, occurred_on, description, category, amount, created_by)
      VALUES (
        ${data.year}, ${data.month}, ${data.method?.trim() || null},
        ${data.occurred_on || null}, ${data.description.trim()},
        ${data.category?.trim() || null}, ${data.amount || 0}, ${user.id}
      )
      RETURNING id, year, month, method, occurred_on, description, category, amount
    `
    revalidatePath("/financeiro")
    return { success: true as const, expense: { ...rows[0], amount: num(rows[0].amount) } as Expense }
  } catch (error) {
    console.error("createExpense error:", error)
    return { success: false as const, error: "Erro ao salvar despesa" }
  }
}

export async function deleteExpense(id: number) {
  await requireAuth()
  try {
    await sql`DELETE FROM finance_expenses WHERE id = ${id}`
    revalidatePath("/financeiro")
    return { success: true as const }
  } catch (error) {
    console.error("deleteExpense error:", error)
    return { success: false as const, error: "Erro ao excluir despesa" }
  }
}

/* -------------------- Colaboradores -------------------- */

export async function createCollaborator(data: { name: string; area?: string; contact?: string }) {
  const user = await requireAuth()
  if (!data.name?.trim()) return { success: false as const, error: "Informe o nome" }
  try {
    const rows = await sql`
      INSERT INTO finance_collaborators (name, area, contact, created_by)
      VALUES (${data.name.trim()}, ${data.area?.trim() || null}, ${data.contact?.trim() || null}, ${user.id})
      RETURNING id, name, area, contact
    `
    revalidatePath("/financeiro")
    return { success: true as const, collaborator: rows[0] as Collaborator }
  } catch (error) {
    console.error("createCollaborator error:", error)
    return { success: false as const, error: "Erro ao salvar colaborador" }
  }
}

export async function deleteCollaborator(id: number) {
  await requireAuth()
  try {
    await sql`DELETE FROM finance_payments WHERE collaborator_id = ${id}`
    await sql`DELETE FROM finance_collaborators WHERE id = ${id}`
    revalidatePath("/financeiro")
    return { success: true as const }
  } catch (error) {
    console.error("deleteCollaborator error:", error)
    return { success: false as const, error: "Erro ao excluir colaborador" }
  }
}

/* -------------------- Pagamentos -------------------- */

export async function createPayment(data: {
  collaborator_id: number
  year: number
  month: number
  description?: string
  amount: number
  paid_on?: string
}) {
  const user = await requireAuth()
  if (!data.amount || data.amount <= 0) return { success: false as const, error: "Informe um valor válido" }
  try {
    const rows = await sql`
      INSERT INTO finance_payments (collaborator_id, year, month, description, amount, paid_on, created_by)
      VALUES (
        ${data.collaborator_id}, ${data.year}, ${data.month},
        ${data.description?.trim() || null}, ${data.amount}, ${data.paid_on || null}, ${user.id}
      )
      RETURNING id, collaborator_id, year, month, description, amount, paid_on
    `
    revalidatePath("/financeiro")
    return { success: true as const, payment: { ...rows[0], amount: num(rows[0].amount) } as Payment }
  } catch (error) {
    console.error("createPayment error:", error)
    return { success: false as const, error: "Erro ao registrar pagamento" }
  }
}

export async function deletePayment(id: number) {
  await requireAuth()
  try {
    await sql`DELETE FROM finance_payments WHERE id = ${id}`
    revalidatePath("/financeiro")
    return { success: true as const }
  } catch (error) {
    console.error("deletePayment error:", error)
    return { success: false as const, error: "Erro ao excluir pagamento" }
  }
}
