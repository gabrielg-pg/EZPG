"use server"

import { sql } from "@/lib/db"
import { getSession, requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const PATH = "/zona-de-execucao/vertebra-naming"

export type NamingStatus = "disponivel" | "indisponivel" | "verificar"

export type NamingName = {
  id: number
  country: string
  niche: string
  name: string
  domain: string | null
  status: NamingStatus
  created_by: number | null
  created_by_name: string | null
  created_at: string
}

export type NamingNiche = {
  id: number
  country: string
  niche: string
  created_at: string
}

// Garante acesso de Zona de Execução (ou admin).
async function requireExecutionAccess() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())
  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

export async function createNamingTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_naming_niches (
      id SERIAL PRIMARY KEY,
      country VARCHAR(10) NOT NULL,
      niche VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (country, niche)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pg_naming_names (
      id SERIAL PRIMARY KEY,
      country VARCHAR(10) NOT NULL,
      niche VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(500),
      status VARCHAR(20) NOT NULL DEFAULT 'verificar',
      created_by INTEGER,
      created_by_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function getNamingData(): Promise<{ niches: NamingNiche[]; names: NamingName[] }> {
  const niches = await sql`
    SELECT id, country, niche, created_at
    FROM pg_naming_niches
    ORDER BY created_at ASC
  `
  const names = await sql`
    SELECT id, country, niche, name, domain, status, created_by, created_by_name, created_at
    FROM pg_naming_names
    ORDER BY created_at ASC
  `
  return { niches: niches as NamingNiche[], names: names as NamingName[] }
}

// Cria uma categoria de nicho dentro de um país (vazia).
export async function createNamingNiche(
  country: string,
  niche: string,
): Promise<{ success: boolean; error?: string; niche?: NamingNiche }> {
  await requireExecutionAccess()
  if (!country || !niche?.trim()) {
    return { success: false, error: "Dados incompletos" }
  }
  try {
    const rows = await sql`
      INSERT INTO pg_naming_niches (country, niche)
      VALUES (${country}, ${niche.trim()})
      ON CONFLICT (country, niche) DO NOTHING
      RETURNING id, country, niche, created_at
    `
    revalidatePath(PATH)
    if (rows.length === 0) {
      return { success: false, error: "Este nicho já existe neste país." }
    }
    return { success: true, niche: rows[0] as NamingNiche }
  } catch (error) {
    console.error("Create naming niche error:", error)
    return { success: false, error: "Erro ao adicionar nicho." }
  }
}

// Adiciona um nome de marca dentro de um nicho específico.
export async function createNamingName(data: {
  country: string
  niche: string
  name: string
  domain: string
  status: NamingStatus
}): Promise<{ success: boolean; error?: string; name?: NamingName }> {
  const user = await requireExecutionAccess()
  if (!data.country || !data.niche?.trim() || !data.name?.trim()) {
    return { success: false, error: "Dados incompletos" }
  }
  const domain = data.domain?.trim() || null
  try {
    // Garante que o nicho exista na tabela de nichos.
    await sql`
      INSERT INTO pg_naming_niches (country, niche)
      VALUES (${data.country}, ${data.niche.trim()})
      ON CONFLICT (country, niche) DO NOTHING
    `
    const rows = await sql`
      INSERT INTO pg_naming_names (country, niche, name, domain, status, created_by, created_by_name)
      VALUES (${data.country}, ${data.niche.trim()}, ${data.name.trim()}, ${domain}, ${data.status}, ${user.id}, ${user.name})
      RETURNING id, country, niche, name, domain, status, created_by, created_by_name, created_at
    `
    revalidatePath(PATH)
    return { success: true, name: rows[0] as NamingName }
  } catch (error) {
    console.error("Create naming name error:", error)
    return { success: false, error: "Erro ao adicionar nome." }
  }
}

export async function updateNamingName(
  id: number,
  data: { name: string; domain: string; status: NamingStatus },
): Promise<{ success: boolean; error?: string; name?: NamingName }> {
  await requireExecutionAccess()
  if (!data.name?.trim()) {
    return { success: false, error: "Nome obrigatório" }
  }
  const domain = data.domain?.trim() || null
  try {
    const rows = await sql`
      UPDATE pg_naming_names
      SET name = ${data.name.trim()}, domain = ${domain}, status = ${data.status}
      WHERE id = ${id}
      RETURNING id, country, niche, name, domain, status, created_by, created_by_name, created_at
    `
    revalidatePath(PATH)
    return { success: true, name: rows[0] as NamingName }
  } catch (error) {
    console.error("Update naming name error:", error)
    return { success: false, error: "Erro ao atualizar nome." }
  }
}

export async function deleteNamingName(id: number): Promise<{ success: boolean }> {
  await requireExecutionAccess()
  await sql`DELETE FROM pg_naming_names WHERE id = ${id}`
  revalidatePath(PATH)
  return { success: true }
}

// Exclui um nicho e todos os nomes contidos nele.
export async function deleteNamingNiche(country: string, niche: string): Promise<{ success: boolean }> {
  await requireExecutionAccess()
  await sql`DELETE FROM pg_naming_names WHERE country = ${country} AND niche = ${niche}`
  await sql`DELETE FROM pg_naming_niches WHERE country = ${country} AND niche = ${niche}`
  revalidatePath(PATH)
  return { success: true }
}
