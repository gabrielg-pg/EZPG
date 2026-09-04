"use client"

import { useState, useMemo, useCallback, useTransition } from "react"
import {
  Search,
  MessageCircle,
  Filter,
  KanbanSquare,
  ArrowRight,
  Trash2,
  Clock,
  Tag,
  X,
  CreditCard,
  BadgeCheck,
  CircleDashed,
  Pencil,
  Check,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  VERTEBRA_COLUMNS,
  PLANOS_VERTEBRA,
  PLANO_BADGE,
  type VertebraLead,
  type VertebraPipelineStatus,
} from "@/lib/vertebra"
import { toWhatsAppNumber, timeAgo } from "@/lib/leads"
import {
  moveVertebraLead,
  updateVertebraSinal,
  deleteVertebraLead,
  updateVagasConfig,
  type VagasConfig,
} from "@/app/actions/vertebra-actions"

const PERIODS = [
  { value: "all", label: "Todo período" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
]

export function PropostasBoard({
  initialLeads,
  vagas: initialVagas,
}: {
  initialLeads: VertebraLead[]
  vagas: VagasConfig
}) {
  const [leads, setLeads] = useState<VertebraLead[]>(initialLeads)
  const [search, setSearch] = useState("")
  const [planoFilter, setPlanoFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<VertebraPipelineStatus | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const now = Date.now()
    return leads.filter((l) => {
      if (search) {
        const q = search.toLowerCase()
        const match =
          l.nome.toLowerCase().includes(q) ||
          l.whatsapp.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
        if (!match) return false
      }
      if (planoFilter !== "all" && l.plano !== planoFilter) return false
      if (periodFilter !== "all") {
        const days = (now - new Date(l.created_at).getTime()) / 86400000
        if (periodFilter === "today" && days > 1) return false
        if (periodFilter === "7d" && days > 7) return false
        if (periodFilter === "30d" && days > 30) return false
      }
      return true
    })
  }, [leads, search, planoFilter, periodFilter])

  const leadsByColumn = useCallback(
    (status: VertebraPipelineStatus) => filtered.filter((l) => l.pipeline_status === status),
    [filtered],
  )

  const handleMove = (lead: VertebraLead, toStatus: VertebraPipelineStatus) => {
    if (lead.pipeline_status === toStatus) return
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipeline_status: toStatus } : l)))
    startTransition(async () => {
      await moveVertebraLead(lead.id, toStatus)
    })
  }

  const handleToggleSinal = (lead: VertebraLead) => {
    const next = lead.sinal_status === "pago" ? "pendente" : "pago"
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, sinal_status: next } : l)))
    startTransition(async () => {
      await updateVertebraSinal(lead.id, next)
    })
  }

  const handleDelete = (lead: VertebraLead) => {
    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
    startTransition(async () => {
      await deleteVertebraLead(lead.id)
    })
  }

  const clearFilters = () => {
    setSearch("")
    setPlanoFilter("all")
    setPeriodFilter("all")
  }
  const hasFilters = search || planoFilter !== "all" || periodFilter !== "all"

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <KanbanSquare className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Propostas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Leads vindos do formulário Lista Vértebra — {filtered.length} de {leads.length}.
        </p>
      </div>

      {/* Editor de vagas */}
      <VagasEditor initial={initialVagas} />

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
          <Select value={planoFilter} onValueChange={setPlanoFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {PLANOS_VERTEBRA.map((p) => (
                <SelectItem key={p.id} value={p.nome}>
                  {p.nome}
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
        {VERTEBRA_COLUMNS.map((col) => {
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
                "flex max-h-[calc(100vh-320px)] w-[300px] shrink-0 flex-col rounded-2xl border bg-card/30 transition-colors",
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
                  <PropostaCard
                    key={lead.id}
                    lead={lead}
                    isDragging={draggingId === lead.id}
                    onMove={(status) => handleMove(lead, status)}
                    onToggleSinal={() => handleToggleSinal(lead)}
                    onDelete={() => handleDelete(lead)}
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
        <Tabs defaultValue={VERTEBRA_COLUMNS[0].key}>
          <TabsList className="flex w-full overflow-x-auto">
            {VERTEBRA_COLUMNS.map((col) => (
              <TabsTrigger key={col.key} value={col.key} className="flex-1 gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                {leadsByColumn(col.key).length}
              </TabsTrigger>
            ))}
          </TabsList>
          {VERTEBRA_COLUMNS.map((col) => (
            <TabsContent key={col.key} value={col.key} className="mt-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {leadsByColumn(col.key).length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">Nenhum lead</p>
                )}
                {leadsByColumn(col.key).map((lead) => (
                  <PropostaCard
                    key={lead.id}
                    lead={lead}
                    isDragging={false}
                    onMove={(status) => handleMove(lead, status)}
                    onToggleSinal={() => handleToggleSinal(lead)}
                    onDelete={() => handleDelete(lead)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

function VagasEditor({ initial }: { initial: VagasConfig }) {
  const [vagas, setVagas] = useState<VagasConfig>(initial)
  const [editing, setEditing] = useState(false)
  const [total, setTotal] = useState(String(initial.vagas_total))
  const [restantes, setRestantes] = useState(String(initial.vagas_restantes))
  const [, startTransition] = useTransition()

  const preenchidas = Math.max(0, vagas.vagas_total - vagas.vagas_restantes)
  const pct = vagas.vagas_total > 0 ? Math.round((preenchidas / vagas.vagas_total) * 100) : 0

  const save = () => {
    const t = Number(total) || 0
    const r = Number(restantes) || 0
    startTransition(async () => {
      const res = await updateVagasConfig(t, r)
      setVagas(res)
      setTotal(String(res.vagas_total))
      setRestantes(String(res.vagas_restantes))
      setEditing(false)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">Vagas do ciclo (formulário)</span>
          <span className="text-sm font-bold text-foreground">
            <span className="text-primary">{vagas.vagas_restantes}</span> de {vagas.vagas_total} disponíveis
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {editing ? (
        <div className="flex items-end gap-2">
          <div className="w-20">
            <label className="mb-1 block text-[11px] text-muted-foreground">Restantes</label>
            <Input value={restantes} onChange={(e) => setRestantes(e.target.value)} inputMode="numeric" className="h-9" />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-[11px] text-muted-foreground">Total</label>
            <Input value={total} onChange={(e) => setTotal(e.target.value)} inputMode="numeric" className="h-9" />
          </div>
          <Button size="sm" onClick={save} className="h-9 gap-1">
            <Check className="h-4 w-4" /> Salvar
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 self-start bg-transparent sm:self-auto">
          <Pencil className="h-3.5 w-3.5" /> Editar vagas
        </Button>
      )}
    </div>
  )
}

function PropostaCard({
  lead,
  isDragging,
  onMove,
  onToggleSinal,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  lead: VertebraLead
  isDragging: boolean
  onMove: (status: VertebraPipelineStatus) => void
  onToggleSinal: () => void
  onDelete: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const waNumber = toWhatsAppNumber(lead.whatsapp)
  const sinalPago = lead.sinal_status === "pago"
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-xl border bg-card/60 p-3 transition-all hover:bg-card",
        sinalPago ? "border-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]" : "border-border/60 hover:border-primary/40",
        onDragStart && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-foreground text-pretty">{lead.nome}</p>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Ações do lead"
                className="rounded-md p-1 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-primary/15 hover:text-primary group-hover:opacity-100"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mover para</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {VERTEBRA_COLUMNS.filter((c) => c.key !== lead.pipeline_status).map((c) => (
                <DropdownMenuItem key={c.key} onClick={() => onMove(c.key)}>
                  <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleSinal}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                {sinalPago ? "Marcar sinal pendente" : "Marcar sinal pago"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.open(`https://wa.me/${waNumber}`, "_blank")}
        className="mt-1.5 flex items-center gap-1.5 text-xs text-green-400 transition-colors hover:text-green-300"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {lead.whatsapp}
      </button>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {lead.plano ? (
          <Badge
            variant="outline"
            className={cn("gap-1 text-[11px]", PLANO_BADGE[lead.plano] || "bg-muted text-muted-foreground border-border")}
          >
            <Tag className="h-3 w-3" />
            {lead.plano}
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-border/60 text-[11px] text-muted-foreground">
            <Tag className="h-3 w-3" />
            Não selecionado
          </Badge>
        )}
      </div>

      {lead.forma_pagamento && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <CreditCard className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{lead.forma_pagamento}</span>
        </p>
      )}

      {/* Sinal */}
      <button
        type="button"
        onClick={onToggleSinal}
        className={cn(
          "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border py-1.5 text-[11px] font-medium transition-colors",
          sinalPago
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : lead.plano
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:border-amber-500/50"
              : "border-border/60 text-muted-foreground hover:border-primary/40",
        )}
      >
        {sinalPago ? (
          <>
            <BadgeCheck className="h-3.5 w-3.5" /> Sinal R$250 confirmado
          </>
        ) : lead.plano ? (
          <>
            <CircleDashed className="h-3.5 w-3.5" /> Sinal pendente
          </>
        ) : (
          <>
            <CircleDashed className="h-3.5 w-3.5" /> Sinal não iniciado
          </>
        )}
      </button>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeAgo(lead.created_at)}
        </span>
        <span className="flex max-w-[130px] items-center gap-1 truncate text-[11px] text-muted-foreground">
          <Tag className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.origem}</span>
        </span>
      </div>
    </div>
  )
}
