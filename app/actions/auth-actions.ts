"use server"

import { login, logout, createUser, getSession, initializeAdminUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  try {
    console.log("[v0] loginAction started")
    
    // Initialize admin user if not exists
    await initializeAdminUser()

    const username = formData.get("username") as string
    const password = formData.get("password") as string
    
    console.log("[v0] Attempting login for:", username)

    const result = await login(username, password)
    console.log("[v0] Login result:", result)

    if (result.success) {
      // Get user session to determine redirect
      const { user } = await getSession()
      console.log("[v0] User session:", user)
      const role = user?.role?.toLowerCase() || ""
      
      let redirectTo = "/dashboard"
      if (role !== "admin" && role !== "comercial" && role !== "zona_execucao") {
        redirectTo = "/login"
      }
      
      console.log("[v0] Redirect to:", redirectTo)
      return { success: true, redirectTo }
    }

    return result
  } catch (error) {
    console.error("[v0] loginAction error:", error)
    return { success: false, error: "Erro interno ao fazer login" }
  }
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

  // Use primary role for legacy field
  const primaryRole = data.role[0] || "user"
  const result = await createUser({ ...data, role: primaryRole })
  if (result.success) {
    revalidatePath("/admin")
  }
  return result
}
