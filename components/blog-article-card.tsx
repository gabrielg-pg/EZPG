"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Upload, Loader2, ImageIcon, RefreshCw, FileText, Eye, Clock, Plus, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { PIPELINE_ORDER, type BlogArticle, type BlogKeyword, type PipelineStatus } from "@/lib/blog"

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
  onUploadImage: (id: number, file: File) => Promise<void>
  onOpenBriefing: (article: BlogArticle) => void
}

export function BlogArticleCard({ article, keywords, onPipelineChange, onUpdate, onUploadImage, onOpenBriefing }: Props) {
  const [uploading, setUploading] = useState(false)
  const [cta, setCta] = useState(article.cta)
  const [views, setViews] = useState(String(article.views ?? 0))
  const [engagement, setEngagement] = useState(article.avg_engagement)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentIndex = PIPELINE_ORDER.indexOf(article.pipeline_status)
  const articleKeywords = keywords.filter((k) => article.keywords.includes(k.id))

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      await onUploadImage(article.id, file)
    } finally {
      setUploading(false)
    }
  }

  const toggleKeyword = (id: number) => {
    const next = article.keywords.includes(id)
      ? article.keywords.filter((k) => k !== id)
      : [...article.keywords, id]
    onUpdate(article.id, { keywords: next })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Tag className="h-3.5 w-3.5" /> Palavras-chave
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10">
                <Plus className="h-3.5 w-3.5" /> Associar
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
        </div>
        <div className="flex flex-wrap gap-1.5">
          {articleKeywords.length === 0 && <span className="text-xs text-muted-foreground/70">Nenhuma associada</span>}
          {articleKeywords.map((k) => (
            <Badge key={k.id} variant="outline" className={cn("gap-1", KEYWORD_STATUS_STYLE[k.status])}>
              {k.keyword}
            </Badge>
          ))}
        </div>
      </div>

      {/* CTA */}
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

      {/* Upload de imagem */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {article.image_url ? (
        <div className="group relative overflow-hidden rounded-xl border border-border">
          <Image
            src={article.image_url || "/placeholder.svg"}
            alt={article.image_filename || "Imagem do artigo"}
            width={400}
            height={200}
            className="h-32 w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
            <span className="flex items-center gap-1.5 truncate text-xs text-foreground">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {article.image_filename}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="h-7 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Substituir
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFile(e.dataTransfer.files?.[0])
          }}
          className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">Enviando...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                <Upload className="h-4 w-4" />
              </div>
              <span className="text-xs">Aguardando designer</span>
              <span className="text-[10px] text-muted-foreground/70">JPG, PNG ou WebP · máx. 5MB</span>
            </>
          )}
        </button>
      )}

      {/* Footer: métricas + briefing */}
      <div className="mt-auto space-y-3 border-t border-border pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
              <Eye className="h-3 w-3" /> Visualizações
            </label>
            <Input
              value={views}
              onChange={(e) => setViews(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => Number(views) !== article.views && onUpdate(article.id, { views: Number(views) || 0 })}
              className="h-8 rounded-lg border-input bg-secondary/50 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
              <Clock className="h-3 w-3" /> Tempo médio
            </label>
            <Input
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              onBlur={() => engagement !== article.avg_engagement && onUpdate(article.id, { avg_engagement: engagement })}
              placeholder="Ex: 2m 30s"
              className="h-8 rounded-lg border-input bg-secondary/50 text-sm"
            />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => onOpenBriefing(article)}
          className="w-full gap-2 rounded-lg border-border text-foreground hover:bg-secondary"
        >
          <FileText className="h-4 w-4" />
          Ver briefing
        </Button>
      </div>
    </div>
  )
}
