export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { GrowthClientsPanel } from "@/components/growth-clients-panel"
import { createGrowthClientsTables, getGrowthClients } from "@/app/actions/growth-clients-actions"

export default async function GrowthClientesPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso somente para Admin
  if (!roles.includes("admin")) {
    redirect("/zona-de-execucao")
  }

  await createGrowthClientsTables()
  const clients = await getGrowthClients()

  return (
    <DashboardLayout userRoles={roles}>
      <GrowthClientsPanel initialClients={clients} />
    </DashboardLayout>
  )
}
