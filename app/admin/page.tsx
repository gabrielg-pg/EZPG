export const dynamic = "force-dynamic"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminUserManagement } from "@/components/admin-user-management"
import { requireAdmin } from "@/lib/auth"
import { getUsers } from "@/app/actions/user-actions"

export default async function AdminPage() {
  const user = await requireAdmin()
  const users = await getUsers() as any[]

  // ✅ roles sempre array (fallback pro role antigo)
  const roles = Array.isArray((user as any).roles)
    ? ((user as any).roles as string[])
    : user.role
      ? [String(user.role).toLowerCase()]
      : []

  return (
    <DashboardLayout userRoles={roles}>
      <AdminUserManagement initialUsers={users as any} />
    </DashboardLayout>
  )
}
