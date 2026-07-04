"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type Vault = {
  id: number
  name: string
  description: string | null
  goal_amount: number
  color: string
  balance: number
  created_at: string
}

export type VaultMovement = {
  id: number
  vault_id: number
  type: "deposito" | "retirada"
  amount: number
  description: string | null
  occurred_on: string
  created_at: string
}

export type CofreSummary = {
  totalBalance: number
  totalGoal: number
  vaultCount: number
}

export async function getVaults(): Promise<Vault[]> {
  const { user } = await getSession()
  if (!user) return []

  const rows = await sql`
    SELECT
      v.id,
      v.name,
      v.description,
      v.goal_amount,
      v.color,
      v.created_at,
      COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'deposito'), 0)
        - COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'retirada'), 0) AS balance
    FROM cofre_vaults v
    LEFT JOIN cofre_movements m ON m.vault_id = v.id
    GROUP BY v.id
    ORDER BY v.created_at ASC, v.id ASC
  `

  return rows.map((r: any) => ({
    ...r,
    goal_amount: Number(r.goal_amount),
    balance: Number(r.balance),
  })) as Vault[]
}

export async function getCofreSummary(): Promise<CofreSummary> {
  const { user } = await getSession()
  if (!user) return { totalBalance: 0, totalGoal: 0, vaultCount: 0 }

  const rows = await sql`
    SELECT
      COALESCE(SUM(dep), 0) - COALESCE(SUM(ret), 0) AS total_balance,
      COALESCE(SUM(goal), 0) AS total_goal,
      COUNT(*) AS vault_count
    FROM (
      SELECT
        v.id,
        v.goal_amount AS goal,
        COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'deposito'), 0) AS dep,
        COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'retirada'), 0) AS ret
      FROM cofre_vaults v
      LEFT JOIN cofre_movements m ON m.vault_id = v.id
      GROUP BY v.id
    ) t
  `

  return {
    totalBalance: Number(rows[0]?.total_balance ?? 0),
    totalGoal: Number(rows[0]?.total_goal ?? 0),
    vaultCount: Number(rows[0]?.vault_count ?? 0),
  }
}

export async function getVaultMovements(vaultId: number): Promise<VaultMovement[]> {
  const { user } = await getSession()
  if (!user) return []

  const rows = await sql`
    SELECT id, vault_id, type, amount, description, occurred_on, created_at
    FROM cofre_movements
    WHERE vault_id = ${vaultId}
    ORDER BY occurred_on DESC, id DESC
  `

  return rows.map((r: any) => ({ ...r, amount: Number(r.amount) })) as VaultMovement[]
}

export async function createVault(data: {
  name: string
  description?: string
  goal_amount?: number
  color?: string
}) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  if (!data.name?.trim()) {
    return { success: false, error: "Informe o nome do cofre" }
  }

  try {
    const rows = await sql`
      INSERT INTO cofre_vaults (name, description, goal_amount, color, created_by)
      VALUES (
        ${data.name.trim()},
        ${data.description?.trim() || null},
        ${data.goal_amount || 0},
        ${data.color || "#DC2626"},
        ${user.id}
      )
      RETURNING id
    `
    revalidatePath("/cofre")
    return { success: true, id: rows[0]?.id as number }
  } catch (error) {
    console.error("Create vault error:", error)
    return { success: false, error: "Erro ao criar cofre" }
  }
}

export async function updateVault(
  id: number,
  data: { name: string; description?: string; goal_amount?: number; color?: string },
) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  if (!data.name?.trim()) {
    return { success: false, error: "Informe o nome do cofre" }
  }

  try {
    await sql`
      UPDATE cofre_vaults
      SET name = ${data.name.trim()},
          description = ${data.description?.trim() || null},
          goal_amount = ${data.goal_amount || 0},
          color = ${data.color || "#DC2626"}
      WHERE id = ${id}
    `
    revalidatePath("/cofre")
    return { success: true }
  } catch (error) {
    console.error("Update vault error:", error)
    return { success: false, error: "Erro ao atualizar cofre" }
  }
}

export async function deleteVault(id: number) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`DELETE FROM cofre_movements WHERE vault_id = ${id}`
    await sql`DELETE FROM cofre_vaults WHERE id = ${id}`
    revalidatePath("/cofre")
    return { success: true }
  } catch (error) {
    console.error("Delete vault error:", error)
    return { success: false, error: "Erro ao excluir cofre" }
  }
}

export async function createMovement(data: {
  vault_id: number
  type: "deposito" | "retirada"
  amount: number
  description?: string
  occurred_on?: string
}) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  if (!data.amount || data.amount <= 0) {
    return { success: false, error: "Informe um valor válido" }
  }

  try {
    await sql`
      INSERT INTO cofre_movements (vault_id, type, amount, description, occurred_on, created_by)
      VALUES (
        ${data.vault_id},
        ${data.type},
        ${data.amount},
        ${data.description?.trim() || null},
        ${data.occurred_on || new Date().toISOString().slice(0, 10)},
        ${user.id}
      )
    `
    revalidatePath("/cofre")
    return { success: true }
  } catch (error) {
    console.error("Create movement error:", error)
    return { success: false, error: "Erro ao registrar movimento" }
  }
}

export async function deleteMovement(id: number) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`DELETE FROM cofre_movements WHERE id = ${id}`
    revalidatePath("/cofre")
    return { success: true }
  } catch (error) {
    console.error("Delete movement error:", error)
    return { success: false, error: "Erro ao excluir movimento" }
  }
}
