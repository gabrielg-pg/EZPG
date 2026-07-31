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
    // Persistimos EXATAMENTE as permissões marcadas pelo admin — nada é adicionado
    // automaticamente. O array de roles é a fonte da verdade (tabela user_roles).
    const selectedRoles = Array.from(new Set(data.roles.filter((r) => r && r.trim() !== "")))
    if (selectedRoles.length === 0) {
      return { success: false, error: "Selecione ao menos uma permissão para o usuário" }
    }

    // users.role é apenas um espelho técnico (compat. legada) e sua constraint NÃO aceita
    // módulos como "blog". Usamos o primeiro NÍVEL DE ACESSO marcado; se só houver módulos
    // selecionados, gravamos "user" na coluna espelho — mas user_roles guarda exatamente o
    // que foi marcado (é o que de fato controla o acesso no sistema).
    const MODULE_ROLES = ["blog"]
    const accessRoles = selectedRoles.filter((r) => !MODULE_ROLES.includes(r))
    const primaryRole = accessRoles[0] || "user"

    await sql`
      UPDATE users 
      SET name = ${data.name}, email = ${data.email}, role = ${primaryRole}, status = ${data.status}, updated_at = NOW()
      WHERE id = ${userId}
    `

    // Substitui as roles pelo conjunto exato selecionado.
    await sql`DELETE FROM user_roles WHERE user_id = ${userId}`
    for (const role of selectedRoles) {
      await sql`INSERT INTO user_roles (user_id, role) VALUES (${userId}, ${role})`
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Erro ao atualizar usuário" }
  }
}

// transferToUserId é OPCIONAL. Se informado, os registros do usuário são transferidos para
// o destino antes da exclusão. Se não, o usuário é excluído diretamente (sem transferência).
export async function deleteUser(userId: number, transferToUserId?: number | null) {
  const { user } = await getSession()
  if (!user || !user.role.includes("admin")) {
    return { success: false, error: "Não autorizado" }
  }

  // Don't allow deleting yourself
  if (user.id === userId) {
    return { success: false, error: "Não é possível excluir o próprio usuário" }
  }

  if (transferToUserId && transferToUserId === userId) {
    return { success: false, error: "Não é possível transferir para o mesmo usuário" }
  }

  try {
    if (transferToUserId) {
      // Modo transferência: reatribui os registros ao usuário escolhido.
      await sql`UPDATE stores SET created_by = ${transferToUserId} WHERE created_by = ${userId}`
      await sql`UPDATE meetings SET attendant_user_id = ${transferToUserId} WHERE attendant_user_id = ${userId}`
      await sql`UPDATE meetings SET performer_user_id = ${transferToUserId} WHERE performer_user_id = ${userId}`
      await sql`UPDATE demandas SET created_by = ${transferToUserId} WHERE created_by = ${userId}`
      await sql`UPDATE followups SET created_by = ${transferToUserId} WHERE created_by = ${userId}`
    } else {
      // Modo exclusão direta: solta as referências que aceitam NULL e remove as que não aceitam.
      await sql`UPDATE stores SET created_by = NULL WHERE created_by = ${userId}`
      await sql`UPDATE demandas SET created_by = NULL WHERE created_by = ${userId}`
      await sql`UPDATE followups SET created_by = NULL WHERE created_by = ${userId}`
      // meetings.attendant_user_id / performer_user_id são NOT NULL: as reuniões do usuário
      // são removidas junto com ele.
      await sql`DELETE FROM meetings WHERE attendant_user_id = ${userId} OR performer_user_id = ${userId}`
    }

    // user_roles e sessions têm ON DELETE CASCADE, mas removemos explicitamente por clareza.
    await sql`DELETE FROM user_roles WHERE user_id = ${userId}`
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`
    await sql`DELETE FROM users WHERE id = ${userId}`

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return { success: false, error: "Erro ao excluir usuário" }
  }
}
