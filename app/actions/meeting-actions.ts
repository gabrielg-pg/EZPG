"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function validateMeetingAccess() {
  const { user } = await getSession()
  if (!user) {
    return { error: "Não autenticado", user: null }
  }
  if (user.role !== "admin" && user.role !== "comercial") {
    return { error: "Acesso negado", user: null }
  }
  return { error: null, user }
}

export async function getMeetingsByDate(date: string) {
  const { error, user } = await validateMeetingAccess()
  if (error || !user) {
    return { success: false, error: error || "Acesso negado", meetings: [] }
  }

  try {
    const meetings = await sql`
      SELECT 
        m.*,
        ua.name as attendant_name,
        up.name as performer_name
      FROM meetings m
      JOIN users ua ON m.attendant_user_id = ua.id
      JOIN users up ON m.performer_user_id = up.id
      WHERE m.meeting_date = ${date}
      ORDER BY m.meeting_time ASC
    `
    return { success: true, meetings }
  } catch (error) {
    console.error("Get meetings error:", error)
    return { success: false, error: "Erro ao buscar reuniões", meetings: [] }
  }
}

export async function createMeeting(data: {
  meeting_date: string
  meeting_time: string
  lead_name: string
  lead_phone: string
  attendant_user_id: number
  performer_user_id: number
  reason: string
}) {
  const { error, user } = await validateMeetingAccess()
  if (error || !user) {
    return { success: false, error: error || "Acesso negado" }
  }

  try {
    await sql`
      INSERT INTO meetings (meeting_date, meeting_time, lead_name, lead_phone, attendant_user_id, performer_user_id, reason)
      VALUES (${data.meeting_date}, ${data.meeting_time}, ${data.lead_name}, ${data.lead_phone}, ${data.attendant_user_id}, ${data.performer_user_id}, ${data.reason})
    `
    revalidatePath("/reunioes")
    return { success: true }
  } catch (error: unknown) {
    console.error("Create meeting error:", error)
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return { success: false, error: "Já existe uma reunião agendada neste horário" }
    }
    return { success: false, error: "Erro ao criar reunião" }
  }
}

export async function updateMeeting(
  id: string,
  data: {
    lead_name?: string
    lead_phone?: string
    attendant_user_id?: number
    performer_user_id?: number
    reason?: string
    status?: string
  },
) {
  const { error, user } = await validateMeetingAccess()
  if (error || !user) {
    return { success: false, error: error || "Acesso negado" }
  }

  try {
    const updates: string[] = []
    const values: (string | number)[] = []
    let paramIndex = 1

    if (data.lead_name !== undefined) {
      updates.push(`lead_name = $${paramIndex++}`)
      values.push(data.lead_name)
    }
    if (data.lead_phone !== undefined) {
      updates.push(`lead_phone = $${paramIndex++}`)
      values.push(data.lead_phone)
    }
    if (data.attendant_user_id !== undefined) {
      updates.push(`attendant_user_id = $${paramIndex++}`)
      values.push(data.attendant_user_id)
    }
    if (data.performer_user_id !== undefined) {
      updates.push(`performer_user_id = $${paramIndex++}`)
      values.push(data.performer_user_id)
    }
    if (data.reason !== undefined) {
      updates.push(`reason = $${paramIndex++}`)
      values.push(data.reason)
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(data.status)
    }

    if (updates.length === 0) {
      return { success: false, error: "Nenhum campo para atualizar" }
    }

    await sql`
      UPDATE meetings 
      SET lead_name = COALESCE(${data.lead_name}, lead_name),
          lead_phone = COALESCE(${data.lead_phone}, lead_phone),
          attendant_user_id = COALESCE(${data.attendant_user_id}, attendant_user_id),
          performer_user_id = COALESCE(${data.performer_user_id}, performer_user_id),
          reason = COALESCE(${data.reason}, reason),
          status = COALESCE(${data.status}, status)
      WHERE id = ${id}::uuid
    `
    revalidatePath("/reunioes")
    return { success: true }
  } catch (error) {
    console.error("Update meeting error:", error)
    return { success: false, error: "Erro ao atualizar reunião" }
  }
}

export async function deleteMeeting(id: string) {
  const { error, user } = await validateMeetingAccess()
  if (error || !user) {
    return { success: false, error: error || "Acesso negado" }
  }

  try {
    await sql`DELETE FROM meetings WHERE id = ${id}::uuid`
    revalidatePath("/reunioes")
    return { success: true }
  } catch (error) {
    console.error("Delete meeting error:", error)
    return { success: false, error: "Erro ao deletar reunião" }
  }
}

export async function getComercialUsers() {
  const { error, user } = await validateMeetingAccess()
  if (error || !user) {
    return { success: false, error: error || "Acesso negado", users: [] }
  }

  try {
    const users = await sql`
      SELECT id, name, username, role 
      FROM users 
      WHERE name IN ('Gabriel Gerber', 'Alisson Jordi') AND status = 'ativo'
      ORDER BY name ASC
    `
    return { success: true, users }
  } catch (error) {
    console.error("Get comercial users error:", error)
    return { success: false, error: "Erro ao buscar usuários", users: [] }
  }
}
