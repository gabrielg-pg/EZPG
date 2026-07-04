"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown, Wallet, Contact, Trophy, Target } from "lucide-react"
import { formatCurrency, formatMonthLabel } from "@/lib/format"
import type { CrmContact, CrmStage } from "@/app/actions/crm-actions"
import type { FinanceSummary } from "@/app/actions/finance-actions"

interface DashboardOverviewProps {
  userName: string
  contacts: CrmContact[]
  stages: CrmStage[]
  summary: FinanceSummary
}

export function DashboardOverview({ userName, contacts, stages, summary }: DashboardOverviewProps) {
  const wonStage = stages.find((s) => s.name.toLowerCase() === "ganho")
  const lostStage = stages.find((s) => s.name.toLowerCase() === "perdido")

  const openContacts = contacts.filter(
    (c) => c.stage_id !== wonStage?.id && c.stage_id !== lostStage?.id,
  )
  const pipelineValue = openContacts.reduce((acc, c) => acc + Number(c.value || 0), 0)
  const wonCount = contacts.filter((c) => c.stage_id === wonStage?.id).length

  const chartData = summary.monthly.map((m) => ({
    month: formatMonthLabel(m.month),
    receitas: m.receitas,
    despesas: m.despesas,
  }))

  const kpis = [
    {
      label: "Saldo atual",
      value: formatCurrency(summary.saldo),
      icon: Wallet,
      accent: summary.saldo >= 0 ? "text-[#22C55E]" : "text-destructive",
    },
    {
      label: "Receitas",
      value: formatCurrency(summary.totalReceitas),
      icon: TrendingUp,
      accent: "text-[#22C55E]",
    },
    {
      label: "Despesas",
      value: formatCurrency(summary.totalDespesas),
      icon: TrendingDown,
      accent: "text-destructive",
    },
    {
      label: "Negócios em aberto",
      value: String(openContacts.length),
      icon: Contact,
      accent: "text-primary",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">
          Olá, {userName.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground mt-1">Visão geral do CRM e do Financeiro da AEESJB.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico financeiro */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Receitas x Despesas (últimos meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Nenhum lançamento financeiro ainda.
              </p>
            ) : (
              <ChartContainer
                config={{
                  receitas: { label: "Receitas", color: "#22C55E" },
                  despesas: { label: "Despesas", color: "#DC2626" },
                }}
                className="h-[280px] w-full"
              >
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickFormatter={(v) => formatCurrency(v).replace("R$", "").trim()}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="receitas" fill="var(--color-receitas)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" fill="var(--color-despesas)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Resumo CRM */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Funil de vendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Valor em aberto</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(pipelineValue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <Trophy className="h-5 w-5 text-[#22C55E]" />
              <div>
                <p className="text-sm text-muted-foreground">Negócios ganhos</p>
                <p className="text-lg font-bold text-foreground">{wonCount}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {stages.map((stage) => {
                const count = contacts.filter((c) => c.stage_id === stage.id).length
                return (
                  <div key={stage.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
