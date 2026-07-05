export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FinanceManager } from "@/components/finance-manager"
import { getFinanceData } from "@/app/actions/finance-actions"

export default async function FinanceiroPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || "user"]

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const data = await getFinanceData(year, month)

  return (
    <DashboardLayout userRoles={roles}>
      <FinanceManager initialData={data} initialYear={year} initialMonth={month} />
    </DashboardLayout>
  )
}
