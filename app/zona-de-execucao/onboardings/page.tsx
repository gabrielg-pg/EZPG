export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OnboardingPanel } from "@/components/onboarding-panel"
import { ensureOnboardingSeed, getOnboardingMessages } from "@/app/actions/onboarding-actions"

export default async function OnboardingsPage() {
  const user = await requireAuth()

  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())

  // Acesso permitido para admin e usuários com Zona de Execução
  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    redirect("/dashboard")
  }

  await ensureOnboardingSeed()
  const messages = await getOnboardingMessages()

  return (
    <DashboardLayout userRoles={roles}>
      <OnboardingPanel initialMessages={messages} />
    </DashboardLayout>
  )
}
