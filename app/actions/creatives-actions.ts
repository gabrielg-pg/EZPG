"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export const CREATIVE_STATUSES = [
  "briefing",
  "em_producao",
  "no_ar",
  "em_analise",
  "escalando",
  "pausado_positivo",
  "pausado_negativo",
] as const

export type CreativeStatus = (typeof CREATIVE_STATUSES)[number]

export type Creative = {
  id: number
  name: string
  format: string
  drive_link: string | null
  primary_text: string | null
  title: string | null
  description: string | null
  observation: string | null
  status: CreativeStatus
  pause_reason: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// Somente Gestor de ADS e Admin podem acessar/gerenciar criativos
async function canManageCreatives() {
  const { user } = await getSession()
  if (!user) return false
  return user.roles.includes("admin") || user.roles.includes("gestor_ads")
}

export async function createCreativesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_creatives (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'video',
      drive_link TEXT,
      primary_text TEXT,
      title TEXT,
      description TEXT,
      observation TEXT,
      status TEXT NOT NULL DEFAULT 'briefing',
      pause_reason TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function getCreatives(): Promise<Creative[]> {
  if (!(await canManageCreatives())) return []
  try {
    const rows = await sql`
      SELECT * FROM pg_creatives
      ORDER BY sort_order ASC, created_at ASC
    `
    return rows as Creative[]
  } catch {
    return []
  }
}

export async function createCreative(data: {
  name: string
  format: string
  driveLink?: string
  primaryText?: string
  title?: string
  description?: string
  observation?: string
  status?: CreativeStatus
}): Promise<{ success: boolean; error?: string; creative?: Creative }> {
  if (!(await canManageCreatives())) {
    return { success: false, error: "Não autorizado" }
  }
  if (!data.name?.trim()) {
    return { success: false, error: "Informe o nome do criativo" }
  }

  try {
    const status = data.status && CREATIVE_STATUSES.includes(data.status) ? data.status : "briefing"
    const rows = await sql`
      INSERT INTO pg_creatives (name, format, drive_link, primary_text, title, description, observation, status)
      VALUES (
        ${data.name.trim()},
        ${data.format || "video"},
        ${data.driveLink || null},
        ${data.primaryText || null},
        ${data.title || null},
        ${data.description || null},
        ${data.observation || null},
        ${status}
      )
      RETURNING *
    `
    revalidatePath("/zona-de-execucao/criativos")
    return { success: true, creative: (rows as Creative[])[0] }
  } catch (error) {
    console.error("Create creative error:", error)
    return { success: false, error: "Erro ao criar criativo" }
  }
}

export async function moveCreative(
  id: number,
  status: CreativeStatus,
  pauseReason?: string | null,
): Promise<{ success: boolean; error?: string }> {
  if (!(await canManageCreatives())) {
    return { success: false, error: "Não autorizado" }
  }
  if (!CREATIVE_STATUSES.includes(status)) {
    return { success: false, error: "Status inválido" }
  }

  try {
    // Motivo da pausa só se aplica à coluna "Pausado — Negativo"
    const reason = status === "pausado_negativo" ? pauseReason || null : null
    await sql`
      UPDATE pg_creatives
      SET status = ${status}, pause_reason = ${reason}, updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/zona-de-execucao/criativos")
    return { success: true }
  } catch (error) {
    console.error("Move creative error:", error)
    return { success: false, error: "Erro ao mover criativo" }
  }
}

export async function updateCreative(
  id: number,
  data: {
    name: string
    format: string
    driveLink?: string
    primaryText?: string
    title?: string
    description?: string
    observation?: string
  },
): Promise<{ success: boolean; error?: string }> {
  if (!(await canManageCreatives())) {
    return { success: false, error: "Não autorizado" }
  }
  if (!data.name?.trim()) {
    return { success: false, error: "Informe o nome do criativo" }
  }

  try {
    await sql`
      UPDATE pg_creatives
      SET name = ${data.name.trim()},
          format = ${data.format || "video"},
          drive_link = ${data.driveLink || null},
          primary_text = ${data.primaryText || null},
          title = ${data.title || null},
          description = ${data.description || null},
          observation = ${data.observation || null},
          updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/zona-de-execucao/criativos")
    return { success: true }
  } catch (error) {
    console.error("Update creative error:", error)
    return { success: false, error: "Erro ao atualizar criativo" }
  }
}

export async function deleteCreative(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await canManageCreatives())) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`DELETE FROM pg_creatives WHERE id = ${id}`
    revalidatePath("/zona-de-execucao/criativos")
    return { success: true }
  } catch (error) {
    console.error("Delete creative error:", error)
    return { success: false, error: "Erro ao excluir criativo" }
  }
}
