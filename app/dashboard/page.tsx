export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"
import { getContacts, getStages } from "@/app/actions/crm-actions"
import { getFinanceSummary } from "@/app/actions/finance-actions"

export default async function DashboardPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || "user"]

  const [contacts, stages, summary] = await Promise.all([
    getContacts(),
    getStages(),
    getFinanceSummary(),
  ])

  return (
    <DashboardLayout userRoles={roles}>
      <DashboardOverview
        userName={user.name}
        contacts={contacts}
        stages={stages}
        summary={summary}
      />
    </DashboardLayout>
  )
}
