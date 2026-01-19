"use server"

import { login, logout, createUser, getSession, initializeAdminUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  // Initialize admin user if not exists
  await initializeAdminUser()

  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const result = await login(username, password)

  if (result.success) {
    redirect("/dashboard")
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
