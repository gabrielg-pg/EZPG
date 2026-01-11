import { requireComercialOrAdmin } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MeetingsScheduler } from "@/components/meetings-scheduler"

export default async function ReunioesPage() {
  const user = await requireComercialOrAdmin()

  return (
    <DashboardLayout userRole={user.role}>
      <MeetingsScheduler currentUserId={user.id} />
    </DashboardLayout>
  )
}
