"use client"

import { useMemo, useState, useTransition } from "react"
import { createInvestmentAsset, createInvestmentTransaction, deleteInvestmentAsset, saveInvestmentGoal } from "@/app/actions/investment-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpRight, BarChart3, Calculator, Landmark, Plus, Trash2, Wallet } from "lucide-react"

type Asset = { id:number; name:string; ticker?:string; asset_type:string; category:string; institution?:string; initial_value:number; current_value:number; currency:string }
type InvestmentData = { assets: Asset[]; transactions: any[]; goals: any[]; settings: any[]; allocations: any[] }
const money = (value:number) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL", maximumFractionDigits:0 }).format(Number(value || 0))

export function InvestmentsDashboard({ initialData }: { initialData: InvestmentData }) {
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()
  const [showAsset, setShowAsset] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [form, setForm] = useState({ name:"", ticker:"", assetType:"Renda fixa", category:"Renda fixa", institution:"", initialValue:"", currentValue:"" })
  const [goal, setGoal] = useState({ name:"Liberdade financeira", targetValue:"1000000", monthlyContribution:"10000", expectedReturn:"10", targetDate:"" })
  const total = useMemo(() => data.assets.reduce((sum, asset) => sum + Number(asset.current_value || asset.initial_value || 0), 0), [data.assets])
  const invested = useMemo(() => data.assets.reduce((sum, asset) => sum + Number(asset.initial_value || 0), 0), [data.assets])
  const gain = total - invested
  const goalData = data.goals[0]
  const goalPercent = goalData ? Math.min(100, total / Number(goalData.target_value || 1) * 100) : 0

  function refresh() { window.location.reload() }
  function submitAsset(event: React.FormEvent) { event.preventDefault(); startTransition(async () => { await createInvestmentAsset({ ...form, assetType:form.assetType, initialValue:Number(form.initialValue), currentValue:form.currentValue ? Number(form.currentValue) : undefined }); setShowAsset(false); refresh() }) }
  function submitGoal(event: React.FormEvent) { event.preventDefault(); startTransition(async () => { await saveInvestmentGoal({ name:goal.name, targetValue:Number(goal.targetValue), monthlyContribution:Number(goal.monthlyContribution), expectedReturn:Number(goal.expectedReturn)/100, targetDate:goal.targetDate || undefined }); setShowGoal(false); refresh() }) }

  return <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-10 lg:px-14">
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Patrimônio pessoal</p><h1 className="text-4xl font-semibold tracking-tight text-balance">Investimentos</h1><p className="mt-2 text-muted-foreground">Sua visão completa para tomar decisões com clareza.</p></div>
        <div className="flex gap-3"><Button variant="outline" onClick={() => setShowGoal(true)}><Calculator data-icon="inline-start" />Planejar meta</Button><Button onClick={() => setShowAsset(true)}><Plus data-icon="inline-start" />Adicionar ativo</Button></div>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Wallet />} label="Patrimônio total" value={money(total)} detail={`${data.assets.length} ativos acompanhados`} />
        <Metric icon={<ArrowUpRight />} label="Rentabilidade" value={money(gain)} detail={invested ? `${((gain/invested)*100).toFixed(1)}% sobre o investido` : "Adicione seu primeiro ativo"} positive={gain >= 0} />
        <Metric icon={<ArrowDownToLine />} label="Aportes no mês" value={money(data.transactions.filter(t => String(t.transaction_type).toLowerCase().includes("aporte")).reduce((s,t)=>s+Number(t.amount||0),0))} detail="Movimentações recentes" />
        <Metric icon={<Landmark />} label="Diversificação" value={`${new Set(data.assets.map(a=>a.category)).size} classes`} detail="Distribuição da carteira" />
      </section>
      <Tabs defaultValue="visao" className="mt-8">
        <TabsList><TabsTrigger value="visao">Visão geral</TabsTrigger><TabsTrigger value="carteira">Carteira</TabsTrigger><TabsTrigger value="movimentacoes">Movimentações</TabsTrigger><TabsTrigger value="simulador">Simulador</TabsTrigger></TabsList>
        <TabsContent value="visao" className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card><CardHeader><CardTitle>Evolução do patrimônio</CardTitle></CardHeader><CardContent><div className="flex h-64 items-end gap-3 rounded-xl bg-muted/30 p-6">{[38,45,42,55,62,70,78,86,92,100].map((height,index)=><div key={index} className="flex flex-1 flex-col justify-end gap-2"><div className="rounded-t-md bg-primary/80" style={{height:`${height}%`}} /><span className="text-center text-xs text-muted-foreground">{index+1}</span></div>)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle>Alocação por classe</CardTitle></CardHeader><CardContent className="flex flex-col gap-5">{(data.allocations.length ? data.allocations : [{category:"Renda fixa",target_percentage:55},{category:"Ações",target_percentage:25},{category:"Fundos",target_percentage:12},{category:"Exterior",target_percentage:8}]).map((item:any)=><div key={item.category}><div className="mb-2 flex justify-between text-sm"><span>{item.category}</span><span className="font-medium">{Number(item.target_percentage).toFixed(0)}%</span></div><Progress value={Number(item.target_percentage)} /></div>)}</CardContent></Card>
          <Card className="lg:col-span-2"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Meta financeira</CardTitle><Button variant="ghost" size="sm" onClick={() => setShowGoal(true)}>Editar meta</Button></CardHeader><CardContent>{goalData ? <><div className="mb-3 flex items-end justify-between"><div><p className="text-2xl font-semibold">{money(total)}</p><p className="text-sm text-muted-foreground">de {money(Number(goalData.target_value))}</p></div><Badge variant="secondary">{goalPercent.toFixed(0)}%</Badge></div><Progress value={goalPercent} /></> : <div className="flex items-center justify-between rounded-lg border border-dashed p-5"><div><p className="font-medium">Defina sua primeira meta</p><p className="text-sm text-muted-foreground">Projete liberdade financeira com aportes mensais.</p></div><Button onClick={() => setShowGoal(true)}>Criar meta</Button></div>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="carteira" className="mt-5"><Card><CardHeader><CardTitle>Ativos da carteira</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-3">{data.assets.length ? data.assets.map(asset=><div key={asset.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><p className="font-medium">{asset.name}</p>{asset.ticker && <Badge variant="outline">{asset.ticker}</Badge>}</div><p className="text-sm text-muted-foreground">{asset.category} · {asset.institution || "Sem instituição"}</p></div><div className="flex items-center gap-5"><p className="font-semibold">{money(Number(asset.current_value || asset.initial_value))}</p><Button variant="ghost" size="icon" onClick={() => startTransition(async()=>{await deleteInvestmentAsset(asset.id); refresh()})}><Trash2 /></Button></div></div>) : <EmptyState onAdd={() => setShowAsset(true)} />}</div></CardContent></Card></TabsContent>
        <TabsContent value="movimentacoes" className="mt-5"><Card><CardHeader><CardTitle>Movimentações recentes</CardTitle></CardHeader><CardContent>{data.transactions.length ? <div className="flex flex-col gap-3">{data.transactions.map(t=><div key={t.id} className="flex justify-between border-b py-3"><span>{t.transaction_type}</span><strong>{money(Number(t.amount))}</strong></div>)}</div> : <EmptyState onAdd={() => setShowAsset(true)} label="Adicione ativos para acompanhar seus aportes." />}</CardContent></Card></TabsContent>
        <TabsContent value="simulador" className="mt-5"><Simulator total={total} /></TabsContent>
      </Tabs>
      {showAsset && <Modal title="Adicionar ativo" onClose={() => setShowAsset(false)}><form onSubmit={submitAsset} className="flex flex-col gap-4"><Field label="Nome"><Input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex.: Tesouro IPCA+ 2035" /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Ticker"><Input value={form.ticker} onChange={e=>setForm({...form,ticker:e.target.value})} placeholder="Ex.: BOVA11" /></Field><Field label="Classe"><Input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></Field></div><Field label="Instituição"><Input value={form.institution} onChange={e=>setForm({...form,institution:e.target.value})} placeholder="Ex.: XP Investimentos" /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Valor investido"><Input required type="number" step="0.01" value={form.initialValue} onChange={e=>setForm({...form,initialValue:e.target.value})} /></Field><Field label="Valor atual"><Input type="number" step="0.01" value={form.currentValue} onChange={e=>setForm({...form,currentValue:e.target.value})} /></Field></div><Button disabled={isPending} type="submit">{isPending ? "Salvando..." : "Salvar ativo"}</Button></form></Modal>}
      {showGoal && <Modal title="Planejar meta" onClose={() => setShowGoal(false)}><form onSubmit={submitGoal} className="flex flex-col gap-4"><Field label="Nome da meta"><Input required value={goal.name} onChange={e=>setGoal({...goal,name:e.target.value})} /></Field><Field label="Valor alvo"><Input required type="number" value={goal.targetValue} onChange={e=>setGoal({...goal,targetValue:e.target.value})} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Aporte mensal"><Input required type="number" value={goal.monthlyContribution} onChange={e=>setGoal({...goal,monthlyContribution:e.target.value})} /></Field><Field label="Retorno esperado (%)"><Input required type="number" step="0.1" value={goal.expectedReturn} onChange={e=>setGoal({...goal,expectedReturn:e.target.value})} /></Field></div><Button disabled={isPending} type="submit">{isPending ? "Salvando..." : "Salvar meta"}</Button></form></Modal>}
    </div>
  </main>
}

function Metric({ icon, label, value, detail, positive }: any) { return <Card><CardContent className="p-5"><div className="mb-5 flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="text-primary">{icon}</span></div><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></CardContent></Card> }
function Field({ label, children }: any) { return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div> }
function EmptyState({ onAdd, label="Cadastre seu primeiro ativo para começar." }: any) { return <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center"><BarChart3 className="text-primary" /><p className="text-muted-foreground">{label}</p><Button variant="outline" onClick={onAdd}><Plus data-icon="inline-start" />Adicionar ativo</Button></div> }
function Modal({ title, onClose, children }: any) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"><Card className="w-full max-w-lg"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{title}</CardTitle><Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button></CardHeader><CardContent>{children}</CardContent></Card></div> }
function Simulator({ total }: { total:number }) { const [monthly,setMonthly]=useState(10000); const [years,setYears]=useState(10); const [rate,setRate]=useState(10); const monthlyRate=rate/100/12; const months=years*12; const projected=total*Math.pow(1+monthlyRate,months)+monthly*((Math.pow(1+monthlyRate,months)-1)/monthlyRate); return <Card><CardHeader><CardTitle>Simulador de patrimônio</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-3"><Field label="Aporte mensal"><Input type="number" value={monthly} onChange={e=>setMonthly(Number(e.target.value))} /></Field><Field label="Prazo (anos)"><Input type="number" value={years} onChange={e=>setYears(Number(e.target.value))} /></Field><Field label="Retorno anual (%)"><Input type="number" value={rate} onChange={e=>setRate(Number(e.target.value))} /></Field><div className="rounded-xl bg-muted p-5 md:col-span-3"><p className="text-sm text-muted-foreground">Patrimônio projetado</p><p className="mt-1 text-3xl font-semibold">{money(projected)}</p><p className="mt-2 text-sm text-muted-foreground">Estimativa matemática, não recomendação de investimento.</p></div></CardContent></Card> }
