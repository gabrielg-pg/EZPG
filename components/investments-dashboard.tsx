"use client"

import { useState, useTransition } from "react"
import { createInvestmentAsset } from "@/app/actions/investment-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Wallet } from "lucide-react"

type Asset = {
  id: number
  name: string
  ticker?: string | null
  category?: string | null
  institution?: string | null
  initial_value?: number | string | null
  current_value?: number | string | null
}

type InvestmentData = { assets?: Asset[] | null }

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function InvestmentsDashboard({ initialData }: { initialData?: InvestmentData | null }) {
  const [assets, setAssets] = useState<Asset[]>(Array.isArray(initialData?.assets) ? initialData.assets : [])
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", ticker: "", category: "Renda fixa", institution: "", initialValue: "" })

  const total = assets.reduce((sum, asset) => sum + numberValue(asset.current_value ?? asset.initial_value), 0)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const value = Number(form.initialValue)
    if (!form.name.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Informe o nome do ativo e um valor investido maior que zero.")
      return
    }

    startTransition(async () => {
      try {
        const created = await createInvestmentAsset({
          name: form.name,
          ticker: form.ticker,
          assetType: form.category,
          category: form.category,
          institution: form.institution,
          initialValue: value,
          currentValue: value,
          currency: "BRL",
        })
        setAssets((current) => [...current, {
          id: created.id,
          name: created.name,
          initial_value: created.initialValue,
          current_value: created.currentValue,
          ticker: form.ticker,
          category: form.category,
          institution: form.institution,
        }])
        setForm({ name: "", ticker: "", category: "Renda fixa", institution: "", initialValue: "" })
        setOpen(false)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Não foi possível salvar o ativo.")
      }
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Patrimônio pessoal</p>
            <h1 className="text-4xl font-semibold tracking-tight">Investimentos</h1>
            <p className="mt-2 text-muted-foreground">Acompanhe seus ativos e valores investidos.</p>
          </div>
          <Button onClick={() => { setError(""); setOpen(true) }}><Plus data-icon="inline-start" />Adicionar ativo</Button>
        </header>

        {error && <div role="alert" className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Patrimônio total</p><p className="mt-3 text-3xl font-semibold">{currency.format(total)}</p><p className="mt-2 text-sm text-muted-foreground">{assets.length} ativo(s) cadastrado(s)</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Carteira</p><p className="mt-3 text-3xl font-semibold">{assets.length ? "Ativa" : "Vazia"}</p><p className="mt-2 text-sm text-muted-foreground">Dados persistidos no banco</p></CardContent></Card>
        </section>

        <Card className="mt-6">
          <CardHeader><CardTitle>Carteira</CardTitle></CardHeader>
          <CardContent>
            {assets.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center"><Wallet className="text-primary" /><p className="text-muted-foreground">Nenhum ativo cadastrado.</p><Button variant="outline" onClick={() => setOpen(true)}>Cadastrar primeiro ativo</Button></div> : <div className="flex flex-col gap-3">{assets.map((asset) => <div key={asset.id} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{asset.name} {asset.ticker && <Badge variant="outline">{asset.ticker}</Badge>}</p><p className="text-sm text-muted-foreground">{asset.category || "Sem categoria"} · {asset.institution || "Sem instituição"}</p></div><p className="text-lg font-semibold">{currency.format(numberValue(asset.current_value ?? asset.initial_value))}</p></div>)}</div>}
          </CardContent>
        </Card>

        {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm"><Card className="w-full max-w-lg"><CardHeader><CardTitle>Adicionar ativo</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-4"><div><Label htmlFor="investment-name">Nome</Label><Input id="investment-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div><Label htmlFor="investment-ticker">Ticker</Label><Input id="investment-ticker" value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value })} /></div><div><Label htmlFor="investment-category">Categoria</Label><Input id="investment-category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div><div><Label htmlFor="investment-institution">Instituição</Label><Input id="investment-institution" value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} /></div><div><Label htmlFor="investment-value">Valor investido</Label><Input id="investment-value" required min="0.01" step="0.01" type="number" value={form.initialValue} onChange={(event) => setForm({ ...form, initialValue: event.target.value })} /></div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar ativo"}</Button></div></form></CardContent></Card></div>}
      </div>
    </main>
  )
}
