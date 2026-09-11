export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VertebraNaming } from "@/components/vertebra-naming"
import { createNamingTables, getNamingData } from "@/app/actions/naming-actions"

export default async function VertebraNamingPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())

  // Acesso permitido para admin e usuários com Zona de Execução
  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    redirect("/dashboard")
  }

  await createNamingTables()
  const { niches, names } = await getNamingData()

  return (
    <DashboardLayout userRoles={roles}>
      <VertebraNaming initialNiches={niches} initialNames={names} />
    </DashboardLayout>
  )
}
