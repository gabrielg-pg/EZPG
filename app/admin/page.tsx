import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminUserManagement } from "@/components/admin-user-management"
import { requireAdmin } from "@/lib/auth"
import { getUsers } from "@/app/actions/user-actions"

export default async function AdminPage() {
  const user = await requireAdmin()
  const users = await getUsers()

  return (
    <DashboardLayout userRoles={user.roles}>
      <AdminUserManagement initialUsers={users} />
    </DashboardLayout>
  )
}
