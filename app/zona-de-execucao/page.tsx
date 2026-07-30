import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExecutionZoneCards } from "@/components/execution-zone-cards"

export default async function ZonaDeExecucaoPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso permitido para admin, comercial, zona_execucao, gestor_ads e mineracao
  if (!roles.some((r) => ["admin", "comercial", "zona_execucao", "gestor_ads", "mineracao"].includes(r))) {
    redirect("/login")
  }

  // Gestor de ADS (sem ser admin) só enxerga a aba Criativos — vai direto para ela
  if (roles.includes("gestor_ads") && !roles.includes("admin")) {
    redirect("/zona-de-execucao/criativos")
  }

  return (
    <DashboardLayout userRoles={roles}>
      <ExecutionZoneCards />
    </DashboardLayout>
  )
}
