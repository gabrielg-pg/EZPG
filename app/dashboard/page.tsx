import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StoreCards } from "@/components/store-cards"
import { requireAuth } from "@/lib/auth"
import { getStores } from "@/app/actions/store-actions"
import type { StoreData } from "@/types/store"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Se só tem role comercial (e não admin), redireciona para Reuniões
  if (user.roles.includes("comercial") && !user.roles.includes("admin")) {
    redirect("/reunioes")
  }

  // Se não tem role admin, não pode ver o dashboard
  if (!user.roles.includes("admin")) {
    redirect("/login")
  }

  const stores = await getStores() as StoreData[]

  return (
    <DashboardLayout userRoles={user.roles}>
      <StoreCards initialStores={stores} />
    </DashboardLayout>
  )
}
