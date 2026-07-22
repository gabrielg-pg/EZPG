"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { ONBOARDING_SEED, type OnboardingTab } from "@/lib/onboarding-content"

const PATH = "/zona-de-execucao/onboardings"

export type OnboardingMessage = {
  id: number
  tab: OnboardingTab
  position: number
  title: string
  body: string
  is_internal: boolean
}

async function requireExecutionAccess() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())
  if (!roles.some((r) => ["admin", "zona_execucao"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

// Cria a tabela e popula com o conteúdo padrão (apenas linhas ainda inexistentes).
export async function ensureOnboardingSeed() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_onboarding_messages (
      id SERIAL PRIMARY KEY,
      tab VARCHAR(20) NOT NULL,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (tab, position)
    )
  `

  for (const tab of Object.keys(ONBOARDING_SEED) as OnboardingTab[]) {
    for (const msg of ONBOARDING_SEED[tab]) {
      // ON CONFLICT DO NOTHING preserva edições feitas pela equipe.
      await sql`
        INSERT INTO pg_onboarding_messages (tab, position, title, body, is_internal)
        VALUES (${tab}, ${msg.position}, ${msg.title}, ${msg.body}, ${msg.isInternal})
        ON CONFLICT (tab, position) DO NOTHING
      `
    }
  }
}

export async function getOnboardingMessages(): Promise<OnboardingMessage[]> {
  const rows = await sql`
    SELECT id, tab, position, title, body, is_internal
    FROM pg_onboarding_messages
    ORDER BY tab, position
  `
  return rows as OnboardingMessage[]
}

export async function updateOnboardingMessage(id: number, body: string, title?: string) {
  await requireExecutionAccess()
  if (typeof title === "string") {
    await sql`
      UPDATE pg_onboarding_messages
      SET body = ${body}, title = ${title}, updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await sql`
      UPDATE pg_onboarding_messages
      SET body = ${body}, updated_at = NOW()
      WHERE id = ${id}
    `
  }
  revalidatePath(PATH)
}

// Cria um novo bloco no fim do funil da aba informada.
export async function createOnboardingMessage(tab: OnboardingTab, title: string, body: string) {
  await requireExecutionAccess()
  const rows = await sql`
    SELECT COALESCE(MAX(position), 0) + 1 AS next
    FROM pg_onboarding_messages
    WHERE tab = ${tab}
  `
  const nextPosition = (rows[0]?.next as number) ?? 1
  const inserted = await sql`
    INSERT INTO pg_onboarding_messages (tab, position, title, body, is_internal)
    VALUES (${tab}, ${nextPosition}, ${title}, ${body}, false)
    RETURNING id, tab, position, title, body, is_internal
  `
  revalidatePath(PATH)
  return inserted[0] as OnboardingMessage
}

export async function deleteOnboardingMessage(id: number) {
  await requireExecutionAccess()
  await sql`DELETE FROM pg_onboarding_messages WHERE id = ${id}`
  revalidatePath(PATH)
}

// Move um bloco para cima ("up") ou para baixo ("down"), trocando de posição
// com o bloco vizinho na mesma aba.
export async function moveOnboardingMessage(id: number, direction: "up" | "down") {
  await requireExecutionAccess()

  const currentRows = await sql`
    SELECT id, tab, position FROM pg_onboarding_messages WHERE id = ${id}
  `
  const current = currentRows[0] as { id: number; tab: string; position: number } | undefined
  if (!current) return

  // Localiza o vizinho imediato na direção desejada.
  const neighborRows =
    direction === "up"
      ? await sql`
          SELECT id, position FROM pg_onboarding_messages
          WHERE tab = ${current.tab} AND position < ${current.position}
          ORDER BY position DESC LIMIT 1
        `
      : await sql`
          SELECT id, position FROM pg_onboarding_messages
          WHERE tab = ${current.tab} AND position > ${current.position}
          ORDER BY position ASC LIMIT 1
        `
  const neighbor = neighborRows[0] as { id: number; position: number } | undefined
  if (!neighbor) return // já está no topo/fim

  // Troca as posições usando um valor temporário para respeitar a UNIQUE(tab, position).
  await sql`UPDATE pg_onboarding_messages SET position = -1 WHERE id = ${current.id}`
  await sql`UPDATE pg_onboarding_messages SET position = ${current.position} WHERE id = ${neighbor.id}`
  await sql`UPDATE pg_onboarding_messages SET position = ${neighbor.position} WHERE id = ${current.id}`

  revalidatePath(PATH)
}
