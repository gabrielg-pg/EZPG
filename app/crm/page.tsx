export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CrmBoard } from "@/components/crm-board"
import { getContacts, getStages } from "@/app/actions/crm-actions"

export default async function CrmPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || "user"]

  const [contacts, stages] = await Promise.all([getContacts(), getStages()])

  return (
    <DashboardLayout userRoles={roles}>
      <CrmBoard initialContacts={contacts} stages={stages} />
    </DashboardLayout>
  )
}
