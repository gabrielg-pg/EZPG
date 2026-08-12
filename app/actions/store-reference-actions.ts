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

export type StoreReferenceCountry = {
  code: string
  name: string
  sort_order: number
}

const DEFAULT_COUNTRIES: { code: string; name: string }[] = [
  { code: "br", name: "Brasil" },
  { code: "us", name: "Estados Unidos" },
  { code: "pt", name: "Portugal" },
  { code: "es", name: "Espanha" },
  { code: "de", name: "Alemanha" },
  { code: "ca", name: "Canadá" },
  { code: "gb", name: "Reino Unido" },
  { code: "au", name: "Austrália" },
  { code: "fr", name: "França" },
  { code: "it", name: "Itália" },
]

// Garante a tabela de países ativos e a semeia (uma única vez) com os padrões
export async function createStoreReferenceCountriesTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_store_reference_countries (
      code VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  const existing = await sql`SELECT COUNT(*)::int AS count FROM pg_store_reference_countries`
  const count = (existing[0] as { count: number }).count
  if (count === 0) {
    for (let i = 0; i < DEFAULT_COUNTRIES.length; i++) {
      const c = DEFAULT_COUNTRIES[i]
      await sql`
        INSERT INTO pg_store_reference_countries (code, name, sort_order)
        VALUES (${c.code}, ${c.name}, ${i})
        ON CONFLICT (code) DO NOTHING
      `
    }
  }
}

// Busca os países ativos (global)
export async function getStoreReferenceCountries(): Promise<StoreReferenceCountry[]> {
  const rows = await sql`
    SELECT code, name, sort_order
    FROM pg_store_reference_countries
    ORDER BY sort_order ASC, name ASC
  `
  return rows as StoreReferenceCountry[]
}

// Adiciona um país à lista ativa
export async function addStoreReferenceCountry(data: {
  code: string
  name: string
}): Promise<{ success: boolean; error?: string; country?: StoreReferenceCountry }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }
  if (!data.code?.trim() || !data.name?.trim()) {
    return { success: false, error: "Selecione um país" }
  }

  try {
    const orderRows = await sql`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM pg_store_reference_countries
    `
    const nextOrder = (orderRows[0] as { next_order: number }).next_order
    const rows = await sql`
      INSERT INTO pg_store_reference_countries (code, name, sort_order)
      VALUES (${data.code.trim().toLowerCase()}, ${data.name.trim()}, ${nextOrder})
      ON CONFLICT (code) DO NOTHING
      RETURNING code, name, sort_order
    `
    if (rows.length === 0) {
      return { success: false, error: "Esse país já foi adicionado." }
    }
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true, country: rows[0] as StoreReferenceCountry }
  } catch (error: unknown) {
    console.error("Add store reference country error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar país: ${errorMessage}` }
  }
}

// Remove um país da lista ativa (e as lojas associadas a ele)
export async function deleteStoreReferenceCountry(code: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_store_references WHERE country = ${code}`
    await sql`DELETE FROM pg_store_reference_countries WHERE code = ${code}`
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete store reference country error:", error)
    return { success: false, error: "Erro ao excluir país" }
  }
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
