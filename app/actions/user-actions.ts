"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  const { user } = await getSession()
  if (!user || user.role !== "admin") return []

  const users = await sql`
    SELECT id, username, email, name, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `

  return users
}

export async function updateUser(
  userId: number,
  data: {
    name: string
    email: string
    role: string
    status: string
  },
) {
  const { user } = await getSession()
  if (!user || user.role !== "admin") {
    return { success: false, error: "Não autorizado" }
  }

  try {
    await sql`
      UPDATE users 
      SET name = ${data.name}, email = ${data.email}, role = ${data.role}, status = ${data.status}, updated_at = NOW()
      WHERE id = ${userId}
    `

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Erro ao atualizar usuário" }
  }
}

export async function deleteUser(userId: number) {
  const { user } = await getSession()
  if (!user || user.role !== "admin") {
    return { success: false, error: "Não autorizado" }
  }

  // Don't allow deleting yourself
  if (user.id === userId) {
    return { success: false, error: "Não é possível excluir o próprio usuário" }
  }

  try {
    await sql`DELETE FROM users WHERE id = ${userId}`
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return { success: false, error: "Erro ao excluir usuário" }
  }
}
