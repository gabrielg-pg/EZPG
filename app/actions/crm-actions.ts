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
  email: string | null
  phone: string | null
  stage_id: number | null
  interest_reason: string | null
  notes: string | null
  responsible: string | null
  form_submitted_at: string | null
  created_at: string
  updated_at: string
}

type ContactInput = {
  name: string
  email?: string
  phone?: string
  stage_id: number
  interest_reason?: string
  notes?: string
  responsible?: string
  form_submitted_at?: string
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
    SELECT id, name, email, phone, stage_id, interest_reason, notes, responsible,
           form_submitted_at, created_at, updated_at
    FROM crm_contacts
    ORDER BY created_at DESC
  `
  return rows as CrmContact[]
}

export async function createContact(data: ContactInput) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  if (!data.name?.trim()) {
    return { success: false, error: "Informe o nome do candidato" }
  }

  try {
    await sql`
      INSERT INTO crm_contacts (name, email, phone, stage_id, interest_reason, notes, responsible, form_submitted_at, owner_id)
      VALUES (
        ${data.name.trim()},
        ${data.email || null},
        ${data.phone || null},
        ${data.stage_id},
        ${data.interest_reason || null},
        ${data.notes || null},
        ${data.responsible || null},
        ${data.form_submitted_at || null},
        ${user.id}
      )
    `
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("Create contact error:", error)
    return { success: false, error: "Erro ao criar candidato" }
  }
}

export async function updateContact(id: number, data: ContactInput) {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autorizado" }

  try {
    await sql`
      UPDATE crm_contacts
      SET name = ${data.name.trim()},
          email = ${data.email || null},
          phone = ${data.phone || null},
          stage_id = ${data.stage_id},
          interest_reason = ${data.interest_reason || null},
          notes = ${data.notes || null},
          responsible = ${data.responsible || null},
          form_submitted_at = ${data.form_submitted_at || null},
          updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("Update contact error:", error)
    return { success: false, error: "Erro ao atualizar candidato" }
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
    return { success: false, error: "Erro ao mover candidato" }
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
    return { success: false, error: "Erro ao excluir candidato" }
  }
}
