import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FunilDashboard } from "@/components/funil/funil-dashboard"
import { ensureQuizLeadsTable, listQuizLeads } from "@/lib/quiz-db"

export const dynamic = "force-dynamic"

export default async function FunilPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso restrito: Admin ou quem tiver a permissão de módulo "funil"
  if (!roles.some((r) => ["admin", "funil"].includes(r))) {
    redirect("/dashboard")
  }

  await ensureQuizLeadsTable()
  const leads = await listQuizLeads()

  return (
    <DashboardLayout userRoles={roles}>
      <FunilDashboard initialLeads={leads} />
    </DashboardLayout>
  )
}
