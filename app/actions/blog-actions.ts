"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { PIPELINE_ORDER, type BlogArticle, type BlogImage, type BlogKeyword, type KeywordStatus, type PipelineStatus, type ReviewItem } from "@/lib/blog"

const PATH = "/blog"

// Garante que o usuário tem acesso ao módulo Blog (admin ou permissão "blog").
async function requireBlogAccess() {
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())
  if (!roles.some((r) => ["admin", "blog"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

function mapArticle(row: Record<string, unknown>): BlogArticle {
  return {
    id: Number(row.id),
    month: Number(row.month),
    year: Number(row.year),
    order: Number(row.order),
    funnel_stage: String(row.funnel_stage ?? "Topo"),
    title: String(row.title ?? ""),
    publish_date: row.publish_date ? String(row.publish_date) : null,
    word_count: Number(row.word_count ?? 0),
    pipeline_status: (row.pipeline_status as PipelineStatus) ?? "briefing",
    cta: String(row.cta ?? ""),
    objective: String(row.objective ?? ""),
    context: String(row.context ?? ""),
    structure: Array.isArray(row.structure) ? (row.structure as string[]) : [],
    tone: String(row.tone ?? ""),
    keywords: Array.isArray(row.keywords) ? (row.keywords as unknown[]).map((k) => Number(k)) : [],
    image_url: row.image_url ? String(row.image_url) : null,
    image_filename: row.image_filename ? String(row.image_filename) : null,
    images: Array.isArray(row.images) ? (row.images as BlogImage[]) : [],
    content: String(row.content ?? ""),
    review: Array.isArray(row.review) ? (row.review as ReviewItem[]) : [],
    views: Number(row.views ?? 0),
    avg_engagement: String(row.avg_engagement ?? ""),
    avg_engagement_seconds: Number(row.avg_engagement_seconds ?? 0),
    article_slug: String(row.article_slug ?? ""),
    last_synced_at: row.last_synced_at ? String(row.last_synced_at) : null,
  }
}

// Recalcula o status de todas as keywords a partir dos artigos:
// - "published": usada em pelo menos um artigo já publicado
// - "in_use": usada em pelo menos um artigo em produção (não publicado)
// - "available": não usada em nenhum artigo ativo
async function recomputeKeywordStatuses() {
  const articles = await sql`SELECT keywords, pipeline_status FROM pg_blog_articles`
  const publishedIds = new Set<number>()
  const inUseIds = new Set<number>()
  for (const a of articles as Array<{ keywords: unknown; pipeline_status: string }>) {
    const ids = Array.isArray(a.keywords) ? (a.keywords as unknown[]).map((k) => Number(k)) : []
    for (const id of ids) {
      if (a.pipeline_status === "published") publishedIds.add(id)
      else inUseIds.add(id)
    }
  }
  const keywords = await sql`SELECT id FROM pg_blog_keywords`
  for (const k of keywords as Array<{ id: number }>) {
    let status: KeywordStatus = "available"
    if (publishedIds.has(k.id)) status = "published"
    else if (inUseIds.has(k.id)) status = "in_use"
    await sql`UPDATE pg_blog_keywords SET status = ${status} WHERE id = ${k.id}`
  }
}

export async function getBlogData(year: number): Promise<{ keywords: BlogKeyword[]; articles: BlogArticle[] }> {
  await requireBlogAccess()
  const keywordRows = await sql`SELECT id, keyword, status FROM pg_blog_keywords ORDER BY created_at ASC`
  const articleRows = await sql`
    SELECT id, month, year, "order", funnel_stage, title, publish_date, word_count, pipeline_status,
           cta, objective, context, structure, tone, keywords, image_url, image_filename,
           images, content, review, views, avg_engagement, avg_engagement_seconds, article_slug, last_synced_at
    FROM pg_blog_articles
    WHERE year = ${year}
    ORDER BY month ASC, "order" ASC
  `
  return {
    keywords: (keywordRows as Array<Record<string, unknown>>).map((k) => ({
      id: Number(k.id),
      keyword: String(k.keyword),
      status: (k.status as KeywordStatus) ?? "available",
    })),
    articles: (articleRows as Array<Record<string, unknown>>).map(mapArticle),
  }
}

// ---------- KEYWORDS ----------

export async function addKeyword(keyword: string): Promise<BlogKeyword> {
  await requireBlogAccess()
  const text = keyword.trim()
  if (!text) throw new Error("Keyword vazia")
  const rows = await sql`
    INSERT INTO pg_blog_keywords (keyword, status) VALUES (${text}, 'available')
    RETURNING id, keyword, status
  `
  revalidatePath(PATH)
  const r = (rows as Array<Record<string, unknown>>)[0]
  return { id: Number(r.id), keyword: String(r.keyword), status: r.status as KeywordStatus }
}

export async function updateKeyword(id: number, keyword: string): Promise<void> {
  await requireBlogAccess()
  await sql`UPDATE pg_blog_keywords SET keyword = ${keyword.trim()} WHERE id = ${id}`
  revalidatePath(PATH)
}

export async function deleteKeyword(id: number): Promise<void> {
  await requireBlogAccess()
  await sql`DELETE FROM pg_blog_keywords WHERE id = ${id}`
  revalidatePath(PATH)
}

// ---------- ARTIGOS ----------

// Verifica se um mês já tem artigos (para o modal "Novo mês").
export async function monthHasArticles(month: number, year: number): Promise<number> {
  await requireBlogAccess()
  const rows = await sql`SELECT COUNT(*)::int AS n FROM pg_blog_articles WHERE month = ${month} AND year = ${year}`
  return Number((rows as Array<{ n: number }>)[0]?.n ?? 0)
}

const FUNNEL_BY_ORDER = ["Topo", "Topo", "Meio", "Fundo"]

// Cria os artigos vazios de um mês (preenche até 4 no total).
export async function createMonthArticles(month: number, year: number): Promise<BlogArticle[]> {
  await requireBlogAccess()
  const existing = await sql`SELECT "order" FROM pg_blog_articles WHERE month = ${month} AND year = ${year}`
  const usedOrders = new Set((existing as Array<{ order: number }>).map((r) => Number(r.order)))
  for (let order = 1; order <= 4; order++) {
    if (usedOrders.has(order)) continue
    await sql`
      INSERT INTO pg_blog_articles (month, year, "order", funnel_stage, title, pipeline_status)
      VALUES (${month}, ${year}, ${order}, ${FUNNEL_BY_ORDER[order - 1]}, ${`Artigo 0${order}`}, 'briefing')
    `
  }
  revalidatePath(PATH)
  const rows = await sql`
    SELECT id, month, year, "order", funnel_stage, title, publish_date, word_count, pipeline_status,
           cta, objective, context, structure, tone, keywords, image_url, image_filename,
           images, content, review, views, avg_engagement, avg_engagement_seconds, article_slug, last_synced_at
    FROM pg_blog_articles WHERE month = ${month} AND year = ${year} ORDER BY "order" ASC
  `
  return (rows as Array<Record<string, unknown>>).map(mapArticle)
}

export async function updateArticle(
  id: number,
  patch: Partial<Omit<BlogArticle, "id" | "month" | "year" | "order">>,
): Promise<void> {
  await requireBlogAccess()
  // Atualiza apenas os campos enviados, um a um (mantém a query simples e segura).
  if (patch.funnel_stage !== undefined) await sql`UPDATE pg_blog_articles SET funnel_stage = ${patch.funnel_stage} WHERE id = ${id}`
  if (patch.title !== undefined) await sql`UPDATE pg_blog_articles SET title = ${patch.title} WHERE id = ${id}`
  if (patch.publish_date !== undefined) await sql`UPDATE pg_blog_articles SET publish_date = ${patch.publish_date || null} WHERE id = ${id}`
  if (patch.word_count !== undefined) await sql`UPDATE pg_blog_articles SET word_count = ${patch.word_count} WHERE id = ${id}`
  if (patch.cta !== undefined) await sql`UPDATE pg_blog_articles SET cta = ${patch.cta} WHERE id = ${id}`
  if (patch.objective !== undefined) await sql`UPDATE pg_blog_articles SET objective = ${patch.objective} WHERE id = ${id}`
  if (patch.context !== undefined) await sql`UPDATE pg_blog_articles SET context = ${patch.context} WHERE id = ${id}`
  if (patch.tone !== undefined) await sql`UPDATE pg_blog_articles SET tone = ${patch.tone} WHERE id = ${id}`
  if (patch.structure !== undefined) await sql`UPDATE pg_blog_articles SET structure = ${JSON.stringify(patch.structure)}::jsonb WHERE id = ${id}`
  if (patch.views !== undefined) await sql`UPDATE pg_blog_articles SET views = ${patch.views} WHERE id = ${id}`
  if (patch.avg_engagement !== undefined) await sql`UPDATE pg_blog_articles SET avg_engagement = ${patch.avg_engagement} WHERE id = ${id}`
  if (patch.article_slug !== undefined) await sql`UPDATE pg_blog_articles SET article_slug = ${patch.article_slug} WHERE id = ${id}`
  if (patch.image_url !== undefined) await sql`UPDATE pg_blog_articles SET image_url = ${patch.image_url}, image_filename = ${patch.image_filename ?? null} WHERE id = ${id}`
  if (patch.images !== undefined) await sql`UPDATE pg_blog_articles SET images = ${JSON.stringify(patch.images)}::jsonb WHERE id = ${id}`
  if (patch.review !== undefined) await sql`UPDATE pg_blog_articles SET review = ${JSON.stringify(patch.review)}::jsonb WHERE id = ${id}`
  if (patch.content !== undefined) {
    // Conteúdo da redação: recalcula a contagem de palavras automaticamente.
    const words = patch.content.trim() ? patch.content.trim().split(/\s+/).length : 0
    await sql`UPDATE pg_blog_articles SET content = ${patch.content}, word_count = ${words} WHERE id = ${id}`
  }
  if (patch.keywords !== undefined) {
    await sql`UPDATE pg_blog_articles SET keywords = ${JSON.stringify(patch.keywords)}::jsonb WHERE id = ${id}`
  }
  await sql`UPDATE pg_blog_articles SET updated_at = NOW() WHERE id = ${id}`
  // Mudanças em keywords ou publicação recalculam o banco de palavras-chave.
  if (patch.keywords !== undefined) await recomputeKeywordStatuses()
  revalidatePath(PATH)
}

export async function setArticlePipeline(id: number, status: PipelineStatus): Promise<{ publish_date: string | null }> {
  await requireBlogAccess()
  await sql`UPDATE pg_blog_articles SET pipeline_status = ${status}, updated_at = NOW() WHERE id = ${id}`
  // Ao publicar, grava automaticamente a data de hoje (se ainda não houver data definida).
  if (status === "published") {
    await sql`UPDATE pg_blog_articles SET publish_date = CURRENT_DATE WHERE id = ${id} AND publish_date IS NULL`
  }
  // Publicar/despublicar afeta o status das keywords associadas.
  await recomputeKeywordStatuses()
  revalidatePath(PATH)
  const rows = await sql`SELECT publish_date FROM pg_blog_articles WHERE id = ${id}`
  const pd = (rows as Array<{ publish_date: unknown }>)[0]?.publish_date
  return { publish_date: pd ? String(pd) : null }
}

export async function deleteArticle(id: number): Promise<void> {
  await requireBlogAccess()
  await sql`DELETE FROM pg_blog_articles WHERE id = ${id}`
  await recomputeKeywordStatuses()
  revalidatePath(PATH)
}
