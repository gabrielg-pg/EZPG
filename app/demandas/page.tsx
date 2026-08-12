import { requireAuth } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DemandasBoard } from "@/components/demandas-board"
import { DemandasExtras } from "@/components/demandas-extras"
import { EsteiraBoard } from "@/components/esteira-board"
import { createDemandasTable, getDemandas } from "@/app/actions/demandas-actions"
import { createEsteiraTable, getEsteiraProducts } from "@/app/actions/esteira-actions"
import { getWeekStart } from "@/lib/week"

export default async function DemandasPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  await createDemandasTable()
  await createEsteiraTable()

  const weekStart = getWeekStart()
  const demandas = await getDemandas(weekStart)
  const esteiraProducts = await getEsteiraProducts()

  return (
    <DashboardLayout userRoles={roles}>
      <div className="space-y-6">
        <DemandasBoard initialDemandas={demandas} weekStart={weekStart} />
        <EsteiraBoard initialProducts={esteiraProducts} />
        <DemandasExtras />
      </div>
    </DashboardLayout>
  )
}
