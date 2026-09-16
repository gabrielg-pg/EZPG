export const dynamic = "force-dynamic"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FunisGrowthDashboard } from "@/components/funis-growth-dashboard"
import { getGrowthAnalytics } from "@/app/actions/growth-actions"
import { requireAdmin } from "@/lib/auth"

export default async function FunisGrowthPage() {
  const user = await requireAdmin()
  const leads = await getGrowthAnalytics()
  const roles = Array.isArray((user as any).roles) ? (user as any).roles : [String((user as any).role || "admin")]
  return <DashboardLayout userRoles={roles}><FunisGrowthDashboard initialLeads={leads} /></DashboardLayout>
}
