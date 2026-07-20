import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PgDashVault } from "@/components/pg-dash-vault"
import { getPgDashAccounts, createPgDashTable } from "@/app/actions/pg-dash-actions"

export const dynamic = "force-dynamic"

export default async function PgDashPage() {
  const user = await requireAuth()
  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]
  if (userRole !== "admin") redirect("/dashboard")

  await createPgDashTable()
  const items = await getPgDashAccounts()

  return (
    <DashboardLayout userRoles={roles}>
      <PgDashVault initialItems={items as any} />
    </DashboardLayout>
  )
}
