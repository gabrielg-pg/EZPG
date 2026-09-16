"use client"

import { useMemo, useState } from "react"
import { BarChart3, Filter, Target, Users, X, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GrowthLead } from "@/app/actions/growth-actions"

const funnels = ["Todos", "CRM", "QUIZ", "VÉRTEBRA"] as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value))
}

export function FunisGrowthDashboard({ initialLeads }: { initialLeads: GrowthLead[] }) {
  const [funnel, setFunnel] = useState<(typeof funnels)[number]>("Todos")
  const [source, setSource] = useState("Todos")
  const [period, setPeriod] = useState("30")
  const [query, setQuery] = useState("")
  const leads = useMemo(() => {
    const cutoff = Date.now() - Number(period) * 86400000
    return initialLeads.filter((lead) => (funnel === "Todos" || lead.funnel === funnel) && (source === "Todos" || lead.source === source) && new Date(lead.createdAt).getTime() >= cutoff && lead.name.toLowerCase().includes(query.toLowerCase()))
  }, [initialLeads, funnel, source, period, query])
  const sources = Array.from(new Set(initialLeads.map((lead) => lead.source))).sort()
  const byFunnel = funnels.slice(1).map((name) => ({ name, count: leads.filter((lead) => lead.funnel === name).length }))
  const byStage = Array.from(new Set(leads.map((lead) => lead.stage))).map((stage) => ({ stage, count: leads.filter((lead) => lead.stage === stage).length })).sort((a, b) => b.count - a.count)
  const crmCount = leads.filter((lead) => lead.funnel === "CRM").length
  const qualified = leads.filter((lead) => lead.stage !== "novo").length
  const conversion = leads.length ? Math.round((qualified / leads.length) * 100) : 0
  const clear = () => { setFunnel("Todos"); setSource("Todos"); setPeriod("30"); setQuery("") }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Growth intelligence</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Funis Growth</h2><p className="mt-2 text-muted-foreground">Visão executiva dos funis CRM, QUIZ e VÉRTEBRA.</p></div><Button variant="outline" onClick={clear}><X className="mr-2 size-4" />Limpar filtros</Button></div>
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4"><select aria-label="Funil" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={funnel} onChange={(e) => setFunnel(e.target.value as typeof funnel)}>{funnels.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Origem" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={source} onChange={(e) => setSource(e.target.value)}><option>Todos</option>{sources.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Período" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="3650">Todo o período</option></select><Input aria-label="Buscar lead" placeholder="Buscar lead" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{([{ label: "Leads no período", value: leads.length, Icon: Users }, { label: "Funis ativos", value: byFunnel.filter((item) => item.count > 0).length, Icon: Filter }, { label: "Qualificados", value: qualified, Icon: Target }, { label: "Taxa de avanço", value: `${conversion}%`, Icon: BarChart3 }] as { label: string; value: string | number; Icon: LucideIcon }[]).map(({ label, value, Icon }) => <div key={label} className="rounded-xl border border-border bg-card p-5"><Icon className="size-5 text-primary" /><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold">{value}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-border bg-card p-6"><h3 className="font-semibold">Leads por funil</h3><div className="mt-6 flex flex-col gap-5">{byFunnel.map((item) => <div key={item.name}><div className="flex justify-between text-sm"><span>{item.name}</span><strong>{item.count}</strong></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${leads.length ? Math.max(2, item.count / leads.length * 100) : 0}%` }} /></div></div>)}</div></section><section className="rounded-xl border border-border bg-card p-6"><h3 className="font-semibold">Etapas e gargalos</h3><div className="mt-6 space-y-3">{byStage.length ? byStage.map((item) => <div key={item.stage} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"><span>{item.stage.replaceAll("_", " ")}</span><span className="font-semibold">{item.count}</span></div>) : <p className="text-sm text-muted-foreground">Nenhum dado no período selecionado.</p>}</div></section></div>
    <section className="rounded-xl border border-border bg-card p-6"><div className="flex items-center justify-between"><h3 className="font-semibold">Leads recentes</h3><span className="text-sm text-muted-foreground">{leads.length} registros</span></div><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Lead</th><th className="px-3 py-3 font-medium">Funil</th><th className="px-3 py-3 font-medium">Origem</th><th className="px-3 py-3 font-medium">Etapa</th><th className="px-3 py-3 font-medium">Data</th></tr></thead><tbody>{leads.slice(0, 20).map((lead) => <tr key={lead.id} className="border-b border-border/60"><td className="px-3 py-3 font-medium">{lead.name}</td><td className="px-3 py-3">{lead.funnel}</td><td className="px-3 py-3 text-muted-foreground">{lead.source}</td><td className="px-3 py-3">{lead.stage.replaceAll("_", " ")}</td><td className="px-3 py-3 text-muted-foreground">{formatDate(lead.createdAt)}</td></tr>)}</tbody></table></div></section>
  </div>
}
