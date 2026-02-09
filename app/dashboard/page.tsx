import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreCards } from "@/components/store-cards"
import { getStores } from "@/app/actions/store-actions"
import type { StoreData } from "@/types/store"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Normaliza a role do usuário
  const userRole = user.role?.toLowerCase() || ""
  const roles = [userRole]

  // Comercial vai para reuniões
  if (userRole === "comercial") {
    redirect("/reunioes")
  }

  // Somente admin acessa o dashboard
  if (userRole !== "admin" && userRole !== "zona_execucao") {
    redirect("/zona-de-execucao")
  }

  const stores = (await getStores()) as StoreData[]

  return (
    <DashboardLayout userRoles={roles}>
      <StoreCards initialStores={stores} />
    </DashboardLayout>
  )
}
