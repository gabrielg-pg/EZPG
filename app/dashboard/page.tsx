import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await requireAuth()

  // ✅ garante que roles é sempre array
  const roles = Array.isArray(user.role)
    ? user.role
    : user.role
      ? [String(user.role).toLowerCase()]
      : []

  // Se só tem role comercial (e não admin), redireciona para reuniões
  if (roles.includes("comercial") && !roles.includes("admin")) {
    redirect("/reunioes")
  }

  return (
    <div>
      {/* seu conteúdo */}
    </div>
  )
}
