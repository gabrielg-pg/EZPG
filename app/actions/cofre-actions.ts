"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type Credential = {
  id: number
  name: string
  category: string
  url: string | null
  login: string | null
  password: string | null
  notes: string | null
}

export async function getCredentials(): Promise<Credential[]> {
  await requireAuth()
  const rows = await sql`
    SELECT id, name, category, url, login, password, notes
    FROM cofre_credentials
    ORDER BY category ASC, name ASC
  `
  return rows as Credential[]
}

type CredentialInput = {
  name: string
  category: string
  url?: string
  login?: string
  password?: string
  notes?: string
}

export async function createCredential(input: CredentialInput) {
  const user = await requireAuth()
  const name = input.name?.trim()
  const category = input.category?.trim() || "Geral"
  if (!name) return { success: false as const, error: "Informe o nome da credencial" }

  try {
    const rows = await sql`
      INSERT INTO cofre_credentials (name, category, url, login, password, notes, created_by)
      VALUES (
        ${name},
        ${category},
        ${input.url?.trim() || null},
        ${input.login?.trim() || null},
        ${input.password || null},
        ${input.notes?.trim() || null},
        ${user.id}
      )
      RETURNING id, name, category, url, login, password, notes
    `
    revalidatePath("/cofre")
    return { success: true as const, credential: rows[0] as Credential }
  } catch (error) {
    console.error("createCredential error:", error)
    return { success: false as const, error: "Erro ao salvar credencial" }
  }
}

export async function updateCredential(id: number, input: CredentialInput) {
  await requireAuth()
  const name = input.name?.trim()
  const category = input.category?.trim() || "Geral"
  if (!name) return { success: false as const, error: "Informe o nome da credencial" }

  try {
    const rows = await sql`
      UPDATE cofre_credentials
      SET name = ${name},
          category = ${category},
          url = ${input.url?.trim() || null},
          login = ${input.login?.trim() || null},
          password = ${input.password || null},
          notes = ${input.notes?.trim() || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, category, url, login, password, notes
    `
    revalidatePath("/cofre")
    return { success: true as const, credential: rows[0] as Credential }
  } catch (error) {
    console.error("updateCredential error:", error)
    return { success: false as const, error: "Erro ao atualizar credencial" }
  }
}

export async function deleteCredential(id: number) {
  await requireAuth()
  try {
    await sql`DELETE FROM cofre_credentials WHERE id = ${id}`
    revalidatePath("/cofre")
    return { success: true as const }
  } catch (error) {
    console.error("deleteCredential error:", error)
    return { success: false as const, error: "Erro ao excluir credencial" }
  }
}
