import { requireAuth } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DemandasBoard } from "@/components/demandas-board"
import { createDemandasTable, getDemandas, getWeekStart } from "@/app/actions/demandas-actions"

export default async function DemandasPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || ""]

  await createDemandasTable()

  const weekStart = getWeekStart()
  const demandas = await getDemandas(weekStart)

  return (
    <DashboardLayout userRoles={roles}>
      <DemandasBoard initialDemandas={demandas} weekStart={weekStart} />
    </DashboardLayout>
  )
}
