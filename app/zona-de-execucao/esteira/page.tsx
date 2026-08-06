export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EsteiraBoard } from "@/components/esteira-board"
import { createEsteiraTable, getEsteiraProducts } from "@/app/actions/esteira-actions"

export default async function EsteiraPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso permitido apenas para Admin e usuários com a tag Esteira
  if (!roles.some((r) => ["admin", "esteira"].includes(r))) {
    redirect("/zona-de-execucao")
  }

  await createEsteiraTable()
  const products = await getEsteiraProducts()

  return (
    <DashboardLayout userRoles={roles}>
      <EsteiraBoard initialProducts={products} />
    </DashboardLayout>
  )
}
