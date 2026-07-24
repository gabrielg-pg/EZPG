export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PropostasBoard } from "@/components/propostas-board"
import { getVertebraLeads, getVagasConfig } from "@/app/actions/vertebra-actions"

export default async function PropostasPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())

  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    redirect("/dashboard")
  }

  const [leads, vagas] = await Promise.all([getVertebraLeads(), getVagasConfig()])

  return (
    <DashboardLayout userRoles={roles}>
      <PropostasBoard initialLeads={leads} vagas={vagas} />
    </DashboardLayout>
  )
}
