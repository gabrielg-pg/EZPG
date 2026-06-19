import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CrmBoard } from "@/components/crm-board"
import { createCrmTable, getCrmLeads } from "@/app/actions/crm-actions"

export const dynamic = "force-dynamic"

export default async function CrmPage() {
  const user = await requireAuth()
  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]
  if (userRole !== "admin") redirect("/dashboard")

  await createCrmTable()
  const leads = await getCrmLeads()

  return (
    <DashboardLayout userRoles={roles}>
      <CrmBoard initialLeads={leads} />
    </DashboardLayout>
  )
}
