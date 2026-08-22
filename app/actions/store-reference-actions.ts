"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type StoreReferenceEntry = {
  id: number
  // Campos legados (mantidos para compatibilidade / migração)
  name: string
  site: string
  niche: string
  country: string // código do país (br, us, pt ...)
  // Campos da planilha de mineração (estilo Excel)
  mercado: string
  loja_url: string
  fashion_apenas: string
  confianca_dropshipping: string
  produtos_catalogo: string
  monthly_visits: string
  tendencia_3meses: string
  canais_principais: string
  ads_ativos: string
  anuncio_mais_antigo: string
  reach_melhores_ads: string
  variantes_produto: string
  top5_bestsellers: string
  ppspy_estimado: string
  google_trends: string
  tiktok_ugc: string
  classe: string
  created_by: number | null
  created_by_name: string | null
  created_at: string
}

// Colunas editáveis da planilha (whitelist — nomes de coluna NÃO podem ser parametrizados)
// Não é exportada: arquivos "use server" só podem exportar funções async.
const STORE_REFERENCE_FIELDS = [
  "mercado",
  "loja_url",
  "fashion_apenas",
  "confianca_dropshipping",
  "produtos_catalogo",
  "monthly_visits",
  "tendencia_3meses",
  "canais_principais",
  "ads_ativos",
  "anuncio_mais_antigo",
  "reach_melhores_ads",
  "variantes_produto",
  "top5_bestsellers",
  "ppspy_estimado",
  "google_trends",
  "tiktok_ugc",
  "classe",
] as const

export type StoreReferenceField = (typeof STORE_REFERENCE_FIELDS)[number]

// Garante que a tabela existe (compartilhada por todos os usuários)
export async function createStoreReferencesTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_store_references (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL DEFAULT '',
      site VARCHAR(500) NOT NULL DEFAULT '',
      niche VARCHAR(255) NOT NULL DEFAULT '',
      country VARCHAR(10) NOT NULL DEFAULT '',
      created_by INTEGER,
      created_by_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Migração: torna os campos legados opcionais (planilha permite linha em branco)
  await sql`ALTER TABLE pg_store_references ALTER COLUMN name SET DEFAULT ''`
  await sql`ALTER TABLE pg_store_references ALTER COLUMN site SET DEFAULT ''`
  await sql`ALTER TABLE pg_store_references ALTER COLUMN niche SET DEFAULT ''`
  await sql`ALTER TABLE pg_store_references ALTER COLUMN country SET DEFAULT ''`

  // Migração: adiciona as colunas da planilha de mineração
  await sql`
    ALTER TABLE pg_store_references
      ADD COLUMN IF NOT EXISTS mercado VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS loja_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS fashion_apenas VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS confianca_dropshipping VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS produtos_catalogo VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS monthly_visits VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS tendencia_3meses VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS canais_principais VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS ads_ativos VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS anuncio_mais_antigo VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS reach_melhores_ads VARCHAR(150) DEFAULT '',
      ADD COLUMN IF NOT EXISTS variantes_produto VARCHAR(100) DEFAULT '',
      ADD COLUMN IF NOT EXISTS top5_bestsellers TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS ppspy_estimado VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS google_trends VARCHAR(150) DEFAULT '',
      ADD COLUMN IF NOT EXISTS tiktok_ugc VARCHAR(150) DEFAULT '',
      ADD COLUMN IF NOT EXISTS classe VARCHAR(50) DEFAULT ''
  `

  // Backfill (uma única vez por linha): país -> Mercado
  await sql`
    UPDATE pg_store_references
    SET mercado = CASE country
      WHEN 'br' THEN 'Brasil'
      WHEN 'us' THEN 'Estados Unidos'
      WHEN 'pt' THEN 'Portugal'
      WHEN 'es' THEN 'Espanha'
      WHEN 'de' THEN 'Alemanha'
      WHEN 'ca' THEN 'Canadá'
      WHEN 'gb' THEN 'Reino Unido'
      WHEN 'au' THEN 'Austrália'
      WHEN 'fr' THEN 'França'
      WHEN 'it' THEN 'Itália'
      ELSE UPPER(country)
    END
    WHERE (mercado IS NULL OR mercado = '') AND country IS NOT NULL AND country <> ''
  `

  // Backfill: nome + site -> "Loja + URL"
  await sql`
    UPDATE pg_store_references
    SET loja_url = COALESCE(name, '') ||
      CASE WHEN COALESCE(site, '') <> '' THEN ' — ' || site ELSE '' END
    WHERE (loja_url IS NULL OR loja_url = '')
      AND (COALESCE(name, '') <> '' OR COALESCE(site, '') <> '')
  `
}

export type StoreReferenceCountry = {
  code: string
  name: string
  sort_order: number
}

const DEFAULT_COUNTRIES: { code: string; name: string }[] = [
  { code: "br", name: "Brasil" },
  { code: "us", name: "Estados Unidos" },
  { code: "pt", name: "Portugal" },
  { code: "es", name: "Espanha" },
  { code: "de", name: "Alemanha" },
  { code: "ca", name: "Canadá" },
  { code: "gb", name: "Reino Unido" },
  { code: "au", name: "Austrália" },
  { code: "fr", name: "França" },
  { code: "it", name: "Itália" },
]

// Garante a tabela de países ativos e a semeia (uma única vez) com os padrões
export async function createStoreReferenceCountriesTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_store_reference_countries (
      code VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  const existing = await sql`SELECT COUNT(*)::int AS count FROM pg_store_reference_countries`
  const count = (existing[0] as { count: number }).count
  if (count === 0) {
    for (let i = 0; i < DEFAULT_COUNTRIES.length; i++) {
      const c = DEFAULT_COUNTRIES[i]
      await sql`
        INSERT INTO pg_store_reference_countries (code, name, sort_order)
        VALUES (${c.code}, ${c.name}, ${i})
        ON CONFLICT (code) DO NOTHING
      `
    }
  }
}

// Busca os países ativos (global)
export async function getStoreReferenceCountries(): Promise<StoreReferenceCountry[]> {
  const rows = await sql`
    SELECT code, name, sort_order
    FROM pg_store_reference_countries
    ORDER BY sort_order ASC, name ASC
  `
  return rows as StoreReferenceCountry[]
}

// Adiciona um país à lista ativa
export async function addStoreReferenceCountry(data: {
  code: string
  name: string
}): Promise<{ success: boolean; error?: string; country?: StoreReferenceCountry }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }
  if (!data.code?.trim() || !data.name?.trim()) {
    return { success: false, error: "Selecione um país" }
  }

  try {
    const orderRows = await sql`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM pg_store_reference_countries
    `
    const nextOrder = (orderRows[0] as { next_order: number }).next_order
    const rows = await sql`
      INSERT INTO pg_store_reference_countries (code, name, sort_order)
      VALUES (${data.code.trim().toLowerCase()}, ${data.name.trim()}, ${nextOrder})
      ON CONFLICT (code) DO NOTHING
      RETURNING code, name, sort_order
    `
    if (rows.length === 0) {
      return { success: false, error: "Esse país já foi adicionado." }
    }
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true, country: rows[0] as StoreReferenceCountry }
  } catch (error: unknown) {
    console.error("Add store reference country error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar país: ${errorMessage}` }
  }
}

// Remove um país da lista ativa (e as lojas associadas a ele)
export async function deleteStoreReferenceCountry(code: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_store_references WHERE country = ${code}`
    await sql`DELETE FROM pg_store_reference_countries WHERE code = ${code}`
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete store reference country error:", error)
    return { success: false, error: "Erro ao excluir país" }
  }
}

// Busca TODAS as lojas de referência (global, sem filtro por usuário)
export async function getStoreReferences(): Promise<StoreReferenceEntry[]> {
  const stores = await sql`
    SELECT
      id, name, site, niche, country,
      COALESCE(mercado, '') AS mercado,
      COALESCE(loja_url, '') AS loja_url,
      COALESCE(fashion_apenas, '') AS fashion_apenas,
      COALESCE(confianca_dropshipping, '') AS confianca_dropshipping,
      COALESCE(produtos_catalogo, '') AS produtos_catalogo,
      COALESCE(monthly_visits, '') AS monthly_visits,
      COALESCE(tendencia_3meses, '') AS tendencia_3meses,
      COALESCE(canais_principais, '') AS canais_principais,
      COALESCE(ads_ativos, '') AS ads_ativos,
      COALESCE(anuncio_mais_antigo, '') AS anuncio_mais_antigo,
      COALESCE(reach_melhores_ads, '') AS reach_melhores_ads,
      COALESCE(variantes_produto, '') AS variantes_produto,
      COALESCE(top5_bestsellers, '') AS top5_bestsellers,
      COALESCE(ppspy_estimado, '') AS ppspy_estimado,
      COALESCE(google_trends, '') AS google_trends,
      COALESCE(tiktok_ugc, '') AS tiktok_ugc,
      COALESCE(classe, '') AS classe,
      created_by, created_by_name, created_at
    FROM pg_store_references
    ORDER BY id ASC
  `
  return stores as StoreReferenceEntry[]
}

// Cria uma linha em branco na planilha (o usuário preenche as células depois)
export async function createStoreReferenceRow(): Promise<{
  success: boolean
  error?: string
  store?: StoreReferenceEntry
}> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    const rows = await sql`
      INSERT INTO pg_store_references (name, site, niche, country, created_by, created_by_name)
      VALUES ('', '', '', '', ${user.id}, ${user.name})
      RETURNING
        id, name, site, niche, country,
        COALESCE(mercado, '') AS mercado,
        COALESCE(loja_url, '') AS loja_url,
        COALESCE(fashion_apenas, '') AS fashion_apenas,
        COALESCE(confianca_dropshipping, '') AS confianca_dropshipping,
        COALESCE(produtos_catalogo, '') AS produtos_catalogo,
        COALESCE(monthly_visits, '') AS monthly_visits,
        COALESCE(tendencia_3meses, '') AS tendencia_3meses,
        COALESCE(canais_principais, '') AS canais_principais,
        COALESCE(ads_ativos, '') AS ads_ativos,
        COALESCE(anuncio_mais_antigo, '') AS anuncio_mais_antigo,
        COALESCE(reach_melhores_ads, '') AS reach_melhores_ads,
        COALESCE(variantes_produto, '') AS variantes_produto,
        COALESCE(top5_bestsellers, '') AS top5_bestsellers,
        COALESCE(ppspy_estimado, '') AS ppspy_estimado,
        COALESCE(google_trends, '') AS google_trends,
        COALESCE(tiktok_ugc, '') AS tiktok_ugc,
        COALESCE(classe, '') AS classe,
        created_by, created_by_name, created_at
    `
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true, store: rows[0] as StoreReferenceEntry }
  } catch (error: unknown) {
    console.error("Create store reference row error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar linha: ${errorMessage}` }
  }
}

// Atualiza uma única célula da planilha. O nome do campo é validado contra a whitelist.
export async function updateStoreReferenceField(
  id: number,
  field: string,
  value: string,
): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }
  if (!STORE_REFERENCE_FIELDS.includes(field as StoreReferenceField)) {
    return { success: false, error: "Campo inválido" }
  }

  try {
    // field vem de uma whitelist fixa; value é parametrizado ($1)
    await sql.query(`UPDATE pg_store_references SET ${field} = $1 WHERE id = $2`, [value ?? "", id])
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true }
  } catch (error: unknown) {
    console.error("Update store reference field error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao salvar: ${errorMessage}` }
  }
}

// Adiciona uma loja de referência (qualquer usuário logado; visível para todos)
export async function createStoreReference(data: {
  name: string
  site: string
  niche: string
  country: string
}): Promise<{ success: boolean; error?: string; store?: StoreReferenceEntry }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  if (!data.name?.trim() || !data.site?.trim() || !data.niche || !data.country) {
    return { success: false, error: "Dados incompletos" }
  }

  const site = data.site.trim().startsWith("http") ? data.site.trim() : `https://${data.site.trim()}`

  try {
    const rows = await sql`
      INSERT INTO pg_store_references (name, site, niche, country, created_by, created_by_name)
      VALUES (${data.name.trim()}, ${site}, ${data.niche}, ${data.country}, ${user.id}, ${user.name})
      RETURNING id, name, site, niche, country, created_by, created_by_name, created_at
    `
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true, store: rows[0] as StoreReferenceEntry }
  } catch (error: unknown) {
    console.error("Create store reference error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar loja: ${errorMessage}` }
  }
}

// Exclui uma loja de referência (qualquer usuário logado)
export async function deleteStoreReference(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_store_references WHERE id = ${id}`
    revalidatePath("/referencia-lojas")
    revalidatePath("/demandas")
    return { success: true }
  } catch (error) {
    console.error("Delete store reference error:", error)
    return { success: false, error: "Erro ao excluir loja" }
  }
}
