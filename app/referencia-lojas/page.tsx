import { requireAuth } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreReference } from "@/components/store-reference"
import {
  createStoreReferencesTable,
  getStoreReferences,
  createStoreReferenceCountriesTable,
  getStoreReferenceCountries,
} from "@/app/actions/store-reference-actions"

export default async function ReferenciaLojasPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  await createStoreReferencesTable()
  await createStoreReferenceCountriesTable()
  const stores = await getStoreReferences()
  const countries = await getStoreReferenceCountries()

  return (
    <DashboardLayout userRoles={roles}>
      <StoreReference initialStores={stores} initialCountries={countries} />
    </DashboardLayout>
  )
}
