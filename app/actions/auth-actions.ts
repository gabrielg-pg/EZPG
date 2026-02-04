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
    // Get user session to determine redirect destination based on role
    const { user } = await getSession()
    
    if (user) {
      const role = user.role?.toLowerCase() || ""
      
      // Redirect based on role
      if (role === "admin") {
        return { success: true, redirectTo: "/dashboard" }
      } else if (role === "comercial") {
        return { success: true, redirectTo: "/reunioes" }
      } else if (role === "zona_execucao") {
        return { success: true, redirectTo: "/zona-de-execucao" }
      } else {
        // Default fallback for other roles
        return { success: true, redirectTo: "/dashboard" }
      }
    }
    
    return { success: true, redirectTo: "/dashboard" }
  }

  return result
}

export async function logoutAction() {
  await logout()
  redirect("/")
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
