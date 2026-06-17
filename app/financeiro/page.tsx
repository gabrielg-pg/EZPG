import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FinanceiroPanel } from "@/components/financeiro-panel"
import {
  createFinanceiroTables,
  getReceitas,
  getDespesas,
  getPagamentosColaborador,
  getResumoAnual,
} from "@/app/actions/financeiro-actions"

export const dynamic = "force-dynamic"

export default async function FinanceiroPage() {
  const user = await requireAuth()
  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]
  if (userRole !== "admin") redirect("/dashboard")

  await createFinanceiroTables()

  const now = new Date()
  const mes = now.getMonth() + 1
  const ano = now.getFullYear()

  const [receitas, despesas, pagamentos, resumoAnual] = await Promise.all([
    getReceitas(mes, ano),
    getDespesas(mes, ano),
    getPagamentosColaborador(mes, ano),
    getResumoAnual(ano),
  ])

  return (
    <DashboardLayout userRoles={roles}>
      <FinanceiroPanel
        initialReceitas={receitas}
        initialDespesas={despesas}
        initialPagamentos={pagamentos}
        resumoAnual={resumoAnual}
        currentMes={mes}
        currentAno={ano}
      />
    </DashboardLayout>
  )
}
