import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExecutionZoneCards } from "@/components/execution-zone-cards"

export default async function ZonaDeExecucaoPage() {
  const user = await requireAuth()

  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]

  // Acesso permitido para admin, comercial e zona_execucao
  if (!["admin", "comercial", "zona_execucao"].includes(userRole)) {
    redirect("/login")
  }

  return (
    <DashboardLayout userRoles={roles}>
      <ExecutionZoneCards />
    </DashboardLayout>
  )
}
