"use server"

import { login, logout, createUser, getSession, initializeAdminUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  // Initialize admin user if not exists
  await initializeAdminUser()

  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const result = await login(username, password)

  if (result.success) {
    // Get user session to determine redirect (considera TODAS as roles, não só a role legada)
    const { user } = await getSession()
    const roles = (user?.roles ?? (user?.role ? [user.role] : [])).map((r) => (r ?? "").toLowerCase())
    return { success: true, redirectTo: resolveLandingPage(roles) }
  }

  return result
}

// Escolhe a primeira página de destino a que o usuário realmente tem acesso, por ordem de
// prioridade. Evita mandar o usuário para uma rota cujo guard o expulsaria (ex.: um usuário
// só com o módulo "blog" não pode entrar em /zona-de-execucao).
function resolveLandingPage(roles: string[]): string {
  if (roles.includes("admin")) return "/dashboard"
  if (roles.includes("zona_execucao")) return "/zona-de-execucao"
  if (roles.includes("comercial")) return "/reunioes"
  if (roles.includes("gestor_ads")) return "/zona-de-execucao/criativos"
  if (roles.includes("mineracao")) return "/mineracao"
  if (roles.includes("blog")) return "/blog"
  // "user" e qualquer outra role básica têm acesso a Demandas.
  return "/demandas"
}

export async function logoutAction() {
  await logout()
  redirect("/login")
}

export async function createUserAction(data: {
  username: string
  email: string
  password: string
  name: string
  role: string[]
}) {
  const { user } = await getSession()
  if (!user || !user.role.includes("admin")) {
    return { success: false, error: "Não autorizado" }
  }

  // Persistimos EXATAMENTE as permissões marcadas pelo admin (fonte da verdade: user_roles).
  const selectedRoles = Array.from(new Set(data.role.filter((r) => r && r.trim() !== "")))
  if (selectedRoles.length === 0) {
    return { success: false, error: "Selecione ao menos uma permissão para o usuário" }
  }

  // "blog" e outros módulos não podem virar a role primária de users.role (constraint só aceita
  // níveis de acesso). users.role é apenas um espelho técnico; o array selecionado é preservado.
  const MODULE_ROLES = ["blog", "esteira", "nexus_growth"]
  const accessRoles = selectedRoles.filter((r) => !MODULE_ROLES.includes(r))
  const primaryRole = accessRoles[0] || "user"
  const result = await createUser({ ...data, role: primaryRole, roles: selectedRoles })
  if (result.success) {
    revalidatePath("/admin")
  }
  return result
}
