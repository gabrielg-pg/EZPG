"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Copy,
  CalendarClock,
  Trash2,
  Share2,
  Clock,
  AlertTriangle,
  Loader2,
  FolderOpen,
  ExternalLink,
} from "lucide-react"
import {
  MONTHS_SHORT,
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  WEEKDAYS_LONG,
  STATUS_META,
  buildMonthGrid,
  toDateKey,
  isLate,
  type NexusContent,
  type NexusCredential,
  type NexusStatus,
} from "@/lib/nexus"
import { NexusContentDialog, type ContentFormValue } from "@/components/nexus-content-dialog"
import { NexusContentDetail } from "@/components/nexus-content-detail"
import { NexusCredentialsSection } from "@/components/nexus-credentials-section"
import {
  getNexusContents,
  createNexusContent,
  updateNexusContent,
  updateNexusStatus,
  moveNexusContent,
  duplicateNexusContent,
  deleteNexusContent,
  sendNexusForApproval,
  approveNexusContent,
  requestNexusChanges,
  getNexusCredentials,
} from "@/app/actions/nexus-actions"

export function NexusGrowthPanel({
  initialYear,
  initialMonth, // 1-12
  initialContents,
  initialCredentials,
  isAdmin,
}: {
  initialYear: number
  initialMonth: number
  initialContents: NexusContent[]
  initialCredentials: NexusCredential[]
  isAdmin: boolean
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth) // 1-12
  const [contents, setContents] = useState<NexusContent[]>(initialContents)
  const [credentials, setCredentials] = useState<NexusCredential[]>(initialCredentials)
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [search, setSearch] = useState("")

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState<string>(toDateKey(new Date()))
  const [editing, setEditing] = useState<NexusContent | null>(null)
  const [detail, setDetail] = useState<NexusContent | null>(null)
  const [moveTarget, setMoveTarget] = useState<NexusContent | null>(null)
  const [moveDate, setMoveDate] = useState("")

  // Drag & drop
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const todayKey = toDateKey(new Date())

  async function reloadContents(y = year, m = month) {
    setLoading(true)
    const res = await getNexusContents(y, m)
    setLoading(false)
    if (res.ok) setContents(res.contents)
  }
  async function reloadCredentials() {
    const res = await getNexusCredentials()
    if (res.ok) setCredentials(res.credentials)
  }

  const changeMonth = (m: number) => {
    setMonth(m)
    reloadContents(year, m)
  }
  const changeYear = (delta: number) => {
    const y = year + delta
    setYear(y)
    reloadContents(y, month)
  }

  // Conteúdos filtrados
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contents.filter((c) => {
      if (statusFilter !== "todos" && c.status !== statusFilter) return false
      if (q && !c.title.toLowerCase().includes(q) && !c.caption.toLowerCase().includes(q)) return false
      return true
    })
  }, [contents, statusFilter, search])

  const byDate = useMemo(() => {
    const map = new Map<string, NexusContent[]>()
    for (const c of filtered) {
      if (!map.has(c.date)) map.set(c.date, [])
      map.get(c.date)!.push(c)
    }
    return map
  }, [filtered])

  // Indicadores (mês inteiro, sem filtro)
  const stats = useMemo(() => {
    const total = contents.length
    const emProducao = contents.filter((c) => c.status === "em_producao").length
    const aguardando = contents.filter((c) => c.status === "aguardando_aprovacao").length
    const publicados = contents.filter((c) => c.status === "publicado").length
    return { total, emProducao, aguardando, publicados }
  }, [contents])

  const grid = useMemo(() => buildMonthGrid(year, month - 1), [year, month])

  // ---- Handlers de conteúdo ----
  const openCreate = (dateKey: string) => {
    setEditing(null)
    setDialogDate(dateKey)
    setDialogOpen(true)
  }
  const openEdit = (c: NexusContent) => {
    setEditing(c)
    setDialogDate(c.date)
    setDialogOpen(true)
    setDetail(null)
  }

  const handleSubmit = async (value: ContentFormValue) => {
    if (editing) {
      await updateNexusContent(editing.id, value)
    } else {
      await createNexusContent(value)
    }
    await reloadContents()
  }

  const runAndReload = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn()
      await reloadContents()
    })
  }

  const handleDrop = (dateKey: string) => {
    if (draggingId == null) return
    const dragged = contents.find((c) => c.id === draggingId)
    setDraggingId(null)
    setDragOverKey(null)
    if (!dragged || dragged.date === dateKey) return
    runAndReload(() => moveNexusContent(dragged.id, dateKey))
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Cabeçalho */}
      <header className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/25">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Nexus Growth</h1>
              <p className="text-pretty text-sm text-muted-foreground">
                Planejamento e execução das redes sociais da Pro Growth Global
              </p>
            </div>
          </div>

          {/* Seletor de ano */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeYear(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-lg font-semibold text-foreground">{year}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => changeYear(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Planejados" value={stats.total} tone="primary" />
          <StatCard label="Em produção" value={stats.emProducao} tone="orange" />
          <StatCard label="Aguardando aprovação" value={stats.aguardando} tone="yellow" />
          <StatCard label="Publicados" value={stats.publicados} tone="emerald" />
        </div>
      </header>

      {/* Seletor de meses */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MONTHS_SHORT.map((m, i) => {
          const active = month === i + 1
          return (
            <button
              key={m}
              type="button"
              onClick={() => changeMonth(i + 1)}
              className={cn(
                "min-w-14 shrink-0 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Resumo do mês */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-lg font-bold text-foreground">
            {MONTHS_LONG[month - 1]} {year}
          </p>
          <p className="text-sm text-muted-foreground">
            {contents.length} {contents.length === 1 ? "conteúdo planejado" : "conteúdos planejados"}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {(Object.keys(STATUS_META) as NexusStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conteúdo"
            className="pl-9"
          />
        </div>
      </div>

      {/* Calendário */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Planejamento de Conteúdo</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[1000px]">
            {/* Cabeçalho dos dias */}
            <div className="mb-2 grid grid-cols-7 gap-3">
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Grade */}
            <div className="grid grid-cols-7 gap-3">
              {grid.map((date, idx) => {
                if (!date) return <div key={`blank-${idx}`} className="min-h-44 rounded-xl border border-dashed border-border/40" />
                const key = toDateKey(date)
                const dayContents = byDate.get(key) ?? []
                const isToday = key === todayKey
                const isOver = dragOverKey === key
                return (
                  <div
                    key={key}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (dragOverKey !== key) setDragOverKey(key)
                    }}
                    onDragLeave={() => dragOverKey === key && setDragOverKey(null)}
                    onDrop={() => handleDrop(key)}
                    className={cn(
                      "flex min-h-44 flex-col rounded-xl border bg-card p-3 transition-colors",
                      isToday ? "border-primary shadow-lg shadow-primary/10" : "border-border",
                      isOver && "border-primary bg-primary/5 ring-2 ring-primary/40",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className={cn("text-lg font-bold", isToday ? "text-primary" : "text-foreground")}>
                          {date.getDate()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {WEEKDAYS_LONG[(date.getDay() + 6) % 7].split("-")[0]}
                        </span>
                      </div>
                      {isToday && (
                        <Badge className="bg-primary text-white hover:bg-primary">Hoje</Badge>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2">
                      {dayContents.map((c) => (
                        <ContentCard
                          key={c.id}
                          content={c}
                          onOpen={() => setDetail(c)}
                          onEdit={() => openEdit(c)}
                          onDuplicate={() => runAndReload(() => duplicateNexusContent(c.id))}
                          onMove={() => {
                            setMoveTarget(c)
                            setMoveDate(c.date)
                          }}
                          onDelete={() => runAndReload(() => deleteNexusContent(c.id))}
                          onDragStart={() => setDraggingId(c.id)}
                          onDragEnd={() => {
                            setDraggingId(null)
                            setDragOverKey(null)
                          }}
                          dragging={draggingId === c.id}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => openCreate(key)}
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar conteúdo
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Acessos */}
      <NexusCredentialsSection
        credentials={credentials}
        isAdmin={isAdmin}
        onChanged={reloadCredentials}
      />

      {/* Drive Nexus Growth */}
      <a
        href="https://drive.google.com/drive/folders/1kUbUH1dLYpx1QLlpfHDxs4Z7Ozblp84I?hl=pt-br"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/25">
          <FolderOpen className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Drive Nexus Growth</p>
          <p className="truncate text-sm text-muted-foreground">
            Arquivos e materiais das redes sociais da Pro Growth Global
          </p>
        </div>
        <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </a>

      {/* Material Branding Lojas */}
      <a
        href="https://drive.google.com/drive/folders/1kGIjMsoghV-J6UbFnO_rKnm7Hoki-86n"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/25">
          <FolderOpen className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Material Branding Lojas</p>
          <p className="truncate text-sm text-muted-foreground">
            Identidade visual e materiais de branding das lojas
          </p>
        </div>
        <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </a>

      {/* Dialogs */}
      <NexusContentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={dialogDate}
        editing={editing}
        onSubmit={handleSubmit}
      />

      <NexusContentDetail
        content={detail}
        isAdmin={isAdmin}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onStatusChange={(id, status) => {
          setDetail((d) => (d ? { ...d, status } : d))
          runAndReload(() => updateNexusStatus(id, status))
        }}
        onSendForApproval={(id) => {
          setDetail(null)
          runAndReload(() => sendNexusForApproval(id))
        }}
        onApprove={(id) => {
          setDetail(null)
          runAndReload(() => approveNexusContent(id))
        }}
        onRequestChanges={(id, note) => {
          setDetail(null)
          runAndReload(() => requestNexusChanges(id, note))
        }}
      />

      {/* Mover para outro dia */}
      <Dialog open={!!moveTarget} onOpenChange={(v) => !v && setMoveTarget(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Mover para outro dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="move-date">Nova data</Label>
            <Input id="move-date" type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMoveTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (moveTarget && moveDate) {
                  const id = moveTarget.id
                  setMoveTarget(null)
                  runAndReload(() => moveNexusContent(id, moveDate))
                }
              }}
            >
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "primary" | "orange" | "yellow" | "emerald"
}) {
  const toneMap = {
    primary: "text-primary",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    emerald: "text-emerald-400",
  }
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className={cn("text-3xl font-bold", toneMap[tone])}>{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function ContentCard({
  content,
  onOpen,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  content: NexusContent
  onOpen: () => void
  onEdit: () => void
  onDuplicate: () => void
  onMove: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const late = isLate(content.date, content.status)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-background/60 p-2.5 transition-all hover:border-primary/40",
        dragging && "opacity-40",
      )}
    >
      <div className="mb-1.5 flex items-start justify-end gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
              aria-label="Opções do conteúdo"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Mover para outro dia
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-300">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mb-1.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">{content.title}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {content.publication_time && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {content.publication_time}
          </span>
        )}
        <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]", STATUS_META[content.status].badge)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[content.status].dot)} />
          {STATUS_META[content.status].label}
        </span>
        {late && (
          <span className="inline-flex items-center gap-0.5 rounded border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-400">
            <AlertTriangle className="h-3 w-3" />
            Atrasado
          </span>
        )}
      </div>
    </div>
  )
}
