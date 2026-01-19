"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  const { user } = await getSession()
  if (!user || !user.role.includes("admin")) return []

  const users = await sql`
    SELECT id, username, email, name, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `

  // Fetch roles for all users
  const userRoles = await sql`
    SELECT user_id, role FROM user_roles
  `
  
  // Group roles by user_id
  const rolesMap: Record<number, string[]> = {}
  for (const ur of userRoles) {
    if (!rolesMap[ur.user_id]) {
      rolesMap[ur.user_id] = []
    }
    rolesMap[ur.user_id].push(ur.role)
  }
  
  // Add roles array to each user
  return (users as Array<{ id: number; role: string }>).map((u) => ({
    ...u,
    roles: rolesMap[u.id] || [u.role], // Fallback to legacy role
  }))
}

export async function updateUser(
  userId: number,
  data: {
    name: string
    email: string
    roles: string[]
    status: string
  },
) {
  const { user } = await getSession()
  if (!user || !user.role.includes("admin")) {
    return { success: false, error: "Não autorizado" }
  }

  try {
    // Update user basic info (keep first role as legacy role field)
    const primaryRole = data.roles[0] || "user"
    await sql`
      UPDATE users 
      SET name = ${data.name}, email = ${data.email}, role = ${primaryRole}, status = ${data.status}, updated_at = NOW()
      WHERE id = ${userId}
    `

    // Update user_roles table
    await sql`DELETE FROM user_roles WHERE user_id = ${userId}`
    
    for (const role of data.roles) {
      await sql`
        INSERT INTO user_roles (user_id, role) VALUES (${userId}, ${role})
      `
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Erro ao atualizar usuário" }
  }
}

export async function deleteUser(userId: number) {
  const { user } = await getSession()
  if (!user || !user.role.includes("admin")) {
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
