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
  const serializableData = JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value,
    ),
  )

  return (
    <DashboardLayout userRoles={roles}>
      <InvestmentsDashboard initialData={serializableData} />
    </DashboardLayout>
  )
}
