"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export type Market = {
  id: number
  name: string
  slug: string
  flag: string
  language: string
  currency: string
  status: "active" | "archived"
  sort_order: number
  updated_at: string
  updated_by_name: string | null
  section_count?: number
  section_values?: Record<string, unknown>
}

export type MarketSection = {
  id: number
  title: string
  section_key: string | null
  section_type: "text" | "key_value" | "table"
  content: Record<string, unknown>
  sort_order: number
  visible: boolean
}

const DEFAULT_SECTIONS = [
  ["Método de Envio", "shipping", "key_value"],
  ["Códigos de Desconto Shopify", "discounts", "table"],
  ["Termos Utilizados", "terms", "table"],
  ["Domínio", "domain", "key_value"],
  ["E-mail", "email", "key_value"],
  ["Pagamentos", "payments", "key_value"],
  ["Páginas Legais", "legal", "table"],
  ["Observações Gerais", "notes", "text"],
] as const

async function access() {
  const session = await getSession()
  if (!session.user) redirect("/login")

  const roles = [session.user.role, ...(session.user.roles ?? [])]
    .filter((role): role is string => typeof role === "string")
    .map((role) => role.toLowerCase())
  const isAdmin = roles.includes("admin")

  if (!isAdmin && !roles.includes("zona_execucao")) redirect("/dashboard")
  return { user: session.user, isAdmin }
}

async function admin() {
  const result = await access()
  if (!result.isAdmin) redirect("/dashboard")
  return result.user
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 130)
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505"
}

export async function getMarkets(query = ""): Promise<Market[]> {
  await access()
  const q = `%${query.trim()}%`

  return (await sql`
    SELECT
      m.id,
      m.name,
      m.slug,
      m.flag,
      m.language,
      m.currency,
      m.status,
      m.sort_order,
      m.updated_at,
      u.name AS updated_by_name,
      summary.section_count,
      summary.section_values
    FROM pg_market_guides m
    LEFT JOIN users u ON u.id = m.updated_by
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS section_count,
        COALESCE(
          jsonb_object_agg(COALESCE(s.section_key, s.title), s.content),
          '{}'::jsonb
        ) AS section_values
      FROM pg_market_guide_sections s
      WHERE s.market_id = m.id AND s.visible = true
    ) summary ON true
    WHERE m.status = 'active'
      AND (
        m.name ILIKE ${q}
        OR m.language ILIKE ${q}
        OR m.currency ILIKE ${q}
        OR EXISTS (
          SELECT 1
          FROM pg_market_guide_sections sx
          WHERE sx.market_id = m.id
            AND sx.visible = true
            AND sx.content::text ILIKE ${q}
        )
      )
    ORDER BY m.sort_order, m.name
  `) as Market[]
}

export async function getMarket(slug: string) {
  const { isAdmin } = await access()
  const rows = await sql`
    SELECT
      m.id,
      m.name,
      m.slug,
      m.flag,
      m.language,
      m.currency,
      m.status,
      m.sort_order,
      m.updated_at,
      u.name AS updated_by_name
    FROM pg_market_guides m
    LEFT JOIN users u ON u.id = m.updated_by
    WHERE m.slug = ${slug}
    LIMIT 1
  `

  if (!rows[0]) return null

  const sections = await sql`
    SELECT id, title, section_key, section_type, content, sort_order, visible
    FROM pg_market_guide_sections
    WHERE market_id = ${rows[0].id}
      AND (visible = true OR ${isAdmin} = true)
    ORDER BY sort_order, id
  `

  return { market: rows[0] as Market, sections: sections as MarketSection[] }
}

export async function createMarket() {
  const user = await admin()

  try {
    const existingNames = await sql`
      SELECT name FROM pg_market_guides WHERE name ILIKE 'Novo mercado%'
    `
    const usedNames = new Set(existingNames.map((row) => String(row.name).toLowerCase()))
    let name = "Novo mercado"
    let suffix = 2

    while (usedNames.has(name.toLowerCase())) {
      name = `Novo mercado ${suffix}`
      suffix += 1
    }

    const slug = slugify(name)
    const sectionDefinitions = DEFAULT_SECTIONS.map(([title, section_key, section_type], sort_order) => ({
      title,
      section_key,
      section_type,
      sort_order,
    }))

    const rows = await sql`
      WITH next_order AS (
        SELECT COALESCE(MIN(sort_order), 0) - 1 AS sort_order
        FROM pg_market_guides
      ),
      inserted_market AS (
        INSERT INTO pg_market_guides (
          name, slug, flag, language, currency, sort_order, updated_by
        )
        SELECT ${name}, ${slug}, '🌐', '', '', next_order.sort_order, ${user.id}
        FROM next_order
        RETURNING id, name, slug, flag, language, currency, status, sort_order, updated_at
      ),
      inserted_sections AS (
        INSERT INTO pg_market_guide_sections (
          market_id, title, section_key, section_type, sort_order
        )
        SELECT
          inserted_market.id,
          section.title,
          section.section_key,
          section.section_type,
          section.sort_order
        FROM inserted_market
        CROSS JOIN jsonb_to_recordset(${JSON.stringify(sectionDefinitions)}::jsonb)
          AS section(title text, section_key text, section_type text, sort_order integer)
        RETURNING id
      )
      SELECT
        inserted_market.*,
        (SELECT COUNT(*)::int FROM inserted_sections) AS section_count,
        '{}'::jsonb AS section_values,
        ${user.name}::text AS updated_by_name
      FROM inserted_market
    `

    if (!rows[0]) return { error: "Não foi possível criar o card de mercado." }

    revalidatePath("/guia-de-mercados")
    return { market: rows[0] as Market }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Já existe um card com esse nome. Tente novamente." }
    }

    return { error: "Não foi possível criar o mercado. Tente novamente." }
  }
}

export async function updateMarket(
  id: number,
  input: { name: string; flag: string; language: string; currency: string },
) {
  const user = await admin()
  const name = input.name.trim()
  const flag = input.flag.trim() || "🌐"
  const language = input.language.trim()
  const currency = input.currency.trim()

  if (!Number.isInteger(id)) return { error: "Mercado inválido." }
  if (!name) return { error: "Informe o nome do mercado." }
  if (name.length > 120 || flag.length > 16 || language.length > 100 || currency.length > 40) {
    return { error: "Confira o limite de caracteres dos campos." }
  }

  const slug = slugify(name)
  if (!slug) return { error: "Informe um nome válido para o mercado." }

  try {
    const rows = await sql`
      UPDATE pg_market_guides
      SET
        name = ${name},
        slug = ${slug},
        flag = ${flag},
        language = ${language},
        currency = ${currency},
        updated_by = ${user.id},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING slug, updated_at
    `

    if (!rows[0]) return { error: "Mercado não encontrado." }

    revalidatePath("/guia-de-mercados")
    revalidatePath("/guia-de-mercados/[slug]", "page")
    return { slug: String(rows[0].slug), updated_at: String(rows[0].updated_at) }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Já existe outro mercado com esse nome." }
    return { error: "Não foi possível salvar o mercado. Tente novamente." }
  }
}

export async function archiveMarket(id: number) {
  const user = await admin()
  await sql`
    UPDATE pg_market_guides
    SET status = 'archived', updated_by = ${user.id}, updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath("/guia-de-mercados")
  revalidatePath("/guia-de-mercados/[slug]", "page")
}

export async function duplicateMarket(id: number) {
  const user = await admin()
  const source = await sql`
    SELECT name, flag, language, currency
    FROM pg_market_guides
    WHERE id = ${id}
    LIMIT 1
  `

  if (!source[0]) return { error: "Mercado não encontrado." }

  const name = `${source[0].name} (cópia)`
  const slug = `${slugify(String(source[0].name))}-${Date.now().toString(36)}`
  const created = await sql`
    INSERT INTO pg_market_guides (name, slug, flag, language, currency, updated_by)
    VALUES (${name}, ${slug}, ${source[0].flag}, ${source[0].language}, ${source[0].currency}, ${user.id})
    RETURNING id, slug
  `

  await sql`
    INSERT INTO pg_market_guide_sections (
      market_id, title, section_key, section_type, content, sort_order, visible
    )
    SELECT ${created[0].id}, title, section_key, section_type, content, sort_order, visible
    FROM pg_market_guide_sections
    WHERE market_id = ${id}
  `

  revalidatePath("/guia-de-mercados")
  return { slug: created[0].slug }
}

export async function updateSection(
  id: number,
  input: { title: string; content: Record<string, unknown>; visible: boolean },
) {
  const user = await admin()
  const title = input.title.trim()

  if (!Number.isInteger(id)) return { error: "Seção inválida." }
  if (!title) return { error: "Informe um título para a seção." }
  if (!input.content || typeof input.content !== "object" || Array.isArray(input.content)) {
    return { error: "O conteúdo da seção é inválido." }
  }

  try {
    const rows = await sql`
      WITH updated_section AS (
        UPDATE pg_market_guide_sections
        SET
          title = ${title},
          content = ${JSON.stringify(input.content)}::jsonb,
          visible = ${input.visible},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING market_id
      )
      UPDATE pg_market_guides
      SET updated_by = ${user.id}, updated_at = NOW()
      WHERE id = (SELECT market_id FROM updated_section)
      RETURNING id
    `

    if (!rows[0]) return { error: "Seção não encontrada." }

    revalidatePath("/guia-de-mercados")
    revalidatePath("/guia-de-mercados/[slug]", "page")
    return { success: true as const }
  } catch {
    return { error: "Não foi possível salvar esta seção. Tente novamente." }
  }
}

export async function createSection(
  marketId: number,
  input: { title: string; sectionType: "text" | "key_value" | "table" },
) {
  await admin()
  const title = input.title.trim()
  if (!title) return { error: "Informe um título para a seção." }

  const result = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next
    FROM pg_market_guide_sections
    WHERE market_id = ${marketId}
  `
  await sql`
    INSERT INTO pg_market_guide_sections (market_id, title, section_type, sort_order)
    VALUES (${marketId}, ${title}, ${input.sectionType}, ${result[0].next})
  `
  revalidatePath("/guia-de-mercados")
  revalidatePath("/guia-de-mercados/[slug]", "page")
  return { success: true as const }
}

export async function reorderSections(ids: number[]) {
  await admin()
  for (const [index, id] of ids.entries()) {
    await sql`UPDATE pg_market_guide_sections SET sort_order = ${index} WHERE id = ${id}`
  }
  revalidatePath("/guia-de-mercados", "layout")
}

export async function deleteSection(id: number) {
  await admin()
  await sql`DELETE FROM pg_market_guide_sections WHERE id = ${id}`
  revalidatePath("/guia-de-mercados")
  revalidatePath("/guia-de-mercados/[slug]", "page")
}

export async function getAdminAccess() {
  return (await access()).isAdmin
}
