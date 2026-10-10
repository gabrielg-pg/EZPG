import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getMarket, getAdminAccess } from "@/app/actions/market-guide-actions"
import { MarketGuideDetail } from "@/components/market-guide/market-guide-detail"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function MarketDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getMarket(slug)
  if (!data) notFound()
  const [session, admin] = await Promise.all([getSession(), getAdminAccess()])
  const roles = Array.from(new Set([session?.user?.role, ...(session?.user?.roles ?? [])].filter(Boolean))) as string[]
  return <DashboardLayout userRoles={roles}><MarketGuideDetail initial={data} isAdmin={admin} /></DashboardLayout>
}
