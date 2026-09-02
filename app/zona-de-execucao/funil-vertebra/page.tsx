export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VertebraDashboard } from "@/components/metodo-vertebra/vertebra-dashboard"
import { refreshVertebraLeads } from "@/app/actions/metodo-vertebra-actions"

export default async function FunilVertebraPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())

  if (!roles.some((r) => ["admin", "gestor_ads"].includes(r))) {
    redirect("/dashboard")
  }

  const leads = await refreshVertebraLeads()

  return (
    <DashboardLayout userRoles={roles}>
      <VertebraDashboard initialLeads={leads} />
    </DashboardLayout>
  )
}
