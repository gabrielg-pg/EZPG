import { FC } from "react"
import { requireComercialOrAdmin } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MeetingsScheduler } from "@/components/meetings-scheduler"

export default async function ReunioesPage() {
  const user = await requireComercialOrAdmin()

  if (!user) {
    throw new Error("User authentication failed")
  }

  return (
    <DashboardLayout userRoles={[user.role]}>
      <MeetingsScheduler currentUserId={user.id} />
    </DashboardLayout>
  )
}
