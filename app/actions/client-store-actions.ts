"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type ClientStoreType = "nacional" | "global"

export type ClientStoreEntry = {
  id: number
  name: string
  site: string
  niche: string
  type: ClientStoreType
  created_by: number | null
  created_by_name: string | null
  created_at: string
}

// Garante que a tabela existe (compartilhada por todos os usuários)
export async function createClientStoresTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_client_stores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      site VARCHAR(500) NOT NULL,
      niche VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL,
      created_by INTEGER,
      created_by_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// Busca TODAS as lojas de clientes (global, sem filtro por usuário)
export async function getClientStores(): Promise<ClientStoreEntry[]> {
  const stores = await sql`
    SELECT id, name, site, niche, type, created_by, created_by_name, created_at
    FROM pg_client_stores
    ORDER BY created_at ASC
  `
  return stores as ClientStoreEntry[]
}

// Adiciona uma loja de cliente (qualquer usuário logado; visível para todos)
export async function createClientStore(data: {
  name: string
  site: string
  niche: string
  type: ClientStoreType
}): Promise<{ success: boolean; error?: string; store?: ClientStoreEntry }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  if (!data.name?.trim() || !data.site?.trim() || !data.niche?.trim()) {
    return { success: false, error: "Preencha todos os campos" }
  }
  if (data.type !== "nacional" && data.type !== "global") {
    return { success: false, error: "Tipo inválido" }
  }

  const site = data.site.trim().startsWith("http") ? data.site.trim() : `https://${data.site.trim()}`

  try {
    const rows = await sql`
      INSERT INTO pg_client_stores (name, site, niche, type, created_by, created_by_name)
      VALUES (${data.name.trim()}, ${site}, ${data.niche.trim()}, ${data.type}, ${user.id}, ${user.name})
      RETURNING id, name, site, niche, type, created_by, created_by_name, created_at
    `
    revalidatePath("/mineracao")
    revalidatePath("/demandas")
    return { success: true, store: rows[0] as ClientStoreEntry }
  } catch (error: unknown) {
    console.error("Create client store error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar loja: ${errorMessage}` }
  }
}

// Exclui uma loja de cliente (qualquer usuário logado)
export async function deleteClientStore(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_client_stores WHERE id = ${id}`
    revalidatePath("/mineracao")
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete client store error:", error)
    return { success: false, error: "Erro ao excluir loja" }
  }
}
