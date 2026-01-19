import { DashboardLayout } from "@/components/dashboard-layout"
import { NewStoreForm } from "@/components/new-store-form"
import { requireAuth } from "@/lib/auth"

export default async function NewStorePage() {
  const user = await requireAuth()

  return (
    <DashboardLayout userRoles={[user.role]}>
      <NewStoreForm />
    </DashboardLayout>
  )
}
