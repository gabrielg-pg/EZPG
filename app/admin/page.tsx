export const dynamic = "force-dynamic"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminUserManagement } from "@/components/admin-user-management"
import { requireAdmin } from "@/lib/auth"
import { getUsers } from "@/app/actions/user-actions"

export default async function AdminPage() {
  const user = await requireAdmin()
  const users = (await getUsers()) as any[]

  const roles = [user.role?.toLowerCase() || "user"]

  return (
    <DashboardLayout userRoles={roles}>
      <AdminUserManagement initialUsers={users as any} />
    </DashboardLayout>
  )
}
