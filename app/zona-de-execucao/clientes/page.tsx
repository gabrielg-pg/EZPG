export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientesPanel } from "@/components/clientes-panel"
import { createClientesTables, getClientes } from "@/app/actions/clientes-actions"

export default async function ClientesPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso somente para Admin
  if (!roles.includes("admin")) {
    redirect("/zona-de-execucao")
  }

  await createClientesTables()
  const clientes = await getClientes()

  return (
    <DashboardLayout userRoles={roles}>
      <ClientesPanel initialClientes={clientes} />
    </DashboardLayout>
  )
}
