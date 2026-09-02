"use client"

import { useMemo, useState, useTransition } from "react"
import {
  MessageCircle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  CheckCircle2,
  Send,
  Target,
} from "lucide-react"
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
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<VertebraStatus | "todos">("todos")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const metrics = useMemo(() => {
    const total = leads.length
    const convertidos = leads.filter((l) => l.status === "convertido").length
    const enviados = leads.filter((l) => l.status === "whatsapp_enviado").length
    const taxa = total > 0 ? Math.round((convertidos / total) * 100) : 0
    return { total, convertidos, enviados, taxa }
  }, [leads])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) => {
      if (statusFilter !== "todos" && l.status !== statusFilter) return false
      if (!q) return true
      return (
        l.nome.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.whatsapp.toLowerCase().includes(q)
      )
    })
  }, [leads, query, statusFilter])

  function handleRefresh() {
    startTransition(async () => {
      const fresh = await refreshVertebraLeads()
      setLeads(fresh)
    })
  }

  function handleStatusChange(id: string, status: VertebraStatus) {
    // otimista
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    startTransition(async () => {
      await setVertebraLeadStatus(id, status)
    })
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Funil VÉRTEBRA</h1>
            <p className="text-sm text-muted-foreground">
              Leads capturados no funil Método VÉRTEBRA™
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={<Users className="h-5 w-5" />} label="Total de leads" value={metrics.total} />
        <MetricCard
          icon={<Send className="h-5 w-5" />}
          label="WhatsApp enviado"
          value={metrics.enviados}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Convertidos"
          value={metrics.convertidos}
        />
        <MetricCard
          icon={<Target className="h-5 w-5" />}
          label="Taxa de conversão"
          value={`${metrics.taxa}%`}
        />
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, email ou WhatsApp..."
            className="w-full rounded-xl border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={statusFilter === "todos"}
            onClick={() => setStatusFilter("todos")}
            label="Todos"
          />
          {VERTEBRA_PIPELINE.map((col) => (
            <FilterChip
              key={col.key}
              active={statusFilter === col.key}
              onClick={() => setStatusFilter(col.key)}
              label={col.label}
              dot={col.hex}
            />
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
          <span>Lead</span>
          <span>Contato</span>
          <span>Meta / Situação</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">
            Nenhum lead encontrado.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((lead) => {
              const meta = VERTEBRA_STATUS_META[lead.status] ?? VERTEBRA_PIPELINE[0]
              const isOpen = expanded === lead.id
              return (
                <li key={lead.id} className="transition-colors hover:bg-accent/40">
                  <div className="grid grid-cols-1 gap-3 px-5 py-4 lg:grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] lg:items-center lg:gap-4">
                    {/* Lead */}
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : lead.id)}
                        className="mt-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Expandir respostas"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{lead.nome || "—"}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(lead.created_at)}</p>
                      </div>
                    </div>

                    {/* Contato */}
                    <div className="min-w-0 pl-7 lg:pl-0">
                      <p className="truncate text-sm text-foreground">{lead.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">{lead.whatsapp || "—"}</p>
                    </div>

                    {/* Meta / Situação */}
                    <div className="pl-7 lg:pl-0">
                      <p className="text-sm text-foreground">
                        {getVertebraAnswerLabel("target_income", lead.target_income ?? undefined) ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getVertebraAnswerLabel(
                          "employment_status",
                          lead.employment_status ?? undefined,
                        ) ?? "—"}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="pl-7 lg:pl-0">
                      <div className="relative inline-flex">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as VertebraStatus)}
                          className={`cursor-pointer appearance-none rounded-full border px-3 py-1.5 pr-8 text-xs font-medium outline-none ${meta.bg} ${meta.color}`}
                          style={{ borderColor: `${meta.hex}55` }}
                        >
                          {VERTEBRA_PIPELINE.map((col) => (
                            <option key={col.key} value={col.key} className="bg-popover text-foreground">
                              {col.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70" />
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex justify-start pl-7 lg:justify-end lg:pl-0">
                      {lead.whatsapp ? (
                        <a
                          href={`https://wa.me/${toWhatsAppNumber(lead.whatsapp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {/* Respostas expandidas */}
                  {isOpen && (
                    <div className="border-t border-border bg-secondary/40 px-5 py-4 lg:pl-16">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Respostas do funil
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {VERTEBRA_QUESTION_ORDER.map((key) => {
                          const value = lead.respostas?.[key]
                          if (!value) return null
                          return (
                            <div key={key} className="rounded-xl border border-border bg-card px-3 py-2">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {shortLabel(VERTEBRA_QUESTIONS[key].title)}
                              </p>
                              <p className="mt-0.5 text-sm text-foreground">
                                {getVertebraAnswerLabel(key, value)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      {(lead.utm_source || lead.utm_campaign) && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Origem: {lead.utm_source ?? "—"}
                          {lead.utm_campaign ? ` · ${lead.utm_campaign}` : ""}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean
  onClick: () => void
  label: string
  dot?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {label}
    </button>
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
