"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Check,
  Upload,
  Loader2,
  ImageIcon,
  FileText,
  Eye,
  Clock,
  Plus,
  Tag,
  Download,
  Trash2,
  X,
  CheckCircle2,
  CalendarCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PIPELINE_ORDER,
  DEFAULT_REVIEW_TOPICS,
  formatEngagement,
  type BlogArticle,
  type BlogImage,
  type BlogKeyword,
  type PipelineStatus,
  type ReviewItem,
} from "@/lib/blog"

const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  briefing: "Briefing",
  writing: "Redação",
  design: "Design",
  review: "Revisão",
  published: "Publicado",
}

const KEYWORD_STATUS_STYLE: Record<BlogKeyword["status"], string> = {
  available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_use: "bg-primary/15 text-primary border-primary/30",
  published: "bg-muted text-muted-foreground border-border",
}

type Props = {
  article: BlogArticle
  keywords: BlogKeyword[]
  onPipelineChange: (id: number, status: PipelineStatus) => void
  onUpdate: (id: number, patch: Partial<BlogArticle>) => void
  onAddImages: (id: number, files: File[]) => Promise<void>
  onCreateKeyword: (text: string) => Promise<BlogKeyword | null>
  onOpenBriefing: (article: BlogArticle) => void
  onMetricsSynced: (id: number, patch: Partial<BlogArticle>) => void
  highlighted?: boolean
}

export function BlogArticleCard({
  article,
  keywords,
  onPipelineChange,
  onUpdate,
  onAddImages,
  onCreateKeyword,
  onOpenBriefing,
  onMetricsSynced,
  highlighted,
}: Props) {
  const currentIndex = PIPELINE_ORDER.indexOf(article.pipeline_status)
  const articleKeywords = keywords.filter((k) => article.keywords.includes(k.id))

  return (
    <div
      id={`article-${article.id}`}
      className={cn(
        "flex scroll-mt-24 flex-col gap-4 rounded-2xl border bg-card p-5 transition-all duration-500",
        highlighted ? "border-primary ring-2 ring-primary/40" : "border-border",
      )}
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Artigo 0{article.order} · {article.funnel_stage}
          </span>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {PIPELINE_LABELS[article.pipeline_status]}
          </Badge>
        </div>
        <h3 className="text-balance text-base font-semibold text-foreground">{article.title || "Sem título"}</h3>
        <p className="text-xs text-muted-foreground">
          {article.publish_date ? new Date(article.publish_date).toLocaleDateString("pt-BR") : "Sem data"} ·{" "}
          {article.word_count > 0 ? `${article.word_count} palavras` : "Tamanho a definir"}
        </p>
      </div>

      {/* Pipeline */}
      <div className="flex items-center gap-1">
        {PIPELINE_ORDER.map((status, idx) => {
          const done = idx < currentIndex
          const active = idx === currentIndex
          return (
            <button
              key={status}
              type="button"
              onClick={() => onPipelineChange(article.id, status)}
              title={PIPELINE_LABELS[status]}
              className={cn(
                "flex-1 rounded-lg border px-1 py-1.5 text-[10px] font-medium transition-colors",
                done && "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
                active && "border-primary/40 bg-primary/15 text-primary",
                !done && !active && "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/70",
              )}
            >
              {PIPELINE_LABELS[status]}
            </button>
          )
        })}
      </div>

      {/* Keywords */}
      <KeywordsBlock
        article={article}
        keywords={keywords}
        articleKeywords={articleKeywords}
        onUpdate={onUpdate}
        onCreateKeyword={onCreateKeyword}
      />

      {/* Painel da etapa ativa */}
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        {article.pipeline_status === "briefing" && <BriefingPanel article={article} onUpdate={onUpdate} onOpenBriefing={onOpenBriefing} />}
        {article.pipeline_status === "writing" && <WritingPanel article={article} onUpdate={onUpdate} />}
        {article.pipeline_status === "design" && <DesignPanel article={article} onUpdate={onUpdate} onAddImages={onAddImages} />}
        {article.pipeline_status === "review" && <ReviewPanel article={article} onUpdate={onUpdate} />}
        {article.pipeline_status === "published" && <PublishedPanel article={article} onPipelineChange={onPipelineChange} />}
      </div>

      {/* Footer de métricas (Google Analytics) */}
      <MetricsFooter article={article} onMetricsSynced={onMetricsSynced} />
    </div>
  )
}

/* ---------------- Métricas (GA4) ---------------- */

function timeAgo(iso: string | null): string {
  if (!iso) return "nunca sincronizado"
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "agora mesmo"
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

function MetricsFooter({
  article,
  onMetricsSynced,
}: {
  article: BlogArticle
  onMetricsSynced: (id: number, patch: Partial<BlogArticle>) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasSlug = !!article.article_slug?.trim()

  const refresh = async () => {
    if (!hasSlug) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/analytics/blog?all=true&slug=${encodeURIComponent(article.article_slug)}`,
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao carregar métricas — tente novamente")
      }
      const { results, synced_at } = await res.json()
      const row = (results as Array<{ views: number; avg_engagement_seconds: number }>)[0]
      const views = row?.views ?? 0
      const seconds = row?.avg_engagement_seconds ?? 0
      onMetricsSynced(article.id, {
        views,
        avg_engagement_seconds: seconds,
        avg_engagement: formatEngagement(seconds),
        last_synced_at: synced_at,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar métricas — tente novamente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-foreground">
            <Eye className="h-4 w-4 text-primary" />
            <span className="font-semibold">{(article.views ?? 0).toLocaleString("pt-BR")}</span>
            <span className="text-xs text-muted-foreground">views</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold">{formatEngagement(article.avg_engagement_seconds ?? 0)}</span>
            <span className="text-xs text-muted-foreground">médio</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={refresh}
          disabled={loading || !hasSlug}
          className="h-8 gap-1.5 px-2 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Atualizar métricas
        </Button>
      </div>
      {!hasSlug && (
        <p className="flex items-center gap-1.5 text-xs text-amber-500">
          <AlertCircle className="h-3.5 w-3.5" />
          Slug não definido — adicione no briefing
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      {hasSlug && !error && (
        <p className="text-[10px] text-muted-foreground">Última atualização: {timeAgo(article.last_synced_at)}</p>
      )}
    </div>
  )
}

/* ---------------- Keywords ---------------- */

function KeywordsBlock({
  article,
  keywords,
  articleKeywords,
  onUpdate,
  onCreateKeyword,
}: {
  article: BlogArticle
  keywords: BlogKeyword[]
  articleKeywords: BlogKeyword[]
  onUpdate: (id: number, patch: Partial<BlogArticle>) => void
  onCreateKeyword: (text: string) => Promise<BlogKeyword | null>
}) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)

  const toggleKeyword = (id: number) => {
    const next = article.keywords.includes(id)
      ? article.keywords.filter((k) => k !== id)
      : [...article.keywords, id]
    onUpdate(article.id, { keywords: next })
  }

  const handleCreate = async () => {
    const value = text.trim()
    if (!value) return
    setSaving(true)
    try {
      const created = await onCreateKeyword(value)
      if (created) onUpdate(article.id, { keywords: [...article.keywords, created.id] })
      setText("")
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Tag className="h-3.5 w-3.5" /> Palavras-chave
        </span>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:bg-secondary">
                <Tag className="h-3.5 w-3.5" /> Associar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 rounded-xl border-border bg-popover p-2" align="end">
              <p className="px-2 pb-1 pt-1 text-xs font-medium text-muted-foreground">Banco de palavras-chave</p>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {keywords.length === 0 && (
                  <p className="px-2 py-3 text-xs text-muted-foreground">Nenhuma keyword cadastrada.</p>
                )}
                {keywords.map((k) => {
                  const selected = article.keywords.includes(k.id)
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => toggleKeyword(k.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                        selected ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary/60",
                      )}
                    >
                      <span className="truncate">{k.keyword}</span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding((v) => !v)}
            className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </div>

      {adding && (
        <div className="flex items-center gap-1.5">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) handleCreate()
              if (e.key === "Escape") setAdding(false)
            }}
            placeholder="Nova palavra-chave para este artigo"
            autoFocus
            className="h-8 rounded-lg border-input bg-secondary/50 text-sm"
          />
          <Button size="icon" onClick={handleCreate} disabled={saving} className="h-8 w-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setAdding(false)} className="h-8 w-8 shrink-0 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {articleKeywords.length === 0 && <span className="text-xs text-muted-foreground/70">Nenhuma associada</span>}
        {articleKeywords.map((k) => (
          <Badge key={k.id} variant="outline" className={cn("gap-1", KEYWORD_STATUS_STYLE[k.status])}>
            {k.keyword}
            <button
              type="button"
              onClick={() => toggleKeyword(k.id)}
              className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
              aria-label={`Remover ${k.keyword}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Briefing ---------------- */

function BriefingPanel({
  article,
  onUpdate,
  onOpenBriefing,
}: {
  article: BlogArticle
  onUpdate: (id: number, patch: Partial<BlogArticle>) => void
  onOpenBriefing: (article: BlogArticle) => void
}) {
  const [cta, setCta] = useState(article.cta)
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">CTA principal</label>
        <Input
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          onBlur={() => cta !== article.cta && onUpdate(article.id, { cta })}
          placeholder="Ex: Quiz de diagnóstico"
          className="h-9 rounded-lg border-input bg-secondary/50 text-sm"
        />
      </div>
      <dl className="space-y-1.5 text-xs">
        <div>
          <dt className="font-medium text-muted-foreground">Objetivo</dt>
          <dd className="text-foreground">{article.objective || "A definir no briefing"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Ângulo / contexto</dt>
          <dd className="text-foreground">{article.context || "A definir no briefing"}</dd>
        </div>
      </dl>
      <Button
        variant="outline"
        onClick={() => onOpenBriefing(article)}
        className="w-full gap-2 rounded-lg border-border text-foreground hover:bg-secondary"
      >
        <FileText className="h-4 w-4" />
        Abrir briefing completo
      </Button>
    </div>
  )
}

/* ---------------- Redação ---------------- */

function WritingPanel({
  article,
  onUpdate,
}: {
  article: BlogArticle
  onUpdate: (id: number, patch: Partial<BlogArticle>) => void
}) {
  const [content, setContent] = useState(article.content)
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Redação do artigo
        </label>
        <span className="text-[10px] text-muted-foreground">{wordCount} palavras</span>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => content !== article.content && onUpdate(article.id, { content })}
        placeholder="Escreva aqui todo o conteúdo do artigo — título, introdução, intertítulos, desenvolvimento e conclusão. O texto é salvo automaticamente ao clicar fora."
        className="min-h-[320px] resize-y rounded-lg border-input bg-secondary/40 text-sm leading-relaxed"
      />
      <p className="text-[10px] text-muted-foreground">Salvo automaticamente ao clicar fora do campo.</p>
    </div>
  )
}

/* ---------------- Design ---------------- */

function DesignPanel({
  article,
  onUpdate,
  onAddImages,
}: {
  article: BlogArticle
  onUpdate: (id: number, patch: Partial<BlogArticle>) => void
  onAddImages: (id: number, files: File[]) => Promise<void>
}) {
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const images = article.images ?? []

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      await onAddImages(article.id, Array.from(files))
    } finally {
      setUploading(false)
    }
  }

  const downloadOne = async (img: BlogImage) => {
    const res = await fetch(img.url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = img.filename || "imagem"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadAll = async () => {
    setDownloading(true)
    try {
      for (const img of images) {
        await downloadOne(img)
        await new Promise((r) => setTimeout(r, 350))
      }
    } finally {
      setDownloading(false)
    }
  }

  const removeImage = (index: number) => {
    onUpdate(article.id, { images: images.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" /> Imagens ({images.length})
        </span>
        {images.length > 0 && (
          <Button
            size="sm"
            onClick={downloadAll}
            disabled={downloading}
            className="h-7 gap-1 rounded-lg bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Baixar todas
          </Button>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div key={`${img.url}-${i}`} className="group relative overflow-hidden rounded-lg border border-border">
              <Image
                src={img.url || "/placeholder.svg"}
                alt={img.filename || `Imagem ${i + 1}`}
                width={300}
                height={160}
                className="h-24 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="secondary" onClick={() => downloadOne(img)} className="h-8 w-8 rounded-full" title="Baixar">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => removeImage(i)} className="h-8 w-8 rounded-full text-destructive" title="Remover">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <span className="absolute inset-x-0 bottom-0 truncate bg-background/85 px-2 py-1 text-[10px] text-foreground">
                {img.filename}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
        className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">Enviando...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span className="text-xs">Enviar imagens (várias de uma vez)</span>
            <span className="text-[10px] text-muted-foreground/70">JPG, PNG ou WebP · máx. 5MB cada</span>
          </>
        )}
      </button>
    </div>
  )
}

/* ---------------- Revisão ---------------- */

function ReviewPanel({
  article,
  onUpdate,
}: {
  article: BlogArticle
  onUpdate: (id: number, patch: Partial<BlogArticle>) => void
}) {
  // Usa o checklist salvo; se vazio, parte dos tópicos padrão.
  const initial: ReviewItem[] =
    article.review && article.review.length > 0
      ? article.review
      : DEFAULT_REVIEW_TOPICS.map((label) => ({ label, done: false }))
  const [items, setItems] = useState<ReviewItem[]>(initial)

  const toggle = (index: number) => {
    const next = items.map((it, i) => (i === index ? { ...it, done: !it.done } : it))
    setItems(next)
    onUpdate(article.id, { review: next })
  }

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" /> Tópicos para revisar
        </span>
        <span className="text-[10px] text-muted-foreground">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                item.done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/70",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  item.done ? "border-emerald-500 bg-emerald-500 text-background" : "border-muted-foreground/40",
                )}
              >
                {item.done && <Check className="h-3 w-3" />}
              </span>
              <span className={cn(item.done && "line-through")}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------- Publicado ---------------- */

function PublishedPanel({
  article,
  onPipelineChange,
}: {
  article: BlogArticle
  onPipelineChange: (id: number, status: PipelineStatus) => void
}) {
  return (
    <div className="space-y-3">
      {article.publish_date ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3">
          <CalendarCheck className="h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">Publicado</p>
            <p className="text-xs text-muted-foreground">
              {new Date(article.publish_date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => onPipelineChange(article.id, "published")}
          className="w-full gap-2 rounded-lg bg-green-600 text-white hover:bg-green-600/90"
        >
          <CalendarCheck className="h-4 w-4" />
          Publicar agora (registra a data de hoje)
        </Button>
      )}
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        As visualizações e o tempo médio são puxados do Google Analytics no rodapé do card.
      </p>
    </div>
  )
}
