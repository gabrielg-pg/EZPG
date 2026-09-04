import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CofreVault } from "@/components/cofre-vault"
import { getCofreItems, createCofreTable } from "@/app/actions/cofre-actions"

export const dynamic = "force-dynamic"

export default async function CofrePage() {
  const user = await requireAuth()
  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]
  if (userRole !== "admin") redirect("/dashboard")

  await createCofreTable()
  const items = await getCofreItems()

  return (
    <DashboardLayout userRoles={roles}>
      <CofreVault initialItems={items as any} />
    </DashboardLayout>
  )
}
