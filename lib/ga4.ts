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

type ServiceAccount = { client_email?: string; private_key?: string }

// Remove um eventual wrapper de shell ($'...' ou '...') colado por engano junto ao valor.
function stripShellWrapper(value: string): string {
  let v = value.trim()
  if (v.startsWith("$'") && v.endsWith("'")) v = v.slice(2, -1)
  else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1)
  else if (v.startsWith('"') && v.endsWith('"') && !v.includes('": ')) v = v.slice(1, -1)
  return v
}

// Tenta transformar o valor bruto de uma env var em um JSON de conta de serviço válido.
// Aceita: JSON puro, JSON em base64, e JSON com wrapper/escapes de shell ($'...').
function parseServiceAccount(raw: string): ServiceAccount | null {
  const attempts: string[] = []
  const cleaned = stripShellWrapper(raw)
  attempts.push(raw, cleaned)
  // Escapes de shell ($'...'): \n \t \r \' \\ viram os caracteres reais.
  attempts.push(
    cleaned.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r").replace(/\\'/g, "'").replace(/\\\\/g, "\\"),
  )
  // Base64.
  try {
    const decoded = Buffer.from(raw.trim(), "base64").toString("utf8")
    if (decoded.trimStart().startsWith("{")) attempts.push(decoded)
  } catch {
    // ignora
  }
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as ServiceAccount
      if (parsed.client_email && parsed.private_key) return parsed
    } catch {
      // tenta o próximo formato
    }
  }
  // Último recurso: extrai os campos por regex direto do texto bruto. Isso é resiliente a
  // wrappers de shell ($'...'), quebras de linha e escapes que quebram o JSON.parse.
  const emailMatch = raw.match(/"client_email"\s*:\s*"([^"]+)"/)
  const keyMatch = raw.match(/"private_key"\s*:\s*"((?:\\.|[^"\\])*)"/)
  if (emailMatch && keyMatch) {
    return { client_email: emailMatch[1], private_key: keyMatch[1] }
  }
  return null
}

function isValid(sa: ServiceAccount | null): sa is Required<ServiceAccount> {
  if (!sa?.client_email || !sa.private_key) return false
  const pk = sa.private_key.replace(/\\n/g, "\n")
  return pk.includes("BEGIN PRIVATE KEY") && sa.client_email.includes("@")
}

function getClient(): BetaAnalyticsDataClient {
  if (cachedClient) return cachedClient
  // Aceita a chave em GOOGLE_SERVICE_ACCOUNT_KEY ou, como fallback, em GCP_SERVICE_ACCOUNT.
  const candidates = [process.env.GOOGLE_SERVICE_ACCOUNT_KEY, process.env.GCP_SERVICE_ACCOUNT].filter(
    (v): v is string => !!v && v.trim().length > 0,
  )
  if (candidates.length === 0) throw new GaCredentialsError()

  let credentials: Required<ServiceAccount> | null = null
  for (const raw of candidates) {
    const parsed = parseServiceAccount(raw)
    if (isValid(parsed)) {
      credentials = parsed
      break
    }
  }
  if (!credentials) {
    throw new GaCredentialsError(
      "A chave da conta de serviço parece inválida ou é um placeholder. Cole o JSON completo baixado do Google Cloud em GOOGLE_SERVICE_ACCOUNT_KEY.",
    )
  }

  // Converte "\n" e "\\" escapados (comuns quando a chave é colada como string) em caracteres reais.
  const privateKey = credentials.private_key.replace(/\\n/g, "\n").replace(/\\\\/g, "\\")
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
