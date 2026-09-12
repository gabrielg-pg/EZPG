"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createInvestmentAsset, createInvestmentTransaction, deleteInvestmentAsset, updateInvestmentAsset } from "@/app/actions/investment-actions"
import { formatBRL, parseBRLInput, projectBalance } from "@/lib/investment-money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, TrendingUp, WalletCards } from "lucide-react"

type Asset = { id: number; name: string; ticker?: string | null; category?: string | null; institution?: string | null; initial_value?: number | string | null; current_value?: number | string | null; maturity_date?: string | null }
type Transaction = { id: number; asset_id: number; transaction_type: string; transaction_date: string; amount: number; currency: string; notes?: string | null }
type InvestmentData = { assets?: Asset[] | null; transactions?: Transaction[] | null }
const tabs = ["Visão Geral", "Carteira", "Aportes", "Movimentações", "Metas", "Simulador"]
const amount = (value: unknown) => { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0 }
const displayCurrent = (asset: Asset) => asset.current_value === null || asset.current_value === undefined ? amount(asset.initial_value) : amount(asset.current_value)

export function InvestmentsDashboard({ initialData }: { initialData?: InvestmentData | null }) {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>(Array.isArray(initialData?.assets) ? initialData.assets : [])
  const [tab, setTab] = useState("Visão Geral")
  const [open, setOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", ticker: "", category: "Renda Fixa", institution: "", initialValue: "", maturityDate: "" })
  const [movementOpen, setMovementOpen] = useState(false)
  const [movement, setMovement] = useState({ assetId: "", type: "APORTE", date: new Date().toISOString().slice(0, 10), amount: "", notes: "" })
  const transactions = Array.isArray(initialData?.transactions) ? initialData.transactions : []
  const invested = useMemo(() => assets.reduce((sum, asset) => sum + amount(asset.initial_value), 0), [assets])
  const current = useMemo(() => assets.reduce((sum, asset) => sum + displayCurrent(asset), 0), [assets])
  const pendingCurrentCount = assets.filter((asset) => asset.current_value === null || asset.current_value === undefined).length
  const result = current - invested
  const monthContribution = 0

  function removeAsset(asset: Asset) {
    if (!window.confirm(`Excluir o investimento “${asset.name}”? Esta ação também remove as movimentações vinculadas.`)) return
    setError("")
    startTransition(async () => {
      try { await deleteInvestmentAsset(asset.id); setAssets((items) => items.filter((item) => item.id !== asset.id)) }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir o investimento.") }
    })
  }

  function submitMovement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("")
    const value = parseBRLInput(movement.amount)
    if (!movement.assetId || value <= 0) { setError("Selecione um ativo e informe um valor válido."); return }
    startTransition(async () => {
      try { await createInvestmentTransaction({ assetId: Number(movement.assetId), type: movement.type, date: movement.date, amount: value, notes: movement.notes }); setMovementOpen(false); setMovement({ assetId: "", type: "APORTE", date: new Date().toISOString().slice(0, 10), amount: "", notes: "" }); router.refresh() }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar a movimentação.") }
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("")
    const value = parseBRLInput(form.initialValue)
    if (!form.name.trim() || value <= 0) { setError("Informe o nome e um valor investido válido."); return }
    startTransition(async () => {
      try {
        const saved = editingAsset
          ? await updateInvestmentAsset({ id: editingAsset.id, name: form.name, ticker: form.ticker, category: form.category, institution: form.institution, initialValue: value, currentValue: value, maturityDate: form.maturityDate })
          : await createInvestmentAsset({ name: form.name, ticker: form.ticker, assetType: form.category, category: form.category, institution: form.institution, initialValue: value, currentValue: value, maturityDate: form.maturityDate, currency: "BRL" })
        const nextAsset = { id: saved.id, name: saved.name, ticker: saved.ticker, category: saved.category, institution: saved.institution, maturity_date: saved.maturityDate, initial_value: saved.initialValue, current_value: saved.currentValue }
        setAssets((items) => editingAsset ? items.map((item) => item.id === nextAsset.id ? nextAsset : item) : [...items, nextAsset])
        setForm({ name: "", ticker: "", category: "Renda Fixa", institution: "", initialValue: "", maturityDate: "" }); setEditingAsset(null); setOpen(false)
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar o ativo.") }
    })
  }

  return <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-10 lg:px-14"><div className="mx-auto max-w-[1500px]">
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Patrimônio pessoal</p><h1 className="text-4xl font-semibold tracking-tight">Investimentos</h1><p className="mt-2 text-muted-foreground">Gestão e evolução do patrimônio</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setTab("Metas")}>Planejar meta</Button><Button variant="outline" disabled={!assets.length} onClick={() => setMovementOpen(true)}>Registrar movimentação</Button><Button onClick={() => { setEditingAsset(null); setForm({ name: "", ticker: "", category: "Renda Fixa", institution: "", initialValue: "", maturityDate: "" }); setError(""); setOpen(true) }}><Plus data-icon="inline-start" />Adicionar ativo</Button></div></header>
    {error && <div role="alert" className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Patrimônio atual</p><p className="mt-3 text-3xl font-semibold">{formatBRL(current)}</p><p className="mt-2 text-sm text-muted-foreground">{assets.length} ativo(s)</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total investido</p><p className="mt-3 text-3xl font-semibold">{formatBRL(invested)}</p><p className="mt-2 text-sm text-muted-foreground">Capital aportado</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Resultado</p><p className="mt-3 text-3xl font-semibold">{formatBRL(result)}</p><p className="mt-2 text-sm text-muted-foreground">{pendingCurrentCount ? "Resultado parcial" : "Resultado atualizado"}</p>{pendingCurrentCount > 0 && <p className="text-xs text-amber-500">{pendingCurrentCount} ativos aguardando atualização do valor atual.</p>}</CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Aportes no mês</p><p className="mt-3 text-3xl font-semibold">{formatBRL(monthContribution)}</p><p className="mt-2 text-sm text-muted-foreground">Meta: {formatBRL(10000)}</p></CardContent></Card></section>
    <div className="mt-8 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">{tabs.map((item) => <Button key={item} variant={tab === item ? "default" : "ghost"} onClick={() => setTab(item)}>{item}</Button>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>{tab}</CardTitle></CardHeader><CardContent>{tab === "Simulador" ? <Simulator initial={current} /> : tab === "Metas" ? <Empty title="Rumo ao Primeiro Milhão" text="Defina sua meta financeira para acompanhar o progresso real." /> : tab === "Aportes" || tab === "Movimentações" ? transactions.length === 0 ? <Empty title="Sem movimentações" text="Registre o primeiro aporte para iniciar o histórico." action={() => setMovementOpen(true)} /> : <div className="flex flex-col gap-2">{transactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="font-medium">{transaction.transaction_type}</p><p className="text-sm text-muted-foreground">{transaction.transaction_date}{transaction.notes ? ` · ${transaction.notes}` : ""}</p></div><p className="font-semibold">{formatBRL(transaction.amount)}</p></div>)}</div> : assets.length === 0 ? <Empty title="Nenhum ativo cadastrado" text="Cadastre seu primeiro ativo para começar." action={() => setOpen(true)} /> : <div className="flex flex-col gap-3">{assets.map((asset) => <div key={asset.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><WalletCards className="mt-1 text-primary" /><div><p className="font-medium">{asset.name} {asset.ticker && <Badge variant="outline">{asset.ticker}</Badge>}</p><p className="text-sm text-muted-foreground">{asset.category || "Sem categoria"} · {asset.institution || "Sem instituição"}{asset.maturity_date ? ` · Vencimento: ${String(asset.maturity_date).slice(0, 10)}` : ""}</p></div></div><div className="flex items-center gap-3"><Button variant="destructive" size="sm" onClick={() => removeAsset(asset)}>Deletar</Button><Button variant="outline" size="sm" onClick={() => { setEditingAsset(asset); setForm({ name: asset.name, ticker: asset.ticker ?? "", category: asset.category ?? "Renda Fixa", institution: asset.institution ?? "", initialValue: String(asset.initial_value ?? ""), maturityDate: asset.maturity_date ? String(asset.maturity_date).slice(0, 10) : "" }); setError(""); setOpen(true) }}>Editar</Button><div className="text-right"><p className="font-semibold">{formatBRL(displayCurrent(asset))}</p><p className="text-xs text-muted-foreground">Investido: {formatBRL(asset.initial_value)}</p>{(asset.current_value === null || asset.current_value === undefined) && <Badge variant="outline" className="mt-1 text-amber-500">Valor atual pendente</Badge>}</div></div></div>)}</div>}</CardContent></Card>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"><Card className="w-full max-w-lg"><CardHeader><CardTitle>{editingAsset ? "Editar ativo" : "Adicionar ativo"}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-4"><div><Label htmlFor="investment-name">Nome</Label><Input id="investment-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div><Label htmlFor="investment-ticker">Ticker</Label><Input id="investment-ticker" value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value })} /></div><div><Label htmlFor="investment-category">Categoria</Label><Input id="investment-category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div><div><Label htmlFor="investment-institution">Instituição</Label><Input id="investment-institution" value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} /></div><div><Label htmlFor="investment-value">Valor investido</Label><Input id="investment-value" required inputMode="decimal" placeholder="10.315,84" value={form.initialValue} onChange={(event) => setForm({ ...form, initialValue: event.target.value })} /></div><div><Label htmlFor="investment-maturity">Vencimento</Label><Input id="investment-maturity" type="date" value={form.maturityDate} onChange={(event) => setForm({ ...form, maturityDate: event.target.value })} /></div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Salvando..." : editingAsset ? "Salvar alterações" : "Salvar ativo"}</Button></div></form></CardContent></Card></div>}
    {movementOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"><Card className="w-full max-w-lg"><CardHeader><CardTitle>Registrar movimentação</CardTitle></CardHeader><CardContent><form onSubmit={submitMovement} className="flex flex-col gap-4"><div><Label htmlFor="movement-asset">Ativo</Label><select id="movement-asset" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={movement.assetId} onChange={(e) => setMovement({ ...movement, assetId: e.target.value })}><option value="">Selecione</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></div><div><Label htmlFor="movement-type">Tipo</Label><select id="movement-type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value })}><option>APORTE</option><option>COMPRA</option><option>VENDA</option><option>RESGATE</option><option>DIVIDENDO</option><option>JUROS</option><option>RENDIMENTO</option><option>TAXA</option><option>IMPOSTO</option></select></div><div><Label htmlFor="movement-date">Data</Label><Input id="movement-date" type="date" value={movement.date} onChange={(e) => setMovement({ ...movement, date: e.target.value })} /></div><div><Label htmlFor="movement-amount">Valor</Label><Input id="movement-amount" inputMode="decimal" placeholder="10.315,84" value={movement.amount} onChange={(e) => setMovement({ ...movement, amount: e.target.value })} /></div><div><Label htmlFor="movement-notes">Observação</Label><Input id="movement-notes" value={movement.notes} onChange={(e) => setMovement({ ...movement, notes: e.target.value })} /></div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setMovementOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar movimentação"}</Button></div></form></CardContent></Card></div>}
  </div></main>
}
function Empty({ title, text, action }: { title: string; text: string; action?: () => void }) { return <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center"><TrendingUp className="text-primary" /><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{text}</p>{action && <Button variant="outline" onClick={action}>Cadastrar ativo</Button>}</div> }
function Simulator({ initial }: { initial: number }) { const [monthly, setMonthly] = useState("10000"); const [rate, setRate] = useState("0.1"); const [months, setMonths] = useState("120"); const final = projectBalance(initial, parseBRLInput(monthly), Number(rate), Number(months)); return <div className="grid gap-4 md:grid-cols-3"><div><Label>Patrimônio inicial</Label><Input value={formatBRL(initial)} readOnly /></div><div><Label>Aporte mensal</Label><Input value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div><div><Label>Rentabilidade anual</Label><Input value={rate} onChange={(e) => setRate(e.target.value)} /></div><div><Label>Prazo (meses)</Label><Input value={months} onChange={(e) => setMonths(e.target.value)} /></div><div className="md:col-span-2"><p className="text-sm text-muted-foreground">Patrimônio projetado</p><p className="mt-2 text-3xl font-semibold">{formatBRL(final)}</p></div></div> }
