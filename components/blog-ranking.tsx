"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, RefreshCw, Loader2, Eye, Clock, Layers, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"
import { computeScore, formatEngagement, MONTH_NAMES, type BlogArticle } from "@/lib/blog"

// Cores por etapa do funil.
const FUNNEL_STYLE: Record<string, string> = {
  Topo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Meio: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Fundo: "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

// Estilos dos 3 primeiros lugares do pódio.
const PODIUM = [
  { medal: "🥇", border: "border-[#C9A84C]", bg: "bg-[#C9A84C]/10", ring: "ring-[#C9A84C]/30" },
  { medal: "🥈", border: "border-[#A0A0A8]", bg: "bg-[#A0A0A8]/10", ring: "ring-[#A0A0A8]/30" },
  { medal: "🥉", border: "border-[#B87A50]", bg: "bg-[#B87A50]/10", ring: "ring-[#B87A50]/30" },
  { medal: "4", border: "border-border", bg: "bg-card", ring: "ring-transparent" },
]

type Scored = BlogArticle & { score: number | null }

type Props = {
  articles: BlogArticle[]
  onRefreshAll: (month?: number, year?: number) => Promise<void>
  onNavigate: (article: BlogArticle) => void
  year: number
}

export function BlogRanking({ articles, onRefreshAll, onNavigate, year }: Props) {
  const [period, setPeriod] = useState<string>("all") // "all" ou "MM" (mês)
  const [syncing, setSyncing] = useState(false)

  // Meses que têm ao menos 1 artigo publicado.
  const publishedMonths = useMemo(() => {
    const set = new Set<number>()
    for (const a of articles) if (a.pipeline_status === "published") set.add(a.month)
    return Array.from(set).sort((a, b) => a - b)
  }, [articles])

  // Artigos do período selecionado.
  const periodArticles = useMemo(() => {
    if (period === "all") return articles
    const m = Number(period)
    return articles.filter((a) => a.month === m)
  }, [articles, period])

  // Máximos do período para normalização do score.
  const maxViews = useMemo(() => Math.max(0, ...periodArticles.map((a) => a.views ?? 0)), [periodArticles])
  const maxEng = useMemo(
    () => Math.max(0, ...periodArticles.map((a) => a.avg_engagement_seconds ?? 0)),
    [periodArticles],
  )

  // Artigos com score, ordenados: com dados primeiro (score desc), sem slug/sem dados no fim.
  const ranked: Scored[] = useMemo(() => {
    const withScore = periodArticles.map((a) => ({
      ...a,
      score: computeScore(a, maxViews, maxEng),
    }))
    return withScore.sort((a, b) => {
      if (a.score === null && b.score === null) return 0
      if (a.score === null) return 1
      if (b.score === null) return -1
      return b.score - a.score
    })
  }, [periodArticles, maxViews, maxEng])

  // Sumário.
  const totalViews = periodArticles.reduce((s, a) => s + (a.views ?? 0), 0)
  const withData = periodArticles.filter((a) => a.article_slug?.trim() && ((a.views ?? 0) > 0 || (a.avg_engagement_seconds ?? 0) > 0)).length
  const bestEng = periodArticles.reduce<BlogArticle | null>(
    (best, a) => (!best || (a.avg_engagement_seconds ?? 0) > (best.avg_engagement_seconds ?? 0) ? a : best),
    null,
  )
  const scores = ranked.map((a) => a.score).filter((s): s is number => s !== null)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0

  // Última sincronização (mais recente entre os artigos).
  const lastSync = useMemo(() => {
    const dates = articles.map((a) => a.last_synced_at).filter(Boolean) as string[]
    if (dates.length === 0) return null
    return dates.reduce((max, d) => (new Date(d) > new Date(max) ? d : max))
  }, [articles])

  const top4 = ranked.slice(0, 4)

  const handleRefresh = async () => {
    setSyncing(true)
    try {
      if (period === "all") await onRefreshAll()
      else await onRefreshAll(Number(period), year)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy className="h-5 w-5 text-amber-400" />
          Ranking de performance
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-44 rounded-lg border-input bg-secondary/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
              <SelectItem value="all" className="rounded-lg">
                Geral
              </SelectItem>
              {publishedMonths.map((m) => (
                <SelectItem key={m} value={String(m)} className="rounded-lg">
                  {MONTH_NAMES[m - 1]} {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={syncing}
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar todos
          </Button>
        </div>
      </div>
      {lastSync && (
        <p className="text-xs text-muted-foreground">Última atualização: {timeAgo(lastSync)}</p>
      )}

      {/* Sumário */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total de acessos" value={totalViews.toLocaleString("pt-BR")} icon={Eye} />
        <SummaryCard label="Artigos com dados" value={String(withData)} icon={Layers} />
        <SummaryCard
          label="Melhor engajamento"
          value={bestEng && (bestEng.avg_engagement_seconds ?? 0) > 0 ? formatEngagement(bestEng.avg_engagement_seconds) : "—"}
          sub={bestEng && (bestEng.avg_engagement_seconds ?? 0) > 0 ? bestEng.title || `Artigo 0${bestEng.order}` : undefined}
          icon={Clock}
        />
        <SummaryCard label="Score médio" value={String(avgScore)} icon={Gauge} />
      </div>

      {/* Top 4 pódio */}
      {top4.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {top4.map((a, i) => {
            const p = PODIUM[i]
            const relative = top4[0]?.score ? Math.round(((a.score ?? 0) / (top4[0].score || 1)) * 100) : 0
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onNavigate(a)}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 text-left ring-1 transition-transform hover:scale-[1.01]",
                  p.border,
                  p.bg,
                  p.ring,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60 text-lg font-bold text-foreground">
                    {p.medal}
                  </span>
                  <Badge variant="outline" className={cn("shrink-0", FUNNEL_STYLE[a.funnel_stage] ?? "border-border")}>
                    {a.funnel_stage}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                  {a.title || `Artigo 0${a.order}`}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {(a.views ?? 0).toLocaleString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatEngagement(a.avg_engagement_seconds ?? 0)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Score</span>
                    <span className="font-semibold text-foreground">{a.score ?? "—"}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${a.score === null ? 0 : relative}%` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {top4.length === 0 && (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Nenhum artigo no período selecionado.
        </p>
      )}
    </section>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 truncate text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "agora mesmo"
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}
