export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PropostasPage as PropostasPageContent } from "@/components/propostas-page"
import { getVertebraLeads, getVagasConfig } from "@/app/actions/vertebra-actions"
import { getProposalLeads } from "@/app/actions/propostas-crm-actions"

export default async function PropostasPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((role) => (role ?? "").toLowerCase())

  if (!roles.includes("admin")) {
    redirect("/dashboard")
  }

  const [leads, vagas, crm] = await Promise.all([getVertebraLeads(), getVagasConfig(), getProposalLeads()])

  return (
    <DashboardLayout userRoles={roles}>
      <PropostasPageContent leads={leads} vagas={vagas} crm={crm} />
    </DashboardLayout>
  )
}
