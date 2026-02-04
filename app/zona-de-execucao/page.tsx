import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExecutionZoneCards } from "@/components/execution-zone-cards"

export default async function ZonaDeExecucaoPage() {
  const user = await requireAuth()

  const roles = Array.isArray((user as any).roles)
    ? ((user as any).roles as string[]).map((r) => String(r).toLowerCase())
    : user.role
      ? [String(user.role).toLowerCase()]
      : []

  if (!roles.includes("admin") && !roles.includes("comercial")) {
    redirect("/login")
  }

  return (
    <DashboardLayout userRoles={roles}>
      <ExecutionZoneCards />
    </DashboardLayout>
  )
}
