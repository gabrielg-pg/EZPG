// Tipos e constantes do módulo Blog (não é "use server", pode exportar valores).

export type KeywordStatus = "available" | "in_use" | "published"
export type PipelineStatus = "briefing" | "writing" | "design" | "review" | "published"

export type BlogKeyword = {
  id: number
  keyword: string
  status: KeywordStatus
}

export type BlogImage = { url: string; filename: string }
export type ReviewItem = { label: string; done: boolean }

export type BlogArticle = {
  id: number
  month: number
  year: number
  order: number
  funnel_stage: string
  title: string
  publish_date: string | null
  word_count: number
  pipeline_status: PipelineStatus
  cta: string
  objective: string
  context: string
  structure: string[]
  tone: string
  keywords: number[]
  image_url: string | null
  image_filename: string | null
  images: BlogImage[]
  content: string
  review: ReviewItem[]
  views: number
  avg_engagement: string
  avg_engagement_seconds: number
  article_slug: string
  last_synced_at: string | null
}

// Formata segundos em "Xm Ys" (ou "Ys" quando < 1 min). Sempre inteiros.
export function formatEngagement(seconds: number): string {
  const s = Math.round(seconds || 0)
  if (s <= 0) return "—"
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${String(rem).padStart(2, "0")}s`
}

// Score de performance 0–100 a partir de views e engajamento, normalizados pelo máximo do período.
// score = (views/maxViews * 0.6 + engRatio * 0.4) * 100
export function computeScore(
  article: Pick<BlogArticle, "views" | "avg_engagement_seconds">,
  maxViews: number,
  maxEngagement: number,
): number | null {
  const hasData = (article.views ?? 0) > 0 || (article.avg_engagement_seconds ?? 0) > 0
  if (!hasData) return null
  const viewRatio = maxViews > 0 ? (article.views ?? 0) / maxViews : 0
  const engRatio = maxEngagement > 0 ? (article.avg_engagement_seconds ?? 0) / maxEngagement : 0
  return Math.round((viewRatio * 0.6 + engRatio * 0.4) * 100)
}

// Tópicos padrão de revisão editorial (usados quando o artigo ainda não tem checklist).
export const DEFAULT_REVIEW_TOPICS = [
  "Título e meta description otimizados para SEO",
  "Palavras-chave presentes ao longo do texto",
  "Ortografia e gramática revisadas",
  "Links internos e externos funcionando",
  "CTA claro e bem posicionado",
  "Imagens inseridas e otimizadas",
  "Escaneabilidade (intertítulos, listas, parágrafos curtos)",
]

// Ordem canônica do pipeline editorial.
export const PIPELINE_ORDER: PipelineStatus[] = ["briefing", "writing", "design", "review", "published"]

// Rótulos e cores de cada etapa do pipeline.
export const PIPELINE_META: Record<PipelineStatus, { label: string; color: string; dot: string }> = {
  briefing: { label: "Briefing", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  writing: { label: "Redação", color: "bg-blue-500/15 text-blue-400 border-blue-500/25", dot: "bg-blue-400" },
  design: { label: "Design", color: "bg-orange-500/15 text-orange-400 border-orange-500/25", dot: "bg-orange-400" },
  review: { label: "Revisão", color: "bg-primary/15 text-primary border-primary/25", dot: "bg-primary" },
  published: { label: "Publicado", color: "bg-green-500/15 text-green-400 border-green-500/25", dot: "bg-green-400" },
}

export const FUNNEL_STAGES = ["Topo", "Meio", "Fundo"] as const

export const KEYWORD_META: Record<KeywordStatus, { label: string; color: string }> = {
  available: { label: "Disponível", color: "bg-green-500/15 text-green-400 border-green-500/25" },
  in_use: { label: "Em uso", color: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  published: { label: "Publicada", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
