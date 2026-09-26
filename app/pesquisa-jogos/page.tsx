export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PesquisaJogosPanel } from "@/components/pesquisa-jogos-panel"

export default async function PesquisaJogosAdminPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || "user"]

  return (
    <DashboardLayout userRoles={roles}>
      <PesquisaJogosPanel />
    </DashboardLayout>
  )
}
