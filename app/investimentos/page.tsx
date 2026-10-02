import { requireAdmin } from "@/lib/auth"
import { getInvestments } from "@/app/actions/investment-actions"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvestmentsDashboard } from "@/components/investments-dashboard"

export const dynamic = "force-dynamic"

export default async function InvestimentosPage() {
  const user = await requireAdmin()
  const roles = [user.role, ...(user.roles ?? [])]
    .filter((role): role is string => typeof role === "string" && role.length > 0)
    .map((role) => role.toLowerCase())
  const data = await getInvestments()
  const assets = data.assets.map((asset) => ({
    id: Number(asset.id),
    name: String(asset.name ?? ""),
    ticker: asset.ticker ? String(asset.ticker) : null,
    category: asset.category ? String(asset.category) : null,
    institution: asset.institution ? String(asset.institution) : null,
    initial_value: Number(asset.initial_value ?? 0),
    current_value: asset.current_value === null || asset.current_value === undefined ? null : Number(asset.current_value),
    maturity_date: asset.maturity_date ? String(asset.maturity_date) : null,
  }))

  const transactions = data.transactions.map((transaction) => ({
    id: Number(transaction.id), asset_id: Number(transaction.asset_id), transaction_type: String(transaction.transaction_type), transaction_date: String(transaction.transaction_date), amount: Number(transaction.amount ?? 0), currency: String(transaction.currency ?? "BRL"), notes: transaction.notes ? String(transaction.notes) : null,
  }))

  const goals = data.goals.map((goal) => ({ id: Number(goal.id), name: String(goal.name ?? ""), target_value: Number(goal.target_value ?? 0), monthly_contribution: Number(goal.monthly_contribution ?? 0), expected_return: Number(goal.expected_return ?? 0), target_date: goal.target_date ? String(goal.target_date) : null }))
  const allocations = data.allocations.map((allocation) => ({ category: String(allocation.category ?? ""), target_percentage: Number(allocation.target_percentage ?? 0) }))

  return (
    <DashboardLayout userRoles={roles}>
      <InvestmentsDashboard initialData={{ assets, transactions, goals, allocations }} />
    </DashboardLayout>
  )
}
