"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

async function userId() {
  const user = await requireAuth()
  return Number(user.id)
}

export async function getInvestments() {
  const id = await userId()
  const [assets, transactions, goals, settings, allocations] = await Promise.all([
    sql`SELECT * FROM investment_assets WHERE user_id=${id} ORDER BY current_value DESC NULLS LAST, name`,
    sql`SELECT * FROM investment_transactions WHERE user_id=${id} ORDER BY transaction_date DESC, id DESC LIMIT 50`,
    sql`SELECT * FROM investment_goals WHERE user_id=${id} ORDER BY created_at DESC`,
    sql`SELECT * FROM investment_settings WHERE user_id=${id} LIMIT 1`,
    sql`SELECT * FROM investment_allocations WHERE user_id=${id} ORDER BY category`,
  ])
  return { assets, transactions, goals, settings, allocations }
}

export async function createInvestmentAsset(data: {
  name: string; ticker?: string; assetType: string; category: string; institution?: string
  initialValue: number; currentValue?: number; currency?: string; indexer?: string
}) {
  const id = await userId()
  return sql`INSERT INTO investment_assets (user_id,name,ticker,asset_type,category,institution,initial_value,current_value,currency,indexer) VALUES (${id},${data.name},${data.ticker || null},${data.assetType},${data.category},${data.institution || null},${data.initialValue},${data.currentValue ?? data.initialValue},${data.currency || "BRL"},${data.indexer || null}) RETURNING *`
}

export async function createInvestmentTransaction(data: { assetId: number; type: string; date: string; amount: number; notes?: string }) {
  const id = await userId()
  return sql`INSERT INTO investment_transactions (user_id,asset_id,transaction_type,transaction_date,amount,notes) SELECT ${id},id,${data.type},${data.date},${data.amount},${data.notes || null} FROM investment_assets WHERE id=${data.assetId} AND user_id=${id} RETURNING *`
}

export async function saveInvestmentGoal(data: { name: string; targetValue: number; monthlyContribution: number; expectedReturn: number; targetDate?: string }) {
  const id = await userId()
  return sql`INSERT INTO investment_goals (user_id,name,target_value,monthly_contribution,expected_return,target_date) VALUES (${id},${data.name},${data.targetValue},${data.monthlyContribution},${data.expectedReturn},${data.targetDate || null}) RETURNING *`
}

export async function deleteInvestmentAsset(assetId: number) {
  const id = await userId()
  await sql`DELETE FROM investment_transactions WHERE asset_id=${assetId} AND user_id=${id}`
  return sql`DELETE FROM investment_assets WHERE id=${assetId} AND user_id=${id}`
}
