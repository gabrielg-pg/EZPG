import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreCards } from "@/components/store-cards"
import { getStores } from "@/app/actions/store-actions"
import type { StoreData } from "@/types/store"

export default async function DashboardPage() {
  const user = await requireAuth()

  // ✅ garante que roles seja sempre um array
  const roles = Array.isArray((user as any).roles)
    ? ((user as any).roles as string[]).map((r) => String(r).toLowerCase())
    : user.role
      ? [String(user.role).toLowerCase()]
      : []

  // 🔁 Comercial (sem admin) → reuniões
  if (roles.includes("comercial") && !roles.includes("admin")) {
    redirect("/reunioes")
  }

  // 🚫 Quem não é admin não acessa o dashboard
  if (!roles.includes("admin")) {
    redirect("/login")
  }

  const stores = (await getStores()) as StoreData[]

  return (
    <DashboardLayout userRoles={roles}>
      <StoreCards initialStores={stores} />
    </DashboardLayout>
  )
}
