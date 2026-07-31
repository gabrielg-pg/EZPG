import { BetaAnalyticsDataClient } from "@google-analytics/data"
import { formatEngagement } from "@/lib/blog"

// Property ID do GA4 do site progrowthglobal.com.br
export const GA4_PROPERTY_ID = "498698837"

export type GaMetric = { slug: string; views: number; avg_engagement_seconds: number }

// Erro de credenciais para tratamento claro no client.
export class GaCredentialsError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Credenciais do Google não configuradas. Adicione GOOGLE_SERVICE_ACCOUNT_KEY (o JSON completo da conta de serviço) nas variáveis de ambiente do Vercel.",
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
    throw new GaCredentialsError("GOOGLE_SERVICE_ACCOUNT_KEY não é um JSON válido. Cole o conteúdo completo do arquivo .json da conta de serviço.")
  }
  if (!credentials.client_email || !credentials.private_key) throw new GaCredentialsError()
  // private_key pode vir com "\n" escapado quando colado como string.
  const privateKey = credentials.private_key.replace(/\\n/g, "\n")
  // Valida que a chave privada é um PEM real (o placeholder "..." não é).
  if (!privateKey.includes("BEGIN PRIVATE KEY") || !credentials.client_email.includes("@")) {
    throw new GaCredentialsError(
      "A chave da conta de serviço parece inválida ou é um placeholder. Cole o JSON completo baixado do Google Cloud em GOOGLE_SERVICE_ACCOUNT_KEY.",
    )
  }
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
