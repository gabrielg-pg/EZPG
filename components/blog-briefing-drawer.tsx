"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlogArticle, BlogKeyword } from "@/app/actions/blog-actions"

const FUNNEL_OPTIONS = ["Topo", "Meio", "Fundo"]

type Props = {
  article: BlogArticle | null
  keywords: BlogKeyword[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: number, patch: Partial<BlogArticle>) => Promise<void>
}

export function BlogBriefingDrawer({ article, keywords, open, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState<BlogArticle | null>(article)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(article)
  }, [article])

  if (!draft) return null

  const set = <K extends keyof BlogArticle>(key: K, value: BlogArticle[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))

  const updateStructure = (idx: number, value: string) =>
    set("structure", draft.structure.map((s, i) => (i === idx ? value : s)))
  const addStructure = () => set("structure", [...draft.structure, ""])
  const removeStructure = (idx: number) => set("structure", draft.structure.filter((_, i) => i !== idx))

  const toggleKeyword = (id: number) =>
    set("keywords", draft.keywords.includes(id) ? draft.keywords.filter((k) => k !== id) : [...draft.keywords, id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(draft.id, {
        funnel_stage: draft.funnel_stage,
        title: draft.title,
        publish_date: draft.publish_date,
        word_count: draft.word_count,
        cta: draft.cta,
        objective: draft.objective,
        context: draft.context,
        structure: draft.structure.filter((s) => s.trim() !== ""),
        tone: draft.tone,
        keywords: draft.keywords,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Artigo 0{draft.order} · Briefing
          </span>
          <SheetTitle className="text-balance text-foreground">{draft.title || "Sem título"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label className="text-foreground">Título do artigo</Label>
            <Input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className="rounded-lg border-input bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Data de publicação</Label>
              <Input
                type="date"
                value={draft.publish_date ?? ""}
                onChange={(e) => set("publish_date", e.target.value)}
                className="rounded-lg border-input bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Tamanho estimado (palavras)</Label>
              <Input
                value={String(draft.word_count)}
                onChange={(e) => set("word_count", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                className="rounded-lg border-input bg-secondary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Etapa do funil</Label>
              <Select value={draft.funnel_stage} onValueChange={(v) => set("funnel_stage", v)}>
                <SelectTrigger className="rounded-lg border-input bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  {FUNNEL_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f} className="rounded-lg">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">CTA principal</Label>
              <Input
                value={draft.cta}
                onChange={(e) => set("cta", e.target.value)}
                className="rounded-lg border-input bg-secondary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Objetivo</Label>
            <Textarea
              value={draft.objective}
              onChange={(e) => set("objective", e.target.value)}
              rows={3}
              className="rounded-lg border-input bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Contexto e ângulo editorial</Label>
            <Textarea
              value={draft.context}
              onChange={(e) => set("context", e.target.value)}
              rows={4}
              className="rounded-lg border-input bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Estrutura sugerida</Label>
              <Button variant="ghost" size="sm" onClick={addStructure} className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {draft.structure.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum item. Clique em Adicionar.</p>
              )}
              {draft.structure.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                  <Input
                    value={item}
                    onChange={(e) => updateStructure(idx, e.target.value)}
                    className="h-9 rounded-lg border-input bg-secondary/50 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStructure(idx)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Tom e linguagem</Label>
            <Input
              value={draft.tone}
              onChange={(e) => set("tone", e.target.value)}
              placeholder="Ex: Consultivo e direto"
              className="rounded-lg border-input bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Palavras-chave</Label>
            <div className="flex flex-wrap gap-1.5">
              {keywords.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma keyword cadastrada.</span>}
              {keywords.map((k) => {
                const selected = draft.keywords.includes(k.id)
                return (
                  <button key={k.id} type="button" onClick={() => toggleKeyword(k.id)}>
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-colors",
                        selected
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary/70",
                      )}
                    >
                      {k.keyword}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
