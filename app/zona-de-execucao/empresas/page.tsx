import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EmpresasBoard } from "@/components/empresas-board"
import { createEmpresasTable, getEmpresas } from "@/app/actions/empresa-actions"

export default async function EmpresasPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso: Admin e membros da Zona de Execução.
  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    redirect("/zona-de-execucao")
  }

  await createEmpresasTable()
  const empresas = await getEmpresas()

  return (
    <DashboardLayout userRoles={roles}>
      <EmpresasBoard initialEmpresas={empresas} />
    </DashboardLayout>
  )
}
