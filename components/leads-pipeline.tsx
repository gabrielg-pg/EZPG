"use client"

import type { ReactNode } from "react"
import { useState, useMemo, useTransition, useCallback } from "react"
import {
  Search,
  MessageCircle,
  Filter,
  Loader2,
  KanbanSquare,
  ArrowRight,
  Trash2,
  Clock,
  Tag,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { FunnelLinkCard } from "@/components/funil-link-card"
import {
  BOARD_COLUMNS,
  MOVE_TARGETS,
  CAPITAL_TIERS,
  getLeadColumnKey,
  boardKeyToPipelineStatus,
  currentMoveTarget,
  toWhatsAppNumber,
  timeAgo,
  type Lead,
  type BoardColumnKey,
} from "@/lib/leads"
import {
  movePipelineLead,
  updateLeadNotes,
  deletePipelineLead,
} from "@/app/actions/leads-actions"

const PERIODS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
]

export function LeadsPipeline({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState("")
  const [capitalFilter, setCapitalFilter] = useState("all")
  const [campaignFilter, setCampaignFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [selected, setSelected] = useState<Lead | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<BoardColumnKey | null>(null)
  const [, startTransition] = useTransition()

  // Lista de campanhas únicas para o filtro
  const campaigns = useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => l.utm_campaign && set.add(l.utm_campaign))
    return Array.from(set)
  }, [leads])

  const filtered = useMemo(() => {
    const now = Date.now()
    return leads.filter((l) => {
      if (search) {
        const q = search.toLowerCase()
        const match =
          l.nome.toLowerCase().includes(q) || l.whatsapp.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
        if (!match) return false
      }
      if (capitalFilter !== "all" && l.capital !== capitalFilter) return false
      if (campaignFilter !== "all" && l.utm_campaign !== campaignFilter) return false
      if (periodFilter !== "all") {
        const age = now - new Date(l.created_at).getTime()
        const days = age / 86400000
        if (periodFilter === "today" && days > 1) return false
        if (periodFilter === "7d" && days > 7) return false
        if (periodFilter === "30d" && days > 30) return false
      }
      return true
    })
  }, [leads, search, capitalFilter, campaignFilter, periodFilter])

  const leadsByColumn = useCallback(
    (key: BoardColumnKey) => filtered.filter((l) => getLeadColumnKey(l) === key),
    [filtered],
  )

  const handleMove = (lead: Lead, toKey: string) => {
    if (getLeadColumnKey(lead) === toKey) return
    const newStatus = boardKeyToPipelineStatus(toKey)
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, pipeline_status: newStatus } : l)),
    )
    setSelected((prev) => (prev?.id === lead.id ? { ...prev, pipeline_status: newStatus } : prev))
    startTransition(async () => {
      await movePipelineLead(lead.id, toKey)
    })
  }

  const handleDelete = (lead: Lead) => {
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
    setSelected(null)
    startTransition(async () => {
      await deletePipelineLead(lead.id)
    })
  }

  const clearFilters = () => {
    setSearch("")
    setCapitalFilter("all")
    setCampaignFilter("all")
    setPeriodFilter("all")
  }

  const hasFilters =
    search || capitalFilter !== "all" || campaignFilter !== "all" || periodFilter !== "all"

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <KanbanSquare className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Funil Formulário</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Leads qualificados vindos do formulário de campanha. {filtered.length} de {leads.length}.
        </p>
      </div>

      {/* Link público que alimenta este funil */}
      <FunnelLinkCard
        title="Funil Formulário"
        path="/qualificacao"
        hint="Este é o link do formulário no CRM que vira o Funil Formulário. Use para ajustar o pipeline sem perder leads."
      />

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={capitalFilter} onValueChange={setCapitalFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Capital" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo capital</SelectItem>
              {Object.entries(CAPITAL_TIERS)
                .filter(([k]) => k !== "sem_capital")
                .map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda campanha</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="mr-1 h-4 w-4" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Kanban desktop */}
      <div className="hidden flex-1 gap-4 overflow-x-auto pb-2 lg:flex">
        {BOARD_COLUMNS.map((col) => {
          const colLeads = leadsByColumn(col.key)
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverCol(col.key)
              }}
              onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
              onDrop={() => {
                const lead = leads.find((l) => l.id === draggingId)
                if (lead) handleMove(lead, col.key)
                setDraggingId(null)
                setDragOverCol(null)
              }}
              className={cn(
                "flex max-h-[calc(100vh-260px)] w-[300px] shrink-0 flex-col rounded-2xl border bg-card/30 transition-colors",
                dragOverCol === col.key ? "border-primary/50 bg-primary/5" : "border-border/60",
              )}
            >
              <div className="flex items-center justify-between border-b border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                </div>
                <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
                  {colLeads.length}
                </Badge>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
                {colLeads.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Nenhum lead</p>
                )}
                {colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isDragging={draggingId === lead.id}
                    onClick={() => setSelected(lead)}
                    onMove={(status) => handleMove(lead, status)}
                    onDragStart={() => setDraggingId(lead.id)}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDragOverCol(null)
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: tabs */}
      <div className="flex-1 lg:hidden">
        <Tabs defaultValue={BOARD_COLUMNS[0].key}>
          <TabsList className="flex w-full overflow-x-auto">
            {BOARD_COLUMNS.map((col) => (
              <TabsTrigger key={col.key} value={col.key} className="flex-1 gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                {leadsByColumn(col.key).length}
              </TabsTrigger>
            ))}
          </TabsList>
          {BOARD_COLUMNS.map((col) => (
            <TabsContent key={col.key} value={col.key} className="mt-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
                <span className="text-xs text-muted-foreground">({col.description})</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {leadsByColumn(col.key).length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Nenhum lead</p>
                )}
                {leadsByColumn(col.key).map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isDragging={false}
                    onClick={() => setSelected(lead)}
                    onMove={(status) => handleMove(lead, status)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Drawer de detalhes */}
      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onMove={handleMove}
        onDelete={handleDelete}
        onNotesSaved={(id, notas) =>
          setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notas } : l)))
        }
      />
    </div>
  )
}

function CapitalBadge({ capital }: { capital: string | null }) {
  if (!capital) return null
  const tier = CAPITAL_TIERS[capital]
  if (!tier) return null
  return (
    <Badge variant="outline" className={cn("text-[11px]", tier.badge)}>
      {tier.label}
    </Badge>
  )
}

function LeadCard({
  lead,
  isDragging,
  onClick,
  onMove,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead
  isDragging: boolean
  onClick: () => void
  onMove: (key: string) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const waNumber = toWhatsAppNumber(lead.whatsapp)
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-xl border border-border/60 bg-card/60 p-3 transition-all hover:border-primary/40 hover:bg-card",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-foreground text-pretty">{lead.nome}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Mover lead"
              className="shrink-0 rounded-md p-1 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-primary/15 hover:text-primary group-hover:opacity-100"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Mover para</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOVE_TARGETS.filter((t) => t.key !== currentMoveTarget(lead)).map((t) => (
              <DropdownMenuItem key={t.key} onClick={() => onMove(t.key)}>
                <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          window.open(`https://wa.me/${waNumber}`, "_blank")
        }}
        className="mt-1.5 flex items-center gap-1.5 text-xs text-green-400 transition-colors hover:text-green-300"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {lead.whatsapp}
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <CapitalBadge capital={lead.capital} />
      </div>

      {lead.objetivo && (
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{lead.objetivo}</p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeAgo(lead.created_at)}
        </span>
        {lead.utm_campaign && (
          <span className="flex max-w-[130px] items-center gap-1 truncate text-[11px] text-muted-foreground">
            <Tag className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.utm_campaign}</span>
          </span>
        )}
      </div>
    </div>
  )
}

function LeadDrawer({
  lead,
  onClose,
  onMove,
  onDelete,
  onNotesSaved,
}: {
  lead: Lead | null
  onClose: () => void
  onMove: (lead: Lead, key: string) => void
  onDelete: (lead: Lead) => void
  onNotesSaved: (id: string, notas: string) => void
}) {
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [, startTransition] = useTransition()

  // Sincroniza notas quando abre um lead diferente
  const [loadedId, setLoadedId] = useState<string | null>(null)
  if (lead && lead.id !== loadedId) {
    setLoadedId(lead.id)
    setNotes(lead.notas ?? "")
  }

  const saveNotes = () => {
    if (!lead) return
    setSavingNotes(true)
    startTransition(async () => {
      await updateLeadNotes(lead.id, notes)
      onNotesSaved(lead.id, notes)
      setSavingNotes(false)
    })
  }

  const col = lead ? BOARD_COLUMNS.find((c) => c.key === getLeadColumnKey(lead)) : undefined
  const waNumber = lead ? toWhatsAppNumber(lead.whatsapp) : ""

  return (
    <Sheet open={lead !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {lead && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl text-pretty">{lead.nome}</SheetTitle>
              <div className="flex items-center gap-2">
                {col && (
                  <Badge variant="outline" className="gap-1.5 border-border/60" style={{ color: col.color }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.label}
                  </Badge>
                )}
                <CapitalBadge capital={lead.capital} />
              </div>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </a>

              <DrawerSection title="Contato">
                <DrawerRow label="WhatsApp" value={lead.whatsapp} />
                <DrawerRow label="E-mail" value={lead.email} />
              </DrawerSection>

              <DrawerSection title="Respostas do formulário">
                <DrawerRow label="Objetivo" value={lead.objetivo} />
                <DrawerRow label="Situação atual" value={lead.situacao} />
                <DrawerRow label="Experiência" value={lead.experiencia} />
                <DrawerRow label="Capital" value={lead.capital ? CAPITAL_TIERS[lead.capital]?.label : null} />
                <DrawerRow label="Prazo de início" value={lead.prazo} />
              </DrawerSection>

              <DrawerSection title="Origem">
                <DrawerRow label="utm_source" value={lead.utm_source} />
                <DrawerRow label="utm_medium" value={lead.utm_medium} />
                <DrawerRow label="utm_campaign" value={lead.utm_campaign} />
                <DrawerRow label="utm_content" value={lead.utm_content} />
                <DrawerRow label="fbclid" value={lead.fbclid} />
                <DrawerRow label="Cadastro" value={new Date(lead.created_at).toLocaleString("pt-BR")} />
              </DrawerSection>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {MOVE_TARGETS.filter((t) => t.key !== currentMoveTarget(lead)).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => onMove(lead, t.key)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Notas internas</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações sobre este lead..."
                  className="min-h-[100px]"
                />
                <Button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  size="sm"
                  className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar notas
                </Button>
              </div>

              <button
                onClick={() => onDelete(lead)}
                className="flex items-center gap-2 text-sm text-rose-400 transition-colors hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Excluir lead
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function DrawerRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right text-foreground text-pretty">{value}</span>
    </div>
  )
}
