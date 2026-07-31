import { BetaAnalyticsDataClient } from "@google-analytics/data"
import { formatEngagement } from "@/lib/blog"

// Property ID do GA4 do site progrowthglobal.com.br
export const GA4_PROPERTY_ID = "498698837"

export type GaMetric = { slug: string; views: number; avg_engagement_seconds: number }

// Erro de credenciais para tratamento claro no client.
export class GaCredentialsError extends Error {
  constructor() {
    super(
      "Credenciais do Google não configuradas. Adicione GOOGLE_SERVICE_ACCOUNT_KEY nas variáveis de ambiente do Vercel.",
    )
    this.name = "GaCredentialsError"
  }
}

// Normaliza um path para comparação: garante barra inicial e final, minúsculas, sem querystring.
export function normalizeSlug(path: string): string {
  if (!path) return ""
  let p = path.trim().toLowerCase()
  p = p.split("?")[0].split("#")[0]
  if (!p.startsWith("/")) p = `/${p}`
  if (!p.endsWith("/")) p = `${p}/`
  return p
}

let cachedClient: BetaAnalyticsDataClient | null = null

function getClient(): BetaAnalyticsDataClient {
  if (cachedClient) return cachedClient
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new GaCredentialsError()
  let credentials: { client_email?: string; private_key?: string }
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new GaCredentialsError()
  }
  if (!credentials.client_email || !credentials.private_key) throw new GaCredentialsError()
  // private_key pode vir com "\n" escapado quando colado como string.
  const privateKey = credentials.private_key.replace(/\\n/g, "\n")
  cachedClient = new BetaAnalyticsDataClient({
    credentials: { client_email: credentials.client_email, private_key: privateKey },
  })
  return cachedClient
}

type DateRange = { startDate: string; endDate: string }

// Consulta o GA4 e retorna views + engajamento por pagePath (bruto, sem filtro de slugs).
export async function fetchGaMetrics(range: DateRange): Promise<Map<string, GaMetric>> {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
    limit: 100000,
  })

  const result = new Map<string, GaMetric>()
  for (const row of response.rows ?? []) {
    const path = row.dimensionValues?.[0]?.value ?? ""
    const views = Math.round(Number(row.metricValues?.[0]?.value ?? 0))
    const seconds = Math.round(Number(row.metricValues?.[1]?.value ?? 0))
    const slug = normalizeSlug(path)
    if (!slug) continue
    const existing = result.get(slug)
    if (existing) {
      existing.views += views
      existing.avg_engagement_seconds = Math.max(existing.avg_engagement_seconds, seconds)
    } else {
      result.set(slug, { slug, views, avg_engagement_seconds: seconds })
    }
  }
  return result
}

// Reexporta para uso no route ao formatar o tempo salvo no banco.
export { formatEngagement }
