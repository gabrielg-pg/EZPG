import { requireAdmin } from "@/lib/auth"
import { getInvestments } from "@/app/actions/investment-actions"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InvestmentsDashboard } from "@/components/investments-dashboard"

export const dynamic = "force-dynamic"

export default async function InvestimentosPage() {
  const user = await requireAdmin()
  const roles = (user.roles ?? [user.role]).map((role) => role.toLowerCase())
  const data = await getInvestments()

  return (
    <DashboardLayout userRoles={roles}>
      <InvestmentsDashboard initialData={JSON.parse(JSON.stringify(data))} />
    </DashboardLayout>
  )
}
