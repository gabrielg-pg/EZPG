// Tipos e constantes do módulo Blog (não é "use server", pode exportar valores).

export type KeywordStatus = "available" | "in_use" | "published"
export type PipelineStatus = "briefing" | "writing" | "design" | "review" | "published"

export type BlogKeyword = {
  id: number
  keyword: string
  status: KeywordStatus
}

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
  views: number
  avg_engagement: string
}

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
