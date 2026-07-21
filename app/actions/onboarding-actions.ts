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

export async function updateOnboardingMessage(id: number, body: string) {
  await requireExecutionAccess()
  await sql`
    UPDATE pg_onboarding_messages
    SET body = ${body}, updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath(PATH)
}
