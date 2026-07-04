"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type FinanceTransaction = {
  id: number
  type: "receita" | "despesa"
  description: string
  category: string | null
  amount: number
  status: string
  due_date: string | null
  occurred_on: string
  created_by: number | null
  created_at: string
}

export type FinanceSummary = {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  monthly: { month: string; receitas: number; despesas: number }[]
  byCategory: { category: string; total: number }[]
}

export async function getTransactions(): Promise<FinanceTransaction[]> {
  const { user } = await getSession()
  if (!user) return []
  const rows = await sql`
    SELECT id, type, description, category, amount, status, due_date, occurred_on, created_by, created_at
    FROM finance_transactions
    ORDER BY occurred_on DESC, id DESC
  `
  return rows.map((r: any) => ({ ...r, amount: Number(r.amount) })) as FinanceTransaction[]
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const { user } = await getSession()
  if (!user) {
    return { totalReceitas: 0, totalDespesas: 0, saldo: 0, monthly: [], byCategory: [] }
  }

  const totals = await sql`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'receita'), 0) AS receitas,
      COALESCE(SUM(amount) FILTER (WHERE type = 'despesa'), 0) AS despesas
    FROM finance_transactions
  `

  const monthlyRows = await sql`
    SELECT
      to_char(date_trunc('month', occurred_on), 'YYYY-MM') AS month,
      COALESCE(SUM(amount) FILTER (WHERE type = 'receita'), 0) AS receitas,
      COALESCE(SUM(amount) FILTER (WHERE type = 'despesa'), 0) AS despesas
    FROM finance_transactions
    WHERE occurred_on >= (CURRENT_DATE - INTERVAL '5 months')
    GROUP BY 1
    ORDER BY 1 ASC
  `

  const categoryRows = await sql`
    SELECT COALESCE(category, 'Sem categoria') AS category, COALESCE(SUM(amount), 0) AS total
    FROM finance_transactions
    WHERE type = 'despesa'
    GROUP BY 1
    ORDER BY total DESC
    LIMIT 6
  `

  const totalReceitas = Number(totals[0]?.receitas ?? 0)
  const totalDespesas = Number(totals[0]?.despesas ?? 0)

  return {
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    monthly: monthlyRows.map((r: any) => ({
      month: r.month,
      receitas: Number(r.receitas),
      despesas: Number(r.despesas),
    })),
    byCategory: categoryRows.map((r: any) => ({
      category: r.category,
      total: Number(r.total),
    })),
  }
}

export async function createTransaction(data: {
  type: "receita" | "despesa"
  description: string
  category?: string
  amount: number
  status?: string
  occurred_on?: string
  due_date?: string
}) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  if (!data.description?.trim()) {
    return { success: false, error: "Informe a descrição" }
  }
  if (!data.amount || data.amount <= 0) {
    return { success: false, error: "Informe um valor válido" }
  }

  try {
    await sql`
      INSERT INTO finance_transactions (type, description, category, amount, status, occurred_on, due_date, created_by)
      VALUES (
        ${data.type},
        ${data.description.trim()},
        ${data.category || null},
        ${data.amount},
        ${data.status || "pago"},
        ${data.occurred_on || new Date().toISOString().slice(0, 10)},
        ${data.due_date || null},
        ${user.id}
      )
    `
    revalidatePath("/financeiro")
    return { success: true }
  } catch (error) {
    console.error("Create transaction error:", error)
    return { success: false, error: "Erro ao criar lançamento" }
  }
}

export async function deleteTransaction(id: number) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`DELETE FROM finance_transactions WHERE id = ${id}`
    revalidatePath("/financeiro")
    return { success: true }
  } catch (error) {
    console.error("Delete transaction error:", error)
    return { success: false, error: "Erro ao excluir lançamento" }
  }
}
