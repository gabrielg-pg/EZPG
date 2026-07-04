"use server"

import { login, logout, createUser, getSession, initializeAdminUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function loginAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; redirectTo?: string }> {
  // Garante que o admin AEESJB exista
  await initializeAdminUser()

  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const result = await login(username, password)

  if (result.success) {
    return { success: true, redirectTo: "/financeiro" }
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
  role: string
}) {
  const { user } = await getSession()
  if (!user || user.role !== "admin") {
    return { success: false, error: "Não autorizado" }
  }

  const result = await createUser({ ...data, role: data.role || "user" })
  if (result.success) {
    revalidatePath("/admin")
  }
  return result
}
