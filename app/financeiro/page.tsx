export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FinanceManager } from "@/components/finance-manager"
import { getTransactions, getFinanceSummary } from "@/app/actions/finance-actions"

export default async function FinanceiroPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || "user"]

  const [transactions, summary] = await Promise.all([
    getTransactions(),
    getFinanceSummary(),
  ])

  return (
    <DashboardLayout userRoles={roles}>
      <FinanceManager initialTransactions={transactions} summary={summary} />
    </DashboardLayout>
  )
}
