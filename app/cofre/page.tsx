import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CofreManager } from "@/components/cofre-manager"
import { getVaults, getCofreSummary } from "@/app/actions/cofre-actions"

export default async function CofrePage() {
  const user = await requireAuth()
  const [vaults, summary] = await Promise.all([getVaults(), getCofreSummary()])

  const roles = [user.role?.toLowerCase() || "user"]

  return (
    <DashboardLayout userRoles={roles}>
      <CofreManager initialVaults={vaults} summary={summary} />
    </DashboardLayout>
  )
}
