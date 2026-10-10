import { DashboardLayout } from "@/components/dashboard-layout"
import { getMarkets, getAdminAccess } from "@/app/actions/market-guide-actions"
import { MarketGuideList } from "@/components/market-guide/market-guide-list"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "Guia de Mercados | PRO GROWTH GLOBAL" }

export default async function MarketGuidePage() {
  const [session, markets, admin] = await Promise.all([getSession(), getMarkets(), getAdminAccess()])
  const roles = Array.from(new Set([session?.user?.role, ...(session?.user?.roles ?? [])].filter(Boolean))) as string[]
  return <DashboardLayout userRoles={roles}><MarketGuideList initialMarkets={markets} isAdmin={admin} /></DashboardLayout>
}

