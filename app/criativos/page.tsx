export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreativesBoard } from "@/components/creatives-board"
import { createCreativesTable, getCreatives } from "@/app/actions/creatives-actions"

export default async function CriativosPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((role) => role.toLowerCase())

  if (!roles.some((role) => ["admin", "gestor_ads"].includes(role))) {
    redirect("/zona-de-execucao")
  }

  await createCreativesTable()
  const creatives = await getCreatives()

  return (
    <DashboardLayout userRoles={roles}>
      <CreativesBoard initialCreatives={creatives} />
    </DashboardLayout>
  )
}
