import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PgDashVault } from "@/components/pg-dash-vault"
import { getPgDashAccounts, createPgDashTable } from "@/app/actions/pg-dash-actions"

export const dynamic = "force-dynamic"

export default async function PgDashPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())

  // Acesso permitido para admin e usuários com Zona de Execução
  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    redirect("/dashboard")
  }

  await createPgDashTable()
  const items = await getPgDashAccounts()

  return (
    <DashboardLayout userRoles={roles}>
      <PgDashVault initialItems={items as any} />
    </DashboardLayout>
  )
}
