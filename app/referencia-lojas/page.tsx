import { requireAuth } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreReference } from "@/components/store-reference"
import { createStoreReferencesTable, getStoreReferences } from "@/app/actions/store-reference-actions"

export default async function ReferenciaLojasPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || ""]

  await createStoreReferencesTable()
  const stores = await getStoreReferences()

  return (
    <DashboardLayout userRoles={roles}>
      <StoreReference initialStores={stores} />
    </DashboardLayout>
  )
}
