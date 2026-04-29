"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type Demanda = {
  id: number
  member_id: string
  title: string
  label: "hoje" | "urgente" | "rotina"
  completed: boolean
  completed_at: string | null
  completed_date: string | null
  created_at: string
}

export type MemberStats = {
  member_id: string
  total: number
  completed: number
}

// Check if user is admin (Alisson Jordi)
async function isDemandasAdmin(): Promise<boolean> {
  const { user } = await getSession()
  if (!user) return false
  // Admin is determined by user role being 'admin' AND name containing 'Alisson'
  return user.role === "admin"
}

// Get all demandas
export async function getDemandas(): Promise<{ demandas: Demanda[]; isAdmin: boolean }> {
  const { user } = await getSession()
  if (!user) {
    return { demandas: [], isAdmin: false }
  }

  const isAdmin = await isDemandasAdmin()

  // Get pending tasks (not completed or completed today for display purposes)
  const today = new Date().toISOString().split("T")[0]
  
  const demandas = await sql`
    SELECT id, member_id, title, label, completed, completed_at, completed_date, created_at
    FROM demandas
    ORDER BY 
      CASE WHEN label = 'urgente' THEN 0 WHEN label = 'hoje' THEN 1 ELSE 2 END,
      created_at DESC
  `

  return { 
    demandas: demandas as Demanda[], 
    isAdmin 
  }
}

// Get demandas completed today
export async function getCompletedToday(): Promise<Demanda[]> {
  const today = new Date().toISOString().split("T")[0]
  
  const demandas = await sql`
    SELECT id, member_id, title, label, completed, completed_at, completed_date, created_at
    FROM demandas
    WHERE completed = true AND completed_date = ${today}
    ORDER BY completed_at DESC
  `

  return demandas as Demanda[]
}

// Create new demanda (admin only)
export async function createDemanda(data: {
  member_id: string
  title: string
  label: "hoje" | "urgente" | "rotina"
}): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  const isAdmin = await isDemandasAdmin()
  if (!isAdmin) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    await sql`
      INSERT INTO demandas (member_id, title, label, created_by)
      VALUES (${data.member_id}, ${data.title}, ${data.label}, ${user.id})
    `

    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Create demanda error:", error)
    return { success: false, error: "Erro ao criar demanda" }
  }
}

// Update demanda (admin only)
export async function updateDemanda(
  id: number,
  data: { title?: string; label?: "hoje" | "urgente" | "rotina" }
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isDemandasAdmin()
  if (!isAdmin) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    if (data.title && data.label) {
      await sql`
        UPDATE demandas SET title = ${data.title}, label = ${data.label}, updated_at = NOW()
        WHERE id = ${id}
      `
    } else if (data.title) {
      await sql`
        UPDATE demandas SET title = ${data.title}, updated_at = NOW()
        WHERE id = ${id}
      `
    } else if (data.label) {
      await sql`
        UPDATE demandas SET label = ${data.label}, updated_at = NOW()
        WHERE id = ${id}
      `
    }

    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Update demanda error:", error)
    return { success: false, error: "Erro ao atualizar demanda" }
  }
}

// Delete demanda (admin only)
export async function deleteDemanda(id: number): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isDemandasAdmin()
  if (!isAdmin) {
    return { success: false, error: "Sem permissão" }
  }

  try {
    await sql`DELETE FROM demandas WHERE id = ${id}`

    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete demanda error:", error)
    return { success: false, error: "Erro ao excluir demanda" }
  }
}

// Complete demanda (any authenticated user)
export async function completeDemanda(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    const today = new Date().toISOString().split("T")[0]
    const now = new Date().toISOString()

    await sql`
      UPDATE demandas 
      SET completed = true, completed_at = ${now}, completed_date = ${today}, updated_at = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Complete demanda error:", error)
    return { success: false, error: "Erro ao concluir demanda" }
  }
}

// Reset daily completions (called at midnight or on page load for new day)
export async function resetDailyCompletions(): Promise<void> {
  const today = new Date().toISOString().split("T")[0]
  
  // Reset completed status for tasks completed on previous days
  await sql`
    UPDATE demandas 
    SET completed = false, completed_at = NULL, completed_date = NULL
    WHERE completed = true AND completed_date < ${today}
  `
}
