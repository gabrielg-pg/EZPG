"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type AccessCredential = {
  id: number
  name: string
  login: string
  password: string
  site: string | null
  sort_order: number
  created_at: string
}

// Contas padrão (semeadas apenas uma vez, quando a tabela está vazia).
const DEFAULT_CREDENTIALS: { name: string; login: string; password: string; site: string | null }[] = [
  { name: "Gmail", login: "suporteprogrowth@gmail.com", password: "#Eusouprogrowth2030", site: null },
  { name: "Zona de Execução", login: "karolsantosangeli266@gmail.com", password: "#PG2026", site: null },
  { name: "Shopify", login: "hello@progrowthglobal.com", password: "#Eusoupg2026", site: null },
  { name: "Poky", login: "suporteprogrowth@gmail.com", password: "@MineracaoProGrowth2030#", site: null },
  {
    name: "E-mail Pro Growth",
    login: "hello@progrowthglobal.com",
    password: "@PinterestProGrowth2030#",
    site: "https://mail.hostinger.com/old/?_task=mail&_mbox=INBOX",
  },
  {
    name: "Magnific — Imagens",
    login: "suporteprogrowth@gmail.com",
    password: "#Eusoufoda76",
    site: "https://www.magnific.com",
  },
  {
    name: "WinningHunter",
    login: "suporteprogrowth@gmail.com",
    password: "@ProGrowth2030#",
    site: "https://app.winninghunter.com/dashboard",
  },
  { name: "CapCut", login: "suporteprogrowth@gmail.com", password: "#Luizpro76", site: null },
  { name: "ADSpower", login: "hello@progrowthglobal.com.br", password: "#Eusouprogrowth2030", site: null },
]

// Garante a existência da tabela e semeia as contas padrão uma única vez.
export async function createAccessCredentialsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_access_credentials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      login VARCHAR(500) NOT NULL,
      password VARCHAR(500) NOT NULL,
      site VARCHAR(500),
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  const countRows = await sql`SELECT COUNT(*)::int AS count FROM pg_access_credentials`
  const count = (countRows as { count: number }[])[0]?.count ?? 0
  if (count === 0) {
    for (let i = 0; i < DEFAULT_CREDENTIALS.length; i++) {
      const c = DEFAULT_CREDENTIALS[i]
      await sql`
        INSERT INTO pg_access_credentials (name, login, password, site, sort_order)
        VALUES (${c.name}, ${c.login}, ${c.password}, ${c.site}, ${i})
      `
    }
  }
}

// Lista todas as contas (global, sem filtro por usuário).
export async function getAccessCredentials(): Promise<AccessCredential[]> {
  const rows = await sql`
    SELECT id, name, login, password, site, sort_order, created_at
    FROM pg_access_credentials
    ORDER BY sort_order ASC, id ASC
  `
  return rows as AccessCredential[]
}

// Cria uma nova conta de acesso.
export async function createAccessCredential(data: {
  name: string
  login: string
  password: string
  site?: string
}): Promise<{ success: boolean; error?: string; credential?: AccessCredential }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }

  if (!data.name?.trim() || !data.login?.trim() || !data.password?.trim()) {
    return { success: false, error: "Preencha nome, login e senha." }
  }

  const rawSite = data.site?.trim() || ""
  const site = rawSite ? (rawSite.startsWith("http") ? rawSite : `https://${rawSite}`) : null

  try {
    const orderRows = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM pg_access_credentials`
    const nextOrder = (orderRows as { next: number }[])[0]?.next ?? 0
    const rows = await sql`
      INSERT INTO pg_access_credentials (name, login, password, site, sort_order)
      VALUES (${data.name.trim()}, ${data.login.trim()}, ${data.password}, ${site}, ${nextOrder})
      RETURNING id, name, login, password, site, sort_order, created_at
    `
    revalidatePath("/demandas")
    return { success: true, credential: (rows as AccessCredential[])[0] }
  } catch (error: unknown) {
    console.error("Create access credential error:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar conta: ${message}` }
  }
}

// Atualiza uma conta de acesso (nome, login, senha e/ou site).
export async function updateAccessCredential(
  id: number,
  data: { name: string; login: string; password: string; site?: string },
): Promise<{ success: boolean; error?: string; credential?: AccessCredential }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }

  if (!data.name?.trim() || !data.login?.trim() || !data.password?.trim()) {
    return { success: false, error: "Preencha nome, login e senha." }
  }

  const rawSite = data.site?.trim() || ""
  const site = rawSite ? (rawSite.startsWith("http") ? rawSite : `https://${rawSite}`) : null

  try {
    const rows = await sql`
      UPDATE pg_access_credentials
      SET name = ${data.name.trim()}, login = ${data.login.trim()}, password = ${data.password}, site = ${site}
      WHERE id = ${id}
      RETURNING id, name, login, password, site, sort_order, created_at
    `
    if ((rows as AccessCredential[]).length === 0) {
      return { success: false, error: "Conta não encontrada." }
    }
    revalidatePath("/demandas")
    return { success: true, credential: (rows as AccessCredential[])[0] }
  } catch (error: unknown) {
    console.error("Update access credential error:", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao atualizar conta: ${message}` }
  }
}

// Exclui uma conta de acesso.
export async function deleteAccessCredential(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) return { success: false, error: "Não autenticado" }

  try {
    await sql`DELETE FROM pg_access_credentials WHERE id = ${id}`
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete access credential error:", error)
    return { success: false, error: "Erro ao excluir conta" }
  }
}
