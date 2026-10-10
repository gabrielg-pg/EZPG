import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LeadsPipeline } from "@/components/leads-pipeline"
import { getPipelineLeads } from "@/app/actions/leads-actions"

export const dynamic = "force-dynamic"

export default async function CrmPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso restrito: apenas Admin e Gestor de ADS
  if (!roles.some((r) => ["admin", "gestor_ads"].includes(r))) {
    redirect("/dashboard")
  }

  const leads = await getPipelineLeads()

  return (
    <DashboardLayout userRoles={roles}>
      <LeadsPipeline initialLeads={leads} />
    </DashboardLayout>
  )
}
