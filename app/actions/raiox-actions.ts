"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { defaultRaioxState, type RaioxState } from "@/lib/raiox"

const PATH = "/raiox-planos"

async function requireExecutionAccess() {
  const { user } = await getSession()
  if (!user) throw new Error("Não autenticado")
  const roles = (user.roles ?? [user.role]).map((r: string) => r.toLowerCase())
  if (!roles.some((r: string) => ["admin", "zona_execucao"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

export async function getRaioxState(): Promise<RaioxState> {
  await requireExecutionAccess()
  const rows = await sql`SELECT data FROM pg_raiox_planos WHERE id = 1`
  const data = rows[0]?.data as RaioxState | undefined

  if (!data || !data.columns || data.columns.length === 0) {
    const initial = defaultRaioxState()
    await sql`
      INSERT INTO pg_raiox_planos (id, data, updated_at)
      VALUES (1, ${JSON.stringify(initial)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `
    return initial
  }
  return data
}

export async function saveRaioxState(state: RaioxState): Promise<{ ok: true }> {
  await requireExecutionAccess()
  await sql`
    INSERT INTO pg_raiox_planos (id, data, updated_at)
    VALUES (1, ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `
  revalidatePath(PATH)
  return { ok: true }
}
