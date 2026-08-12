"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type EsteiraRegion = "nacional" | "global"

export interface EsteiraProduct {
  id: number
  region: EsteiraRegion
  link: string
  item_date: string
  is_done: boolean
  done_at: string | null
  created_at: string
}

// Acesso: apenas Admin e usuários com o módulo "esteira".
async function canManageEsteira() {
  const { user } = await getSession()
  if (!user) return false
  return user.roles.includes("admin") || user.roles.includes("esteira")
}

export async function createEsteiraTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_esteira_products (
      id SERIAL PRIMARY KEY,
      region TEXT NOT NULL DEFAULT 'nacional',
      link TEXT NOT NULL,
      item_date DATE NOT NULL DEFAULT CURRENT_DATE,
      is_done BOOLEAN NOT NULL DEFAULT FALSE,
      done_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function getEsteiraProducts(): Promise<EsteiraProduct[]> {
  if (!(await canManageEsteira())) return []
  try {
    const rows = await sql`
      SELECT * FROM pg_esteira_products
      ORDER BY item_date DESC, created_at DESC
    `
    return rows as EsteiraProduct[]
  } catch {
    return []
  }
}

export async function addEsteiraProduct(data: {
  region: EsteiraRegion
  link: string
  itemDate?: string
}): Promise<{ success: boolean; error?: string; product?: EsteiraProduct }> {
  if (!(await canManageEsteira())) {
    return { success: false, error: "Não autorizado" }
  }
  const region: EsteiraRegion = data.region === "global" ? "global" : "nacional"
  const link = data.link?.trim()
  if (!link) {
    return { success: false, error: "Informe o link do produto" }
  }

  try {
    const itemDate = data.itemDate && data.itemDate.trim() !== "" ? data.itemDate : new Date().toISOString().slice(0, 10)
    const rows = await sql`
      INSERT INTO pg_esteira_products (region, link, item_date)
      VALUES (${region}, ${link}, ${itemDate})
      RETURNING *
    `
    revalidatePath("/demandas")
    return { success: true, product: (rows as EsteiraProduct[])[0] }
  } catch (error) {
    console.error("Add esteira product error:", error)
    return { success: false, error: "Erro ao adicionar produto" }
  }
}

// Marca/desmarca como realizado. Ao marcar, arquiva automaticamente (done_at = agora);
// ao desmarcar, volta para a esteira ativa (done_at = null).
export async function toggleEsteiraDone(
  id: number,
  done: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!(await canManageEsteira())) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    if (done) {
      await sql`UPDATE pg_esteira_products SET is_done = TRUE, done_at = NOW() WHERE id = ${id}`
    } else {
      await sql`UPDATE pg_esteira_products SET is_done = FALSE, done_at = NULL WHERE id = ${id}`
    }
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Toggle esteira done error:", error)
    return { success: false, error: "Erro ao atualizar produto" }
  }
}

export async function deleteEsteiraProduct(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await canManageEsteira())) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`DELETE FROM pg_esteira_products WHERE id = ${id}`
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete esteira product error:", error)
    return { success: false, error: "Erro ao excluir produto" }
  }
}
