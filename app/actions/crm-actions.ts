"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type CrmStage = {
  id: number
  name: string
  position: number
  color: string
}

export type CrmContact = {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  stage_id: number | null
  value: number
  notes: string | null
  owner_id: number | null
  created_at: string
  updated_at: string
}

export async function getStages(): Promise<CrmStage[]> {
  const { user } = await getSession()
  if (!user) return []
  const rows = await sql`
    SELECT id, name, position, color FROM crm_stages ORDER BY position ASC, id ASC
  `
  return rows as CrmStage[]
}

export async function getContacts(): Promise<CrmContact[]> {
  const { user } = await getSession()
  if (!user) return []
  const rows = await sql`
    SELECT id, name, company, email, phone, stage_id, value, notes, owner_id, created_at, updated_at
    FROM crm_contacts
    ORDER BY created_at DESC
  `
  return rows as CrmContact[]
}

export async function createContact(data: {
  name: string
  company?: string
  email?: string
  phone?: string
  stage_id: number
  value?: number
  notes?: string
}) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  if (!data.name?.trim()) {
    return { success: false, error: "Informe o nome do contato" }
  }

  try {
    await sql`
      INSERT INTO crm_contacts (name, company, email, phone, stage_id, value, notes, owner_id)
      VALUES (
        ${data.name.trim()},
        ${data.company || null},
        ${data.email || null},
        ${data.phone || null},
        ${data.stage_id},
        ${data.value ?? 0},
        ${data.notes || null},
        ${user.id}
      )
    `
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("Create contact error:", error)
    return { success: false, error: "Erro ao criar contato" }
  }
}

export async function updateContact(
  id: number,
  data: {
    name: string
    company?: string
    email?: string
    phone?: string
    stage_id: number
    value?: number
    notes?: string
  },
) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`
      UPDATE crm_contacts
      SET name = ${data.name.trim()},
          company = ${data.company || null},
          email = ${data.email || null},
          phone = ${data.phone || null},
          stage_id = ${data.stage_id},
          value = ${data.value ?? 0},
          notes = ${data.notes || null},
          updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("Update contact error:", error)
    return { success: false, error: "Erro ao atualizar contato" }
  }
}

export async function moveContact(id: number, stageId: number) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`
      UPDATE crm_contacts SET stage_id = ${stageId}, updated_at = NOW() WHERE id = ${id}
    `
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("Move contact error:", error)
    return { success: false, error: "Erro ao mover contato" }
  }
}

export async function deleteContact(id: number) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`DELETE FROM crm_contacts WHERE id = ${id}`
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("Delete contact error:", error)
    return { success: false, error: "Erro ao excluir contato" }
  }
}
