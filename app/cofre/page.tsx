import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CofreManager } from "@/components/cofre-manager"
import { getCredentials } from "@/app/actions/cofre-actions"

export default async function CofrePage() {
  const user = await requireAuth()
  const credentials = await getCredentials()

  const roles = [user.role?.toLowerCase() || "user"]

  return (
    <DashboardLayout userRoles={roles}>
      <CofreManager initialCredentials={credentials} />
    </DashboardLayout>
  )
}
