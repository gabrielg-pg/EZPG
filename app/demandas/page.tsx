import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DemandasBoard } from "@/components/demandas-board"
import {
  getDemandas,
  getCompletedToday,
  resetDailyCompletions,
} from "@/app/actions/demandas-actions"

async function getUserRoles(userId: number): Promise<string[]> {
  const roles = await sql`
    SELECT role FROM user_roles WHERE user_id = ${userId}
  `
  return roles.map((r) => r.role)
}

export default async function DemandasPage() {
  const { user } = await getSession()
  if (!user) {
    redirect("/login")
  }

  // Reset completions from previous days
  await resetDailyCompletions()

  const roles = await getUserRoles(user.id)
  const allRoles = [...new Set([user.role, ...roles])]

  const { demandas, isAdmin } = await getDemandas()
  const completedToday = await getCompletedToday()

  return (
    <DashboardLayout userRoles={allRoles}>
      <DemandasBoard
        initialDemandas={demandas}
        completedToday={completedToday}
        isAdmin={isAdmin}
      />
    </DashboardLayout>
  )
}
