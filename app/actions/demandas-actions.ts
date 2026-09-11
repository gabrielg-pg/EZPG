"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type Demanda = {
  id: number
  title: string
  day_of_week: number // 1 = Segunda ... 6 = Sábado
  week_start: string // data (YYYY-MM-DD) da segunda-feira da semana
  completed: boolean
  created_by: number | null
  created_by_name: string | null
  created_at: string
}

// Garante que a tabela existe
export async function createDemandasTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_demandas (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      day_of_week INTEGER NOT NULL,
      week_start DATE NOT NULL,
      completed BOOLEAN DEFAULT false,
      created_by INTEGER,
      created_by_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// Busca todas as demandas de uma semana
export async function getDemandas(weekStart: string): Promise<Demanda[]> {
  const demandas = await sql`
    SELECT id, title, day_of_week, week_start, completed, created_by, created_by_name, created_at
    FROM pg_demandas
    WHERE week_start = ${weekStart}
    ORDER BY day_of_week ASC, created_at ASC
  `
  return demandas as Demanda[]
}

// Cria nova demanda (qualquer usuário logado)
export async function createDemanda(data: {
  title: string
  dayOfWeek: number
  weekStart: string
}): Promise<{ success: boolean; error?: string; demanda?: Demanda }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  if (!data.title?.trim() || !data.dayOfWeek || !data.weekStart) {
    return { success: false, error: "Dados incompletos" }
  }

  try {
    const rows = await sql`
      INSERT INTO pg_demandas (title, day_of_week, week_start, created_by, created_by_name)
      VALUES (${data.title.trim()}, ${data.dayOfWeek}, ${data.weekStart}, ${user.id}, ${user.name})
      RETURNING id, title, day_of_week, week_start, completed, created_by, created_by_name, created_at
    `
    revalidatePath("/demandas")
    return { success: true, demanda: rows[0] as Demanda }
  } catch (error: unknown) {
    console.error("Create demanda error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao criar demanda: ${errorMessage}` }
  }
}

// Alterna concluída/pendente (qualquer usuário logado)
export async function toggleDemanda(id: number, completed: boolean): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`UPDATE pg_demandas SET completed = ${completed} WHERE id = ${id}`
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Toggle demanda error:", error)
    return { success: false, error: "Erro ao atualizar demanda" }
  }
}

// Exclui demanda (qualquer usuário logado)
export async function deleteDemanda(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_demandas WHERE id = ${id}`
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete demanda error:", error)
    return { success: false, error: "Erro ao excluir demanda" }
  }
}
