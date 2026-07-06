import { requireAuth } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KnowledgeBase } from "@/components/knowledge-base"

export default async function BaseConhecimentoPage() {
  const user = await requireAuth()
  const roles = [user.role?.toLowerCase() || "user"]

  return (
    <DashboardLayout userRoles={roles}>
      <KnowledgeBase />
    </DashboardLayout>
  )
}
