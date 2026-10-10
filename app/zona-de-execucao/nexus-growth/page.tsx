export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { NexusGrowthPanel } from "@/components/nexus-growth-panel"
import {
  ensureNexusTables,
  getNexusContents,
  getNexusCredentials,
} from "@/app/actions/nexus-actions"

export default async function NexusGrowthPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso para Admin ou parceiro com a permissão Nexus Growth
  if (!roles.includes("admin") && !roles.includes("nexus_growth")) {
    redirect("/zona-de-execucao")
  }

  await ensureNexusTables()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-12

  const [contentsRes, credentialsRes] = await Promise.all([
    getNexusContents(year, month),
    getNexusCredentials(),
  ])

  return (
    <DashboardLayout userRoles={roles}>
      <NexusGrowthPanel
        initialYear={year}
        initialMonth={month}
        initialContents={contentsRes.contents}
        initialCredentials={credentialsRes.credentials}
        isAdmin={roles.includes("admin")}
      />
    </DashboardLayout>
  )
}
