import { requireAuth } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DemandasBoard } from "@/components/demandas-board"
import { DemandasExtras } from "@/components/demandas-extras"
import { EsteiraBoard } from "@/components/esteira-board"
import { MineracaoPanel } from "@/components/mineracao-panel"
import { StoreReference } from "@/components/store-reference"
import { createDemandasTable, getDemandas } from "@/app/actions/demandas-actions"
import { createEsteiraTable, getEsteiraProducts } from "@/app/actions/esteira-actions"
import { createClientStoresTable, getClientStores } from "@/app/actions/client-store-actions"
import { createAccessCredentialsTable, getAccessCredentials } from "@/app/actions/access-actions"
import { createStoreReferencesTable, getStoreReferences } from "@/app/actions/store-reference-actions"
import { getWeekStart } from "@/lib/week"

export default async function DemandasPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  await createDemandasTable()
  await createEsteiraTable()
  await createClientStoresTable()
  await createAccessCredentialsTable()
  await createStoreReferencesTable()

  const weekStart = getWeekStart()
  const demandas = await getDemandas(weekStart)
  const esteiraProducts = await getEsteiraProducts()
  const clientStores = await getClientStores()
  const accessCredentials = await getAccessCredentials()
  const storeReferences = await getStoreReferences()

  return (
    <DashboardLayout userRoles={roles}>
      <div className="space-y-6">
        <DemandasBoard initialDemandas={demandas} weekStart={weekStart} />
        <EsteiraBoard initialProducts={esteiraProducts} />
        <DemandasExtras />
        <MineracaoPanel initialClientStores={clientStores} initialCredentials={accessCredentials} />
        <StoreReference initialStores={storeReferences} />
      </div>
    </DashboardLayout>
  )
}
