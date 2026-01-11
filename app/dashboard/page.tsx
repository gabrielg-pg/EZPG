import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreCards } from "@/components/store-cards"
import { requireAuth } from "@/lib/auth"
import { getStores } from "@/app/actions/store-actions"

export default async function DashboardPage() {
  const user = await requireAuth()
  const stores = await getStores()

  return (
    <DashboardLayout userRole={user.role}>
      <StoreCards initialStores={stores} />
    </DashboardLayout>
  )
}
