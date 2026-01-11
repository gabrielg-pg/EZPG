import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminUserManagement } from "@/components/admin-user-management"
import { requireAdmin } from "@/lib/auth"
import { getUsers } from "@/app/actions/user-actions"

export default async function AdminPage() {
  const user = await requireAdmin()
  const users = await getUsers()

  return (
    <DashboardLayout userRole={user.role}>
      <AdminUserManagement initialUsers={users} />
    </DashboardLayout>
  )
}
