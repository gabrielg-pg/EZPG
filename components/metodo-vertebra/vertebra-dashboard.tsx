"use client"

import { useMemo, useState, useTransition, useCallback } from "react"
import {
  Search,
  MessageCircle,
  Loader2,
  KanbanSquare,
  ArrowRight,
  Clock,
  Tag,
  X,
  RefreshCw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  VERTEBRA_PIPELINE,
  VERTEBRA_STATUS_META,
  VERTEBRA_QUESTION_ORDER,
  VERTEBRA_QUESTIONS,
  getVertebraAnswerLabel,
  type VertebraStatus,
} from "@/lib/metodo-vertebra"
import type { MetodoVertebraLead } from "@/lib/vertebra-db"
import { refreshVertebraLeads, setVertebraLeadStatus } from "@/app/actions/metodo-vertebra-actions"
import { toWhatsAppNumber, timeAgo } from "@/lib/leads"

export function VertebraDashboard({ initialLeads }: { initialLeads: MetodoVertebraLead[] }) {
  const [leads, setLeads] = useState<MetodoVertebraLead[]>(initialLeads)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<MetodoVertebraLead | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<VertebraStatus | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(
      (l) =>
        l.nome.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.whatsapp.replace(/\D/g, "").includes(q.replace(/\D/g, "")),
    )
  }, [leads, search])

  const leadsByColumn = useCallback(
    (key: VertebraStatus) => filtered.filter((l) => l.status === key),
    [filtered],
  )

  const handleMove = useCallback(
    (lead: MetodoVertebraLead, toKey: VertebraStatus) => {
      if (lead.status === toKey) return
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: toKey } : l)))
      setSelected((prev) => (prev?.id === lead.id ? { ...prev, status: toKey } : prev))
      startTransition(async () => {
        await setVertebraLeadStatus(lead.id, toKey)
      })
    },
    [],
  )

  function handleRefresh() {
    startTransition(async () => {
      try {
        const fresh = await refreshVertebraLeads()
        setLeads(fresh)
      } catch {
        // mantém dados atuais
      }
    })
  }

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <KanbanSquare className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Funil VÉRTEBRA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Leads capturados no funil Método VÉRTEBRA™. {filtered.length} de {leads.length}.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isPending}
          variant="outline"
          className="shrink-0 bg-transparent"
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Link público que alimenta este funil */}
      <FunnelLinkCard
        title="Funil VÉRTEBRA"
        path="/metodo-vertebra"
        hint="Este é o link do funil Método VÉRTEBRA™. Use para identificar a origem dos leads e ajustar o pipeline sem perder nenhum."
      />

      {/* Busca */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="text-muted-foreground">
            <X className="mr-1 h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      {/* Kanban desktop */}
      <div className="hidden flex-1 gap-4 overflow-x-auto pb-2 lg:flex">
        {VERTEBRA_PIPELINE.map((col) => {
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
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
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
        <Tabs defaultValue={VERTEBRA_PIPELINE[0].key}>
          <TabsList className="flex w-full overflow-x-auto">
            {VERTEBRA_PIPELINE.map((col) => (
              <TabsTrigger key={col.key} value={col.key} className="flex-1 gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.hex }} />
                {leadsByColumn(col.key).length}
              </TabsTrigger>
            ))}
          </TabsList>
          {VERTEBRA_PIPELINE.map((col) => (
            <TabsContent key={col.key} value={col.key} className="mt-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.hex }} />
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
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
      <LeadDrawer lead={selected} onClose={() => setSelected(null)} onMove={handleMove} />
    </div>
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
  lead: MetodoVertebraLead
  isDragging: boolean
  onClick: () => void
  onMove: (key: VertebraStatus) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const waNumber = toWhatsAppNumber(lead.whatsapp)
  const meta = getVertebraAnswerLabel("target_income", lead.target_income ?? undefined)
  const objetivo = getVertebraAnswerLabel("income_use_case", lead.respostas?.income_use_case)
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
        <p className="text-sm font-semibold leading-tight text-foreground text-pretty">{lead.nome || "—"}</p>
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
            {VERTEBRA_PIPELINE.filter((t) => t.key !== lead.status).map((t) => (
              <DropdownMenuItem key={t.key} onClick={() => onMove(t.key)}>
                <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: t.hex }} />
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {lead.whatsapp && (
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
      )}

      {meta && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] text-primary">
            {meta}
          </Badge>
        </div>
      )}

      {objetivo && <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{objetivo}</p>}

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
}: {
  lead: MetodoVertebraLead | null
  onClose: () => void
  onMove: (lead: MetodoVertebraLead, key: VertebraStatus) => void
}) {
  const col = lead ? VERTEBRA_STATUS_META[lead.status] : undefined
  const waNumber = lead ? toWhatsAppNumber(lead.whatsapp) : ""

  return (
    <Sheet open={lead !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {lead && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl text-pretty">{lead.nome || "Lead"}</SheetTitle>
              {col && (
                <Badge
                  variant="outline"
                  className="w-fit gap-1.5 border-border/60"
                  style={{ color: col.hex }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.hex }} />
                  {col.label}
                </Badge>
              )}
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6">
              {lead.whatsapp && (
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir WhatsApp
                </a>
              )}

              <DrawerSection title="Contato">
                <DrawerRow label="WhatsApp" value={lead.whatsapp} />
                <DrawerRow label="E-mail" value={lead.email} />
              </DrawerSection>

              <DrawerSection title="Respostas do funil">
                {VERTEBRA_QUESTION_ORDER.map((key) => {
                  const value = lead.respostas?.[key]
                  if (!value) return null
                  return (
                    <DrawerRow
                      key={key}
                      label={shortLabel(VERTEBRA_QUESTIONS[key].title)}
                      value={getVertebraAnswerLabel(key, value)}
                    />
                  )
                })}
              </DrawerSection>

              <DrawerSection title="Origem">
                <DrawerRow label="utm_source" value={lead.utm_source} />
                <DrawerRow label="utm_medium" value={lead.utm_medium} />
                <DrawerRow label="utm_campaign" value={lead.utm_campaign} />
                <DrawerRow label="Cadastro" value={new Date(lead.created_at).toLocaleString("pt-BR")} />
              </DrawerSection>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {VERTEBRA_PIPELINE.filter((t) => t.key !== lead.status).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => onMove(lead, t.key)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.hex }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1.5 rounded-xl border border-border/60 bg-card/40 p-3">{children}</div>
    </div>
  )
}

function DrawerRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value || "—"}</span>
    </div>
  )
}

// Encurta títulos longos das perguntas para o label do card
function shortLabel(title: string): string {
  const map: Record<string, string> = {
    "Quanto VOCÊ QUER estar ganhando em 30 DIAS?": "Meta de renda",
    "Você é...": "Gênero",
    "Qual sua situação hoje...": "Situação",
    "Quanto você ganha por mês atualmente?": "Renda atual",
    "TRABALHO +8H/DIA E NÃO CONSIGO GUARDAR DINHEIRO": "Afirmação 1",
    "PERDI TODAS AS OPORTUNIDADES DE GANHAR DINHEIRO NA INTERNET": "Afirmação 2",
    "TENHO MEDO DE PERDER TEMPO E DINHEIRO COM NEGÓCIO ONLINE...": "Afirmação 3",
    "Quanto tempo por dia você consegue dedicar nos primeiros 30 dias?": "Tempo/dia",
    "Qual é a sua maior trava hoje?": "Maior trava",
    "O que você faria com uma renda extra de R$ 1.621 por dia?": "Uso da renda",
  }
  return map[title] ?? title.slice(0, 24)
}
