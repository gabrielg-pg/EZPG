"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  FileText,
  Plus,
  Database,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  TrendingUp,
  Award,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BlogArticleCard } from "@/components/blog-article-card"
import { BlogBriefingDrawer } from "@/components/blog-briefing-drawer"
import { BlogRanking } from "@/components/blog-ranking"
import {
  addKeyword,
  updateKeyword,
  deleteKeyword,
  createMonthArticles,
  updateArticle,
  setArticlePipeline,
  getBlogData,
  monthHasArticles,
} from "@/app/actions/blog-actions"
import type { BlogArticle, BlogKeyword, PipelineStatus } from "@/lib/blog"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const KEYWORD_STATES = [
  { key: "available", label: "Disponível", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { key: "in_use", label: "Em uso", style: "bg-primary/15 text-primary border-primary/30" },
  { key: "published", label: "Publicada", style: "bg-muted text-muted-foreground border-border" },
] as const

type Props = {
  initialKeywords: BlogKeyword[]
  initialArticles: BlogArticle[]
  year: number
  roles: string[]
}

export function BlogPanel({ initialKeywords, initialArticles, year, roles }: Props) {
  const [keywords, setKeywords] = useState<BlogKeyword[]>(initialKeywords)
  const [articles, setArticles] = useState<BlogArticle[]>(initialArticles)
  const [activeMonth, setActiveMonth] = useState<number>(() => {
    const now = new Date().getMonth() + 1
    return initialArticles.some((a) => a.month === now) ? now : (initialArticles[0]?.month ?? now)
  })
  const [isPending, startTransition] = useTransition()

  // Keyword bank UI
  const [newKeyword, setNewKeyword] = useState("")
  const [editingKw, setEditingKw] = useState<number | null>(null)
  const [editKwText, setEditKwText] = useState("")

  // Drawer
  const [drawerArticle, setDrawerArticle] = useState<BlogArticle | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Destaque temporário ao navegar do ranking para um card
  const [highlightedId, setHighlightedId] = useState<number | null>(null)

  // Novo mês
  const [monthModalOpen, setMonthModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [monthConfirm, setMonthConfirm] = useState<number | null>(null)
  const [creatingMonth, setCreatingMonth] = useState(false)

  const monthsWithData = useMemo(() => new Set(articles.map((a) => a.month)), [articles])
  const monthArticles = useMemo(
    () => articles.filter((a) => a.month === activeMonth).sort((a, b) => a.order - b.order),
    [articles, activeMonth],
  )

  // Métricas
  const publishedCount = articles.filter((a) => a.pipeline_status === "published").length
  const inProductionCount = monthArticles.filter((a) => a.pipeline_status !== "published").length
  const monthViews = monthArticles.reduce((sum, a) => sum + (a.views || 0), 0)
  const bestArticle = monthArticles.reduce<BlogArticle | null>(
    (best, a) => (!best || a.views > best.views ? a : best),
    null,
  )

  // Recarrega tudo (para refletir os status recalculados das keywords).
  const refresh = async () => {
    const data = await getBlogData(year)
    setKeywords(data.keywords)
    setArticles(data.articles)
  }

  // Atualiza apenas o estado local após sincronizar métricas de um card (o banco já foi
  // atualizado pela API route, evitando uma nova gravação).
  const handleMetricsSynced = (id: number, patch: Partial<BlogArticle>) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  // "Atualizar todos" do ranking: chama a API (que grava no banco) e recarrega os dados.
  const handleRefreshAll = async (month?: number, yr?: number) => {
    const query = month && yr ? `?month=${month}&year=${yr}` : "?all=true"
    const res = await fetch(`/api/analytics/blog${query}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error || "Erro ao atualizar métricas.")
      return
    }
    await refresh()
  }

  // Navega do ranking para o card do artigo: troca o mês, faz scroll e destaca.
  const handleNavigate = (article: BlogArticle) => {
    setActiveMonth(article.month)
    setHighlightedId(article.id)
    setTimeout(() => {
      document.getElementById(`article-${article.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 80)
    setTimeout(() => setHighlightedId(null), 2500)
  }

  // ---------- Keywords ----------
  const handleAddKeyword = () => {
    const text = newKeyword.trim()
    if (!text) return
    startTransition(async () => {
      const created = await addKeyword(text)
      setKeywords((prev) => [...prev, created])
      setNewKeyword("")
    })
  }

  const handleUpdateKeyword = (id: number) => {
    const text = editKwText.trim()
    if (!text) return
    startTransition(async () => {
      await updateKeyword(id, text)
      setKeywords((prev) => prev.map((k) => (k.id === id ? { ...k, keyword: text } : k)))
      setEditingKw(null)
      setEditKwText("")
    })
  }

  const handleDeleteKeyword = (id: number) => {
    startTransition(async () => {
      await deleteKeyword(id)
      setKeywords((prev) => prev.filter((k) => k.id !== id))
      setArticles((prev) => prev.map((a) => ({ ...a, keywords: a.keywords.filter((k) => k !== id) })))
    })
  }

  // ---------- Artigos ----------
  const handlePipelineChange = (id: number, status: PipelineStatus) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, pipeline_status: status } : a)))
    startTransition(async () => {
      await setArticlePipeline(id, status)
      await refresh()
    })
  }

  const handleUpdateArticle = (id: number, patch: Partial<BlogArticle>) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    startTransition(async () => {
      await updateArticle(id, patch)
      if (patch.keywords !== undefined) await refresh()
    })
  }

  const handleSaveBriefing = async (id: number, patch: Partial<BlogArticle>) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    await updateArticle(id, patch)
    if (patch.keywords !== undefined) await refresh()
  }

  const handleAddImages = async (id: number, files: File[]) => {
    const uploaded: { url: string; filename: string }[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/blog/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || `Falha no upload de ${file.name}`)
        continue
      }
      const { url, filename } = await res.json()
      uploaded.push({ url, filename })
    }
    if (uploaded.length === 0) return
    const current = articles.find((a) => a.id === id)
    const nextImages = [...(current?.images ?? []), ...uploaded]
    handleUpdateArticle(id, { images: nextImages })
  }

  const handleCreateKeyword = async (text: string): Promise<BlogKeyword | null> => {
    const value = text.trim()
    if (!value) return null
    const created = await addKeyword(value)
    setKeywords((prev) => (prev.some((k) => k.id === created.id) ? prev : [...prev, created]))
    return created
  }

  const openBriefing = (article: BlogArticle) => {
    setDrawerArticle(article)
    setDrawerOpen(true)
  }

  // ---------- Novo mês ----------
  const doCreateMonth = (month: number) => {
    setCreatingMonth(true)
    startTransition(async () => {
      const created = await createMonthArticles(month, year)
      setArticles((prev) => {
        const others = prev.filter((a) => a.month !== month)
        return [...others, ...created]
      })
      setActiveMonth(month)
      setCreatingMonth(false)
      setMonthModalOpen(false)
      setMonthConfirm(null)
    })
  }

  const handleCreateMonthClick = () => {
    const month = Number(selectedMonth)
    startTransition(async () => {
      const count = await monthHasArticles(month, year)
      if (count > 0) {
        setMonthConfirm(month)
      } else {
        doCreateMonth(month)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blog</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                Redator + Designer
              </Badge>
              <span className="text-xs text-muted-foreground">{year}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setMonthModalOpen(true)}
          className="gap-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo mês
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Artigos publicados" value={String(publishedCount)} icon={Check} />
        <MetricCard label="Em produção" value={String(inProductionCount)} icon={TrendingUp} />
        <MetricCard label="Visualizações (mês)" value={monthViews.toLocaleString("pt-BR")} icon={TrendingUp} />
        <MetricCard
          label="Melhor artigo"
          value={bestArticle && bestArticle.views > 0 ? bestArticle.title || `Artigo 0${bestArticle.order}` : "—"}
          icon={Award}
          small
        />
      </div>

      {/* Banco de palavras-chave */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Database className="h-5 w-5 text-primary" />
            Banco de palavras-chave
          </h2>
          <div className="flex items-center gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAddKeyword()
              }}
              placeholder="Nova palavra-chave"
              className="h-9 w-48 rounded-lg border-input bg-secondary/50 text-sm"
            />
            <Button onClick={handleAddKeyword} disabled={isPending} size="sm" className="gap-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma palavra-chave cadastrada.</p>}
          {keywords.map((k) => {
            const style = KEYWORD_STATES.find((s) => s.key === k.status)?.style ?? ""
            if (editingKw === k.id) {
              return (
                <div key={k.id} className="flex items-center gap-1">
                  <Input
                    value={editKwText}
                    onChange={(e) => setEditKwText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) handleUpdateKeyword(k.id)
                    }}
                    className="h-8 w-40 rounded-lg border-input bg-secondary/50 text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleUpdateKeyword(k.id)} className="h-8 w-8 text-emerald-400">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingKw(null)} className="h-8 w-8 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
            return (
              <Popover key={k.id}>
                <PopoverTrigger asChild>
                  <button type="button">
                    <Badge variant="outline" className={cn("cursor-pointer gap-1 py-1", style)}>
                      {k.keyword}
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 rounded-xl border-border bg-popover p-1" align="start">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKw(k.id)
                      setEditKwText(k.keyword)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-secondary/60"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteKeyword(k.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                </PopoverContent>
              </Popover>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
          {KEYWORD_STATES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full border", s.style)} />
              {s.label}
            </span>
          ))}
        </div>
      </section>

      {/* Ranking de performance */}
      <BlogRanking articles={articles} onRefreshAll={handleRefreshAll} onNavigate={handleNavigate} year={year} />

      {/* Abas de meses */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((label, idx) => {
          const month = idx + 1
          const hasData = monthsWithData.has(month)
          const active = activeMonth === month
          return (
            <button
              key={month}
              type="button"
              onClick={() => setActiveMonth(month)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : hasData
                    ? "border-primary/40 bg-primary/5 text-foreground hover:bg-primary/10"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/70",
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Grid de artigos */}
      {monthArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum artigo em {MONTHS[activeMonth - 1]}. Use “Novo mês” para criar o planejamento.
          </p>
          <Button onClick={() => setMonthModalOpen(true)} variant="outline" className="gap-2 rounded-xl border-border">
            <Plus className="h-4 w-4" /> Criar artigos
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {monthArticles.map((article) => (
            <BlogArticleCard
              key={article.id}
              article={article}
              keywords={keywords}
              onPipelineChange={handlePipelineChange}
              onUpdate={handleUpdateArticle}
              onAddImages={handleAddImages}
              onCreateKeyword={handleCreateKeyword}
              onOpenBriefing={openBriefing}
              onMetricsSynced={handleMetricsSynced}
              highlighted={highlightedId === article.id}
            />
          ))}
        </div>
      )}

      {/* Drawer de briefing */}
      <BlogBriefingDrawer
        article={drawerArticle}
        keywords={keywords}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveBriefing}
      />

      {/* Modal Novo mês */}
      <Dialog open={monthModalOpen} onOpenChange={setMonthModalOpen}>
        <DialogContent className="rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              Novo mês
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cria automaticamente 4 artigos (Artigo 01 a 04) no status Briefing para o mês escolhido.
            </DialogDescription>
          </DialogHeader>

          {monthConfirm !== null ? (
            <div className="space-y-4 py-2">
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground">
                Este mês ({MONTHS[monthConfirm - 1]}) já tem artigos. Adicionar mais artigos (até completar 4)?
              </p>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setMonthConfirm(null)} className="rounded-xl border-border">
                  Cancelar
                </Button>
                <Button
                  onClick={() => doCreateMonth(monthConfirm)}
                  disabled={creatingMonth}
                  className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {creatingMonth ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Adicionar artigos
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="rounded-lg border-input bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {MONTHS.map((label, idx) => (
                      <SelectItem key={idx} value={String(idx + 1)} className="rounded-lg">
                        {label} · {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setMonthModalOpen(false)} className="rounded-xl border-border">
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateMonthClick}
                  disabled={isPending || creatingMonth}
                  className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {creatingMonth ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar mês
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  small,
}: {
  label: string
  value: string
  icon: React.ElementType
  small?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className={cn("mt-2 font-bold text-foreground", small ? "truncate text-base" : "text-3xl")}>{value}</p>
    </div>
  )
}
