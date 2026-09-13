export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BlogPanel } from "@/components/blog-panel"
import { getBlogData } from "@/app/actions/blog-actions"

export default async function BlogPage() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())

  // Somente admin ou usuários com a permissão de módulo "blog".
  if (!roles.some((r) => ["admin", "blog"].includes(r))) {
    redirect("/dashboard")
  }

  const year = new Date().getFullYear()
  const { keywords, articles } = await getBlogData(year)

  return (
    <DashboardLayout userRoles={roles}>
      <BlogPanel initialKeywords={keywords} initialArticles={articles} year={year} roles={roles} />
    </DashboardLayout>
  )
}
