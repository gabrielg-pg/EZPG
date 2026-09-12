"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { parseBRLInput } from "@/lib/investment-money"

async function adminId() {
  const user = await requireAdmin()
  return Number(user.id)
}

export async function getInvestments() {
  const userId = await adminId()
  const [assets, transactions, goals, settings, allocations] = await Promise.all([
    sql`SELECT * FROM investment_assets WHERE user_id=${userId} ORDER BY current_value DESC NULLS LAST, name`,
    sql`SELECT * FROM investment_transactions WHERE user_id=${userId} ORDER BY transaction_date DESC, id DESC LIMIT 100`,
    sql`SELECT * FROM investment_goals WHERE user_id=${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM investment_settings WHERE user_id=${userId} LIMIT 1`,
    sql`SELECT * FROM investment_allocations WHERE user_id=${userId} ORDER BY category`,
  ])
  return { assets, transactions, goals, settings, allocations }
}

export async function createInvestmentAsset(data: { name: string; ticker?: string; assetType: string; category: string; institution?: string; initialValue: number; currentValue?: number; currency?: string; indexer?: string }) {
  const userId = await adminId()
  const initialValue = parseBRLInput(data.initialValue)
  if (!data.name?.trim() || initialValue <= 0) throw new Error("Informe um nome e um valor investido válido.")
  const [asset] = await sql`INSERT INTO investment_assets (user_id,name,ticker,asset_type,category,institution,initial_value,current_value,currency,indexer,tax_exempt,fgc,created_at,updated_at) VALUES (${userId},${data.name.trim()},${data.ticker?.trim() || null},${data.assetType},${data.category.trim()},${data.institution?.trim() || null},${initialValue},${data.currentValue ?? initialValue},${data.currency || "BRL"},${data.indexer || null},false,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`
  await sql`INSERT INTO investment_transactions (user_id,asset_id,transaction_type,transaction_date,amount,currency,created_at) VALUES (${userId},${asset.id},'APORTE',CURRENT_DATE,${initialValue},${data.currency || "BRL"},CURRENT_TIMESTAMP)`
  if (data.currentValue !== null && data.currentValue !== undefined) {
    await sql`INSERT INTO investment_value_updates (asset_id,user_id,value,reference_date,source_type) VALUES (${asset.id},${userId},${data.currentValue},CURRENT_DATE,'manual')`
  }
  revalidatePath("/investimentos")
  return { id: Number(asset.id), name: String(asset.name), initialValue: Number(asset.initial_value), currentValue: Number(asset.current_value ?? asset.initial_value) }
}

export async function createInvestmentTransaction(data: { assetId: number; type: string; date: string; amount: number; notes?: string }) {
  const userId = await adminId()
  const [transaction] = await sql`INSERT INTO investment_transactions (user_id,asset_id,transaction_type,transaction_date,amount,notes,currency,created_at) SELECT ${userId},id,${data.type},${data.date},${data.amount},${data.notes || null},'BRL',CURRENT_TIMESTAMP FROM investment_assets WHERE id=${data.assetId} AND user_id=${userId} RETURNING *`
  if (!transaction) throw new Error("Ativo de investimento não encontrado.")
  revalidatePath("/investimentos")
  return { id: Number(transaction.id), amount: Number(transaction.amount), transactionType: String(transaction.transaction_type) }
}

export async function saveInvestmentGoal(data: { name: string; targetValue: number; monthlyContribution: number; expectedReturn: number; targetDate?: string }) {
  const userId = await adminId()
  const [goal] = await sql`INSERT INTO investment_goals (user_id,name,target_value,monthly_contribution,expected_return,target_date,created_at) VALUES (${userId},${data.name.trim()},${data.targetValue},${data.monthlyContribution},${data.expectedReturn},${data.targetDate || null},CURRENT_TIMESTAMP) RETURNING *`
  revalidatePath("/investimentos")
  return goal
}

export async function deleteInvestmentAsset(assetId: number) {
  const userId = await adminId()
  await sql`DELETE FROM investment_transactions WHERE asset_id=${assetId} AND user_id=${userId}`
  await sql`DELETE FROM investment_assets WHERE id=${assetId} AND user_id=${userId}`
  revalidatePath("/investimentos")
}

export async function saveInvestmentAllocation(category: string, targetPercentage: number) {
  const userId = await adminId()
  await sql`INSERT INTO investment_allocations (user_id,category,target_percentage) VALUES (${userId},${category},${targetPercentage}) ON CONFLICT (user_id,category) DO UPDATE SET target_percentage=EXCLUDED.target_percentage`
  revalidatePath("/investimentos")
}

export async function saveInvestmentSettings(data: { monthlyContributionTarget: number; usdBrlRate: number; allocationTolerance: number; defaultProjectionRate: number }) {
  const userId = await adminId()
  await sql`INSERT INTO investment_settings (user_id,monthly_contribution_target,usd_brl_rate,allocation_tolerance,default_projection_rate) VALUES (${userId},${data.monthlyContributionTarget},${data.usdBrlRate},${data.allocationTolerance},${data.defaultProjectionRate}) ON CONFLICT (user_id) DO UPDATE SET monthly_contribution_target=EXCLUDED.monthly_contribution_target,usd_brl_rate=EXCLUDED.usd_brl_rate,allocation_tolerance=EXCLUDED.allocation_tolerance,default_projection_rate=EXCLUDED.default_projection_rate`
  revalidatePath("/investimentos")
}
