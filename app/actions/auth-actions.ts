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
    // Get user session to determine redirect
    const { user } = await getSession()
    const role = user?.role?.toLowerCase() || ""
    
    let redirectTo = "/dashboard"
    if (role === "comercial") {
      redirectTo = "/reunioes"
    } else if (role !== "admin") {
      redirectTo = "/zona-de-execucao"
    }
    
    return { success: true, redirectTo }
  }

  return result
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

  // "blog" e outros módulos são permissões, não níveis de acesso: nunca podem virar a role
  // primária de users.role (constraint só aceita níveis de acesso). Filtramos os módulos e
  // usamos o primeiro nível de acesso como role primária, com "user" como padrão.
  const MODULE_ROLES = ["blog"]
  const accessRoles = data.role.filter((r) => !MODULE_ROLES.includes(r))
  const primaryRole = accessRoles[0] || "user"
  const allRoles = Array.from(new Set([primaryRole, ...data.role]))
  const result = await createUser({ ...data, role: primaryRole, roles: allRoles })
  if (result.success) {
    revalidatePath("/admin")
  }
  return result
}
