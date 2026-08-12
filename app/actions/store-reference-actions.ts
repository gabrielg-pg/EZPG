"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type StoreReferenceEntry = {
  id: number
  name: string
  site: string
  niche: string
  country: string // código do país (br, us, pt ...)
  created_by: number | null
  created_by_name: string | null
  created_at: string
}

// Garante que a tabela existe (compartilhada por todos os usuários)
export async function createStoreReferencesTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_store_references (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      site VARCHAR(500) NOT NULL,
      niche VARCHAR(255) NOT NULL,
      country VARCHAR(10) NOT NULL,
      created_by INTEGER,
      created_by_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// Busca TODAS as lojas de referência (global, sem filtro por usuário)
export async function getStoreReferences(): Promise<StoreReferenceEntry[]> {
  const stores = await sql`
    SELECT id, name, site, niche, country, created_by, created_by_name, created_at
    FROM pg_store_references
    ORDER BY created_at ASC
  `
  return stores as StoreReferenceEntry[]
}

// Adiciona uma loja de referência (qualquer usuário logado; visível para todos)
export async function createStoreReference(data: {
  name: string
  site: string
  niche: string
  country: string
}): Promise<{ success: boolean; error?: string; store?: StoreReferenceEntry }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  if (!data.name?.trim() || !data.site?.trim() || !data.niche || !data.country) {
    return { success: false, error: "Dados incompletos" }
  }

  const site = data.site.trim().startsWith("http") ? data.site.trim() : `https://${data.site.trim()}`

  try {
    const rows = await sql`
      INSERT INTO pg_store_references (name, site, niche, country, created_by, created_by_name)
      VALUES (${data.name.trim()}, ${site}, ${data.niche}, ${data.country}, ${user.id}, ${user.name})
      RETURNING id, name, site, niche, country, created_by, created_by_name, created_at
    `
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true, store: rows[0] as StoreReferenceEntry }
  } catch (error: unknown) {
    console.error("Create store reference error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar loja: ${errorMessage}` }
  }
}

// Exclui uma loja de referência (qualquer usuário logado)
export async function deleteStoreReference(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_store_references WHERE id = ${id}`
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete store reference error:", error)
    return { success: false, error: "Erro ao excluir loja" }
  }
}
