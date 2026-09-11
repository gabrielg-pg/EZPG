"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Flame, Eye, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { computeScore, formatEngagement, MONTH_NAMES, type BlogArticle } from "@/lib/blog"

// Cores por etapa do funil (Topo = verde, Meio = azul, Fundo = âmbar).
const FUNNEL_STYLE: Record<string, string> = {
  Topo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Meio: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Fundo: "bg-amber-500/15 text-amber-400 border-amber-500/30",
}

// Medalhas para os 3 primeiros lugares; demais usam o número.
const MEDALS = ["🥇", "🥈", "🥉"]
const RANK_STYLE = [
  "text-[#C9A84C]", // ouro
  "text-[#A0A0A8]", // prata
  "text-[#B87A50]", // bronze
]

type Props = {
  articles: BlogArticle[]
  onNavigate: (article: BlogArticle) => void
  lastSync: string | null
}

export function BlogTopAllTime({ articles, onNavigate, lastSync }: Props) {
  // Apenas artigos com slug e com algum dado do GA4, de todos os meses (sem filtro de data).
  const withData = useMemo(
    () =>
      articles.filter(
        (a) => a.article_slug?.trim() && ((a.views ?? 0) > 0 || (a.avg_engagement_seconds ?? 0) > 0),
      ),
    [articles],
  )

  const maxViews = useMemo(() => Math.max(0, ...withData.map((a) => a.views ?? 0)), [withData])
  const maxEng = useMemo(() => Math.max(0, ...withData.map((a) => a.avg_engagement_seconds ?? 0)), [withData])

  // Top 10 por score decrescente.
  const top10 = useMemo(() => {
    return withData
      .map((a) => ({ ...a, score: computeScore(a, maxViews, maxEng) ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [withData, maxViews, maxEng])

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-muted/40 p-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Flame className="h-5 w-5 text-amber-500" />
          Top 10 artigos — todos os tempos
        </h2>
        {lastSync && <p className="text-xs text-muted-foreground">Última atualização: {timeAgo(lastSync)}</p>}
      </div>

      {top10.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum artigo com dados ainda. Preencha o slug no briefing e clique em “Atualizar todos” no ranking.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Artigo</th>
                  <th className="px-3 py-2.5 font-medium">Funil</th>
                  <th className="px-3 py-2.5 font-medium">Mês publicado</th>
                  <th className="px-3 py-2.5 text-right font-medium">Visualizações</th>
                  <th className="px-3 py-2.5 text-right font-medium">Engajamento</th>
                  <th className="px-3 py-2.5 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((a, i) => {
                  const isPodium = i < 3
                  return (
                    <tr
                      key={a.id}
                      onClick={() => onNavigate(a)}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40",
                        isPodium && "bg-secondary/20",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span className={cn("text-base font-bold", isPodium ? RANK_STYLE[i] : "text-muted-foreground")}>
                          {isPodium ? MEDALS[i] : i + 1}
                        </span>
                      </td>
                      <td className="max-w-[240px] truncate px-3 py-2.5 font-medium text-foreground">
                        {a.title || `Artigo 0${a.order}`}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className={cn(FUNNEL_STYLE[a.funnel_stage] ?? "border-border")}>
                          {a.funnel_stage}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                        {MONTH_NAMES[a.month - 1]} {a.year}
                      </td>
                      <td className="px-3 py-2.5 text-right text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          {(a.views ?? 0).toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatEngagement(a.avg_engagement_seconds ?? 0)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 font-semibold text-foreground">{a.score}</span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${a.score}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
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
