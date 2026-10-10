import { requireAdmin } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CerebroBoard } from "@/components/cerebro/cerebro-board"
import { getCerebroItems } from "@/app/actions/cerebro-actions"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Cérebro | PRO GROWTH GLOBAL",
}

export default async function CerebroPage() {
  const user = await requireAdmin()
  const roles = Array.from(new Set([user.role, ...(user.roles ?? [])].filter(Boolean)))
  const result = await getCerebroItems()

  return (
    <DashboardLayout userRoles={roles}>
      <CerebroBoard initialItems={result.ok ? result.data : []} loadError={result.ok ? null : result.error} />
    </DashboardLayout>
  )
}
