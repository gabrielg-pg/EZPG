"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ExternalLink, Video, ImageIcon, Loader2, GripVertical, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createCreative,
  moveCreative,
  type Creative,
  type CreativeStatus,
} from "@/app/actions/creatives-actions"

const COLUMNS: { key: CreativeStatus; label: string; hint: string; accent: string }[] = [
  { key: "briefing", label: "Briefing", hint: "Criativo pronto para subir", accent: "bg-slate-400" },
  { key: "em_producao", label: "Em Produção", hint: "Sendo configurado no Meta", accent: "bg-blue-400" },
  { key: "no_ar", label: "No Ar", hint: "Campanha ativa", accent: "bg-cyan-400" },
  { key: "em_analise", label: "Em Análise", hint: "Aguardando dados suficientes", accent: "bg-amber-400" },
  { key: "escalando", label: "Escalando", hint: "Performance positiva, budget subindo", accent: "bg-emerald-400" },
  { key: "pausado_positivo", label: "Pausado — Positivo", hint: "Funcionou, pausado como referência", accent: "bg-primary" },
  { key: "pausado_negativo", label: "Pausado — Negativo", hint: "Não performou, motivo registrado", accent: "bg-rose-500" },
]

const PAUSE_REASONS = ["CPL alto", "CTR baixo", "Sem reunião gerada", "Criativo fraco", "Outro"]

const emptyForm = {
  name: "",
  format: "video",
  driveLink: "",
  primaryText: "",
  title: "",
  description: "",
  observation: "",
  status: "briefing" as CreativeStatus,
}

export function CreativesBoard({ initialCreatives }: { initialCreatives: Creative[] }) {
  const [creatives, setCreatives] = useState<Creative[]>(initialCreatives)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<CreativeStatus | null>(null)

  // Motivo de pausa (quando move para Pausado — Negativo)
  const [pausePrompt, setPausePrompt] = useState<{ id: number } | null>(null)
  const [pauseReason, setPauseReason] = useState<string>(PAUSE_REASONS[0])
  const dragIdRef = useRef<number | null>(null)

  const grouped = useMemo(() => {
    const map: Record<CreativeStatus, Creative[]> = {
      briefing: [],
      em_producao: [],
      no_ar: [],
      em_analise: [],
      escalando: [],
      pausado_positivo: [],
      pausado_negativo: [],
    }
    for (const c of creatives) {
      if (map[c.status]) map[c.status].push(c)
      else map.briefing.push(c)
    }
    return map
  }, [creatives])

  const resetForm = () => {
    setForm(emptyForm)
    setError(null)
  }

  const handleCreate = () => {
    setError(null)
    if (!form.name.trim()) {
      setError("Informe o nome do criativo")
      return
    }
    startTransition(async () => {
      const result = await createCreative(form)
      if (result.success && result.creative) {
        setCreatives((prev) => [...prev, result.creative as Creative])
        setIsDialogOpen(false)
        resetForm()
      } else {
        setError(result.error || "Erro ao criar criativo")
      }
    })
  }

  const applyMove = (id: number, status: CreativeStatus, reason?: string | null) => {
    setCreatives((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status, pause_reason: status === "pausado_negativo" ? reason ?? c.pause_reason : null }
          : c,
      ),
    )
    startTransition(async () => {
      await moveCreative(id, status, reason ?? null)
    })
  }

  const handleDrop = (status: CreativeStatus) => {
    const id = dragIdRef.current
    setDragOverCol(null)
    setDraggingId(null)
    dragIdRef.current = null
    if (id == null) return

    const current = creatives.find((c) => c.id === id)
    if (!current || current.status === status) return

    // Ao mover para Pausado — Negativo, pedir o motivo antes de confirmar
    if (status === "pausado_negativo") {
      setPauseReason(PAUSE_REASONS[0])
      setPausePrompt({ id })
      return
    }
    applyMove(id, status)
  }

  const confirmPause = () => {
    if (!pausePrompt) return
    applyMove(pausePrompt.id, "pausado_negativo", pauseReason)
    setPausePrompt(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Criativos</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline de ADS — acompanhe cada criativo do briefing à escala.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Criativo
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = grouped[col.key]
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverCol(col.key)
              }}
              onDragLeave={() => setDragOverCol((prev) => (prev === col.key ? null : prev))}
              onDrop={() => handleDrop(col.key)}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-2xl border bg-card/40 transition-colors",
                dragOverCol === col.key ? "border-primary/60 bg-primary/5" : "border-border/60",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.accent)} />
                  <p className="text-sm font-semibold text-foreground">{col.label}</p>
                </div>
                <Badge variant="outline" className="border-border/60 bg-muted/40 text-xs text-muted-foreground">
                  {items.length}
                </Badge>
              </div>
              <p className="px-4 pt-2 text-xs text-muted-foreground">{col.hint}</p>

              <div className="flex flex-1 flex-col gap-3 p-3">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhum criativo
                  </p>
                ) : (
                  items.map((c) => (
                    <CreativeCard
                      key={c.id}
                      creative={c}
                      isDragging={draggingId === c.id}
                      onDragStart={() => {
                        dragIdRef.current = c.id
                        setDraggingId(c.id)
                      }}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDragOverCol(null)
                        dragIdRef.current = null
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Novo Criativo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-card/95 text-foreground backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Novo Criativo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os dados do criativo para adicionar ao pipeline.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-1 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Nome do criativo</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: VSL Nicho Pet 01"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Formato</Label>
                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="imagem">Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Coluna inicial</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as CreativeStatus })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Link do criativo (Drive)</Label>
                <Input
                  value={form.driveLink}
                  onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Texto principal</Label>
              <Textarea
                value={form.primaryText}
                onChange={(e) => setForm({ ...form, primaryText: e.target.value })}
                placeholder="Primary text do anúncio"
                className="min-h-[70px] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Título do anúncio"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição do anúncio"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Observação</Label>
              <Textarea
                value={form.observation}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
                placeholder="Observações livres sobre o criativo"
                className="min-h-[60px] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Motivo da Pausa */}
      <Dialog open={pausePrompt !== null} onOpenChange={(open) => !open && setPausePrompt(null)}>
        <DialogContent className="max-w-sm bg-card/95 text-foreground backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Motivo da pausa</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Por que este criativo está sendo pausado como negativo?
            </DialogDescription>
          </DialogHeader>
          <Select value={pauseReason} onValueChange={setPauseReason}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAUSE_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPausePrompt(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmPause} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreativeCard({
  creative,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  creative: Creative
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const isVideo = creative.format === "video"
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-xl border border-border/60 bg-card/70 p-3 transition-all active:cursor-grabbing",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-foreground text-pretty">{creative.name}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[11px]",
            isVideo
              ? "border-blue-500/25 bg-blue-500/10 text-blue-400"
              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
          )}
        >
          {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {isVideo ? "Vídeo" : "Imagem"}
        </Badge>
      </div>

      {creative.drive_link && (
        <a
          href={creative.drive_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
        >
          Ver Criativo
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {(creative.primary_text || creative.title || creative.description) && (
        <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2.5">
          {creative.title && (
            <p className="text-xs text-foreground">
              <span className="text-muted-foreground">Título: </span>
              {creative.title}
            </p>
          )}
          {creative.primary_text && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{creative.primary_text}</p>
          )}
          {creative.description && (
            <p className="text-xs text-muted-foreground">
              <span className="text-muted-foreground/70">Desc: </span>
              {creative.description}
            </p>
          )}
        </div>
      )}

      {creative.observation && (
        <p className="mt-2 rounded-lg bg-muted/40 px-2 py-1.5 text-[11px] italic text-muted-foreground">
          {creative.observation}
        </p>
      )}

      {creative.status === "pausado_negativo" && creative.pause_reason && (
        <Badge
          variant="outline"
          className="mt-2 border-rose-500/25 bg-rose-500/10 text-[11px] text-rose-400"
        >
          Motivo: {creative.pause_reason}
        </Badge>
      )}
    </div>
  )
}
