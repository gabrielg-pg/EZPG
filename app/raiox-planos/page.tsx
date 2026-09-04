import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RaioxPlanos } from "@/components/raiox-planos"
import { getRaioxState } from "@/app/actions/raiox-actions"

export const dynamic = "force-dynamic"

export default async function RaioxPlanosPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso restrito: somente Admin (dados de margem sensíveis)
  if (!roles.includes("admin")) {
    redirect("/dashboard")
  }

  const state = await getRaioxState()

  return (
    <DashboardLayout userRoles={roles}>
      <RaioxPlanos initialState={state} />
    </DashboardLayout>
  )
}
