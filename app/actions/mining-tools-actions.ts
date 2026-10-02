"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type MiningExtension = {
  id: number
  name: string
  url: string
  sort_order: number
}

export type UsefulCodeType = "code" | "link"

export type UsefulCode = {
  id: number
  title: string
  type: UsefulCodeType
  value: string
  description: string
  sort_order: number
}

const DEFAULT_EXTENSIONS: { name: string; url: string }[] = [
  {
    name: "Similarweb — Website Traffic",
    url: "https://chromewebstore.google.com/detail/similarweb-website-traffi/hoklmmgfnpapgjgcpechhaamimifchmp",
  },
  {
    name: "Ad Cloud Library",
    url: "https://chromewebstore.google.com/detail/ad-library-cloud/mmehdbhpbgoegockemckbpjeoflflobc?hl=pt",
  },
  {
    name: "PPSPY — Shopify Analytics",
    url: "https://chromewebstore.google.com/detail/ppspy-1-shopify-analytics/lppbajkahdbbadheilijoeegnfndhlab?hl=pt_BR",
  },
  {
    name: "Poky — Product Importer",
    url: "https://chromewebstore.google.com/detail/poky-product-importer/bgofkkdheiicamgmlpfcdlfclkjmdelb?hl=pt-BR",
  },
]

const DEFAULT_USEFUL_CODES: { title: string; type: UsefulCodeType; value: string; description: string }[] = [
  {
    title: "Produtos mais vendidos da loja concorrente",
    type: "code",
    value: "collections/all?sort_by=best-selling",
    description: "Adicione ao final da URL da loja para listar os produtos por mais vendidos.",
  },
  {
    title: "Limpeza de metadados",
    type: "link",
    value: "https://online-metadata.com/remove-metadata",
    description: "Use para remover os metadados de todos os criativos baixados do concorrente.",
  },
]

/* ---------------------------- Extensões ---------------------------- */

export async function createMiningExtensionsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_mining_extensions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  const existing = await sql`SELECT COUNT(*)::int AS count FROM pg_mining_extensions`
  const count = (existing[0] as { count: number }).count
  if (count === 0) {
    for (let i = 0; i < DEFAULT_EXTENSIONS.length; i++) {
      const e = DEFAULT_EXTENSIONS[i]
      await sql`
        INSERT INTO pg_mining_extensions (name, url, sort_order)
        VALUES (${e.name}, ${e.url}, ${i})
      `
    }
  }
}

export async function getMiningExtensions(): Promise<MiningExtension[]> {
  const rows = await sql`
    SELECT id, name, url, sort_order
    FROM pg_mining_extensions
    ORDER BY sort_order ASC, id ASC
  `
  return rows as MiningExtension[]
}

export async function addMiningExtension(data: {
  name: string
  url: string
}): Promise<{ success: boolean; error?: string; extension?: MiningExtension }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }
  if (!data.name?.trim() || !data.url?.trim()) {
    return { success: false, error: "Preencha nome e link." }
  }

  try {
    const orderRows = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM pg_mining_extensions`
    const nextOrder = (orderRows[0] as { next_order: number }).next_order
    const rows = await sql`
      INSERT INTO pg_mining_extensions (name, url, sort_order)
      VALUES (${data.name.trim()}, ${data.url.trim()}, ${nextOrder})
      RETURNING id, name, url, sort_order
    `
    revalidatePath("/demandas")
    revalidatePath("/mineracao")
    return { success: true, extension: rows[0] as MiningExtension }
  } catch (error) {
    console.error("Add mining extension error:", error)
    return { success: false, error: "Erro ao adicionar extensão" }
  }
}

export async function updateMiningExtension(
  id: number,
  data: { name: string; url: string },
): Promise<{ success: boolean; error?: string; extension?: MiningExtension }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }
  if (!data.name?.trim() || !data.url?.trim()) {
    return { success: false, error: "Preencha nome e link." }
  }

  try {
    const rows = await sql`
      UPDATE pg_mining_extensions
      SET name = ${data.name.trim()}, url = ${data.url.trim()}
      WHERE id = ${id}
      RETURNING id, name, url, sort_order
    `
    revalidatePath("/demandas")
    revalidatePath("/mineracao")
    return { success: true, extension: rows[0] as MiningExtension }
  } catch (error) {
    console.error("Update mining extension error:", error)
    return { success: false, error: "Erro ao atualizar extensão" }
  }
}

export async function deleteMiningExtension(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }

  try {
    await sql`DELETE FROM pg_mining_extensions WHERE id = ${id}`
    revalidatePath("/demandas")
    revalidatePath("/mineracao")
    return { success: true }
  } catch (error) {
    console.error("Delete mining extension error:", error)
    return { success: false, error: "Erro ao excluir extensão" }
  }
}

/* ---------------------------- Códigos úteis ---------------------------- */

export async function createUsefulCodesTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_mining_useful_codes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'code',
      value TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  const existing = await sql`SELECT COUNT(*)::int AS count FROM pg_mining_useful_codes`
  const count = (existing[0] as { count: number }).count
  if (count === 0) {
    for (let i = 0; i < DEFAULT_USEFUL_CODES.length; i++) {
      const c = DEFAULT_USEFUL_CODES[i]
      await sql`
        INSERT INTO pg_mining_useful_codes (title, type, value, description, sort_order)
        VALUES (${c.title}, ${c.type}, ${c.value}, ${c.description}, ${i})
      `
    }
  }
}

export async function getUsefulCodes(): Promise<UsefulCode[]> {
  const rows = await sql`
    SELECT id, title, type, value, description, sort_order
    FROM pg_mining_useful_codes
    ORDER BY sort_order ASC, id ASC
  `
  return rows as UsefulCode[]
}

export async function addUsefulCode(data: {
  title: string
  type: UsefulCodeType
  value: string
  description: string
}): Promise<{ success: boolean; error?: string; code?: UsefulCode }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }
  if (!data.title?.trim() || !data.value?.trim()) {
    return { success: false, error: "Preencha título e conteúdo." }
  }

  try {
    const orderRows = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM pg_mining_useful_codes`
    const nextOrder = (orderRows[0] as { next_order: number }).next_order
    const type: UsefulCodeType = data.type === "link" ? "link" : "code"
    const rows = await sql`
      INSERT INTO pg_mining_useful_codes (title, type, value, description, sort_order)
      VALUES (${data.title.trim()}, ${type}, ${data.value.trim()}, ${data.description?.trim() ?? ""}, ${nextOrder})
      RETURNING id, title, type, value, description, sort_order
    `
    revalidatePath("/demandas")
    revalidatePath("/mineracao")
    return { success: true, code: rows[0] as UsefulCode }
  } catch (error) {
    console.error("Add useful code error:", error)
    return { success: false, error: "Erro ao adicionar código" }
  }
}

export async function updateUsefulCode(
  id: number,
  data: { title: string; type: UsefulCodeType; value: string; description: string },
): Promise<{ success: boolean; error?: string; code?: UsefulCode }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }
  if (!data.title?.trim() || !data.value?.trim()) {
    return { success: false, error: "Preencha título e conteúdo." }
  }

  try {
    const type: UsefulCodeType = data.type === "link" ? "link" : "code"
    const rows = await sql`
      UPDATE pg_mining_useful_codes
      SET title = ${data.title.trim()}, type = ${type}, value = ${data.value.trim()}, description = ${data.description?.trim() ?? ""}
      WHERE id = ${id}
      RETURNING id, title, type, value, description, sort_order
    `
    revalidatePath("/demandas")
    revalidatePath("/mineracao")
    return { success: true, code: rows[0] as UsefulCode }
  } catch (error) {
    console.error("Update useful code error:", error)
    return { success: false, error: "Erro ao atualizar código" }
  }
}

export async function deleteUsefulCode(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }

  try {
    await sql`DELETE FROM pg_mining_useful_codes WHERE id = ${id}`
    revalidatePath("/demandas")
    revalidatePath("/mineracao")
    return { success: true }
  } catch (error) {
    console.error("Delete useful code error:", error)
    return { success: false, error: "Erro ao excluir código" }
  }
}
