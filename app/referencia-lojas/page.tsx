import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreReference } from "@/components/store-reference"

export default async function ReferenciaLojasPage() {
  const user = await requireAuth()
  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]
  if (!["admin", "comercial", "zona_execucao"].includes(userRole)) {
    redirect("/login")
  }
  return (
    <DashboardLayout userRoles={roles}>
      <StoreReference />
    </DashboardLayout>
  )
}
