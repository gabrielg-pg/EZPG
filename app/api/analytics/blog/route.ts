import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { fetchGaMetrics, normalizeSlug, GaCredentialsError, type GaMetric } from "@/lib/ga4"
import { formatEngagement } from "@/lib/blog"

/**
 * GET /api/analytics/blog
 *   ?all=true               -> dados acumulados de todos os períodos
 *   ?month=7&year=2026      -> filtra pelo mês/ano indicados
 *   &slug=/meu-artigo/      -> (opcional) retorna apenas o artigo desse slug
 *
 * Autentica via Service Account (GOOGLE_SERVICE_ACCOUNT_KEY). Nunca expõe a chave.
 * Cacheia os resultados do GA4 por 30 minutos para respeitar as quotas da API.
 */

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutos
type CacheEntry = { at: number; data: Map<string, GaMetric> }
const gaCache = new Map<string, CacheEntry>()

function monthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0)) // último dia do mês
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { startDate: iso(start), endDate: iso(end) }
}

export async function GET(request: NextRequest) {
  // Segurança: apenas usuários com acesso ao módulo Blog.
  const { user } = await getSession()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())
  if (!roles.some((r) => ["admin", "blog"].includes(r))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const all = params.get("all") === "true"
  const month = Number(params.get("month"))
  const year = Number(params.get("year"))
  const slugFilter = params.get("slug")

  // Define o intervalo de datas e a chave de cache.
  let range: { startDate: string; endDate: string }
  let cacheKey: string
  if (all || !month || !year) {
    range = { startDate: "2020-01-01", endDate: "today" }
    cacheKey = "all"
  } else {
    range = monthRange(month, year)
    cacheKey = `${year}-${month}`
  }

  try {
    // Cache de 30 min por intervalo.
    let entry = gaCache.get(cacheKey)
    if (!entry || Date.now() - entry.at > CACHE_TTL_MS) {
      const data = await fetchGaMetrics(range)
      entry = { at: Date.now(), data }
      gaCache.set(cacheKey, entry)
    }

    // Slugs cadastrados nos artigos.
    const rows = await sql`SELECT id, article_slug FROM pg_blog_articles WHERE article_slug IS NOT NULL AND article_slug <> ''`
    const bySlug = new Map<string, number[]>()
    for (const r of rows as Array<{ id: number; article_slug: string }>) {
      const key = normalizeSlug(r.article_slug)
      if (!key) continue
      bySlug.set(key, [...(bySlug.get(key) ?? []), Number(r.id)])
    }

    // Monta o resultado apenas para os slugs existentes na tabela.
    const results: Array<{ slug: string; views: number; avg_engagement_seconds: number }> = []
    const syncedAt = new Date()
    for (const [slug, ids] of bySlug.entries()) {
      if (slugFilter && normalizeSlug(slugFilter) !== slug) continue
      const metric = entry.data.get(slug)
      const views = metric?.views ?? 0
      const seconds = metric?.avg_engagement_seconds ?? 0
      results.push({ slug, views, avg_engagement_seconds: seconds })
      // Persiste no banco para evitar novas chamadas a cada load de página.
      for (const id of ids) {
        await sql`
          UPDATE pg_blog_articles
          SET views = ${views}, avg_engagement_seconds = ${seconds},
              avg_engagement = ${formatEngagement(seconds)}, last_synced_at = ${syncedAt.toISOString()}
          WHERE id = ${id}
        `
      }
    }

    return NextResponse.json({ results, synced_at: syncedAt.toISOString() })
  } catch (error) {
    if (error instanceof GaCredentialsError) {
      return NextResponse.json({ error: error.message, code: "no_credentials" }, { status: 500 })
    }
    const msg = error instanceof Error ? error.message : String(error)
    console.log("[v0] GA4 erro bruto:", msg.split("\n")[0])
    // API Data do GA4 desabilitada no projeto do Google Cloud.
    if (/Google Analytics Data API has not been used|analyticsdata\.googleapis\.com|SERVICE_DISABLED|has not been used in project/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "A Google Analytics Data API está desabilitada no projeto do Google Cloud. Ative-a em console.cloud.google.com (APIs e serviços → ative 'Google Analytics Data API') e tente de novo em alguns minutos.",
          code: "api_disabled",
        },
        { status: 500 },
      )
    }
    // Erros típicos de chave privada malformada ou conta sem acesso à property.
    if (/DECODER|private key|invalid_grant|PERMISSION_DENIED|caller does not have permission/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Falha na autenticação com o Google Analytics. Verifique se a chave da conta de serviço é o JSON completo e se o e-mail da conta tem acesso à property do GA4.",
          code: "auth_failed",
        },
        { status: 500 },
      )
    }
    console.error("[v0] Erro GA4:", error)
    return NextResponse.json({ error: "Erro ao carregar métricas — tente novamente" }, { status: 500 })
  }
}
