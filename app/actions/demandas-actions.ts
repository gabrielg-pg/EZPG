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
  position: number | null
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
      created_at TIMESTAMP DEFAULT NOW(),
      position INTEGER
    )
  `
}

// Busca todas as demandas de uma semana
export async function getDemandas(weekStart: string): Promise<Demanda[]> {
  const demandas = await sql`
    SELECT id, title, day_of_week, week_start, completed, created_by, created_by_name, created_at, position
    FROM pg_demandas
    WHERE week_start = ${weekStart}
    ORDER BY day_of_week ASC, position ASC NULLS LAST, created_at ASC, id ASC
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
      INSERT INTO pg_demandas (title, day_of_week, week_start, created_by, created_by_name, position)
      VALUES (
        ${data.title.trim()}, ${data.dayOfWeek}, ${data.weekStart}, ${user.id}, ${user.name},
        (SELECT COALESCE(MAX(position), 0) + 1 FROM pg_demandas WHERE week_start = ${data.weekStart} AND day_of_week = ${data.dayOfWeek})
      )
      RETURNING id, title, day_of_week, week_start, completed, created_by, created_by_name, created_at, position
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

// Salva a nova ordem das demandas de um dia (ids na ordem desejada)
export async function reorderDemandas(orderedIds: number[]): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  const ids = orderedIds.filter((id) => Number.isInteger(id) && id > 0)
  if (ids.length === 0 || ids.length > 500) {
    return { success: false, error: "Ordem inválida" }
  }

  try {
    await sql`
      UPDATE pg_demandas AS d
      SET position = v.pos
      FROM unnest(${ids}::int[]) WITH ORDINALITY AS v(id, pos)
      WHERE d.id = v.id
    `
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Reorder demandas error:", error)
    return { success: false, error: "Erro ao reordenar demandas" }
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
