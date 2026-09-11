"use client"

import { useMemo, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  Users,
  RefreshCw,
  Search,
  Gauge,
  TrendingDown,
  TrendingUp,
  Sigma,
} from "lucide-react"
import { FunnelLinkCard } from "@/components/funil-link-card"
import { PROFILE_META, MAX_SCORE, getAnswerLabel, type QuizProfile } from "@/lib/quiz"
import { timeAgo, toWhatsAppNumber } from "@/lib/leads"
import { refreshQuizLeads } from "@/app/actions/quiz-actions"
import type { QuizLead } from "@/lib/quiz-db"

type ProfileFilter = "todos" | QuizProfile
type SortOption = "recentes" | "maior_score" | "menor_score"

export function FunilDashboard({ initialLeads }: { initialLeads: QuizLead[] }) {
  const [leads, setLeads] = useState<QuizLead[]>(initialLeads)
  const [search, setSearch] = useState("")
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>("todos")
  const [sort, setSort] = useState<SortOption>("recentes")
  const [isPending, startTransition] = useTransition()

  function handleRefresh() {
    startTransition(async () => {
      try {
        const fresh = await refreshQuizLeads()
        setLeads(fresh)
      } catch {
        // silencioso — mantém os dados atuais
      }
    })
  }

  const stats = useMemo(() => {
    const total = leads.length
    const baixa = leads.filter((l) => l.perfil === "BAIXA_PRONTIDAO").length
    const media = leads.filter((l) => l.perfil === "EM_PREPARACAO").length
    const alta = leads.filter((l) => l.perfil === "ALTO_POTENCIAL").length
    const scores = leads.map((l) => l.score)
    const min = scores.length ? Math.min(...scores) : 0
    const max = scores.length ? Math.max(...scores) : 0
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    return { total, baixa, media, alta, min, max, avg }
  }, [leads])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = leads.filter((l) => {
      if (profileFilter !== "todos" && l.perfil !== profileFilter) return false
      if (!q) return true
      return (
        l.nome.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.whatsapp.toLowerCase().includes(q)
      )
    })
    list = [...list].sort((a, b) => {
      if (sort === "maior_score") return b.score - a.score
      if (sort === "menor_score") return a.score - b.score
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return list
  }, [leads, search, profileFilter, sort])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BarChart3 className="h-6 w-6 text-primary" />
            Funil de Qualificação
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe todos os leads do quiz em tempo real.</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isPending}
          className="shrink-0 bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-blue-500/90"
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Link público que alimenta este funil */}
      <FunnelLinkCard
        title="Funil QUIZ"
        path="/quiz"
        hint="Este é o link do quiz que alimenta este funil. Use para identificar a origem dos leads e ajustar o pipeline sem perder nenhum."
      />

      {/* Estatísticas de perfil */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de Leads" value={stats.total} tone="primary" />
        <StatCard icon={TrendingDown} label="Baixa Prontidão" value={stats.baixa} tone="red" />
        <StatCard icon={Gauge} label="Em Preparação" value={stats.media} tone="amber" />
        <StatCard icon={TrendingUp} label="Alto Potencial" value={stats.alta} tone="green" />
      </div>

      {/* Estatísticas de score */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreCard label="Score Mínimo" value={`${stats.min}/${MAX_SCORE}`} icon={TrendingDown} />
        <ScoreCard label="Score Médio" value={`${stats.avg.toFixed(1)}/${MAX_SCORE}`} icon={Sigma} />
        <ScoreCard label="Score Máximo" value={`${stats.max}/${MAX_SCORE}`} icon={TrendingUp} />
      </div>

      {/* Filtros e busca */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp"
            className="border-border bg-white/[0.03] pl-9 text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
        <Select value={profileFilter} onValueChange={(v) => setProfileFilter(v as ProfileFilter)}>
          <SelectTrigger className="border-border bg-white/[0.03] text-foreground">
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            <SelectItem value="BAIXA_PRONTIDAO">Baixa Prontidão</SelectItem>
            <SelectItem value="EM_PREPARACAO">Em Preparação</SelectItem>
            <SelectItem value="ALTO_POTENCIAL">Alto Potencial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="border-border bg-white/[0.03] text-foreground">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="maior_score">Maior score</SelectItem>
            <SelectItem value="menor_score">Menor score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Capital</th>
                <th className="px-4 py-3 font-medium">Prazo</th>
                <th className="px-4 py-3 font-medium">Preenchido</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const profile = PROFILE_META[lead.perfil]
                  const capital = getAnswerLabel("q2", lead.respostas?.q2) ?? "—"
                  const prazo = getAnswerLabel("q5", lead.respostas?.q5) ?? "—"
                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{lead.nome}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-foreground">{lead.email}</span>
                          <a
                            href={`https://wa.me/${toWhatsAppNumber(lead.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {lead.whatsapp}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ${profile.ring}`}
                          style={{ backgroundColor: profile.hex }}
                        >
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${profile.color} ${profile.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${profile.dot}`} />
                          {profile.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{capital}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prazo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{timeAgo(lead.created_at)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const TONES: Record<string, string> = {
  primary: "from-primary/20 to-blue-500/10 text-primary",
  red: "from-red-500/20 to-red-500/5 text-red-400",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
  green: "from-green-500/20 to-green-500/5 text-green-400",
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: keyof typeof TONES | string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${TONES[tone] ?? TONES.primary}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function ScoreCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}
