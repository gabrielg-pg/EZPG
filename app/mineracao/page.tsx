import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MineracaoPanel } from "@/components/mineracao-panel"
import { createClientStoresTable, getClientStores } from "@/app/actions/client-store-actions"
import { createAccessCredentialsTable, getAccessCredentials } from "@/app/actions/access-actions"
import {
  createMiningExtensionsTable,
  getMiningExtensions,
  createUsefulCodesTable,
  getUsefulCodes,
} from "@/app/actions/mining-tools-actions"

export default async function MineracaoPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())

  // Acesso restrito: Admin e membros de Mineração
  if (!roles.some((r) => ["admin", "mineracao"].includes(r))) {
    redirect("/dashboard")
  }

  await createClientStoresTable()
  await createAccessCredentialsTable()
  await createMiningExtensionsTable()
  await createUsefulCodesTable()
  const clientStores = await getClientStores()
  const accessCredentials = await getAccessCredentials()
  const miningExtensions = await getMiningExtensions()
  const usefulCodes = await getUsefulCodes()

  return (
    <DashboardLayout userRoles={roles}>
      <MineracaoPanel
        initialClientStores={clientStores}
        initialCredentials={accessCredentials}
        initialExtensions={miningExtensions}
        initialUsefulCodes={usefulCodes}
      />
    </DashboardLayout>
  )
}
