"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Archive, ChevronRight, Globe2, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createMarket } from "@/app/actions/market-guide-actions"
import type { Market } from "@/app/actions/market-guide-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function MarketGuideList({ initialMarkets, isAdmin }: { initialMarkets: Market[]; isAdmin: boolean }) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const filtered = useMemo(() => initialMarkets.filter((m) => [m.name, m.language, m.currency].join(" ").toLowerCase().includes(query.toLowerCase())), [initialMarkets, query])
  function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    setError("")
    startTransition(async () => { const result = await createMarket({ name: String(data.get("name")), flag: String(data.get("flag") || "🌐"), language: String(data.get("language")), currency: String(data.get("currency")) }); if (result.error) setError(result.error); else window.location.href = `/guia-de-mercados/${result.slug}` })
  }
  return <main className="min-h-screen bg-background p-6 lg:p-10"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-primary">BASE DE CONSULTA</p><h1 className="text-3xl font-semibold tracking-tight">Guia de Mercados</h1><p className="mt-2 text-muted-foreground">Padrões de estrutura para montar lojas por mercado.</p></div>{isAdmin && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus data-icon="inline-start" />Novo Mercado</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo mercado</DialogTitle></DialogHeader><form onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget) }} className="flex flex-col gap-4"><Field name="name" label="Nome" placeholder="Itália" required /><Field name="flag" label="Bandeira" placeholder="🇮🇹" /><Field name="language" label="Idioma" placeholder="Italiano" required /><Field name="currency" label="Moeda" placeholder="EUR" required />{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={pending}>{pending ? "Criando..." : "Criar mercado"}</Button></form></DialogContent></Dialog>}</div>
    <div className="relative mb-6 max-w-xl"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por mercado, idioma ou moeda..." className="pl-9" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((m) => <Link key={m.id} href={`/guia-de-mercados/${m.slug}`}><Card className="h-full transition-colors hover:border-primary/60"><CardContent className="flex h-full flex-col gap-5 p-5"><div className="flex items-start justify-between"><span className="text-4xl">{m.flag}</span><ChevronRight className="size-5 text-muted-foreground" /></div><div><h2 className="text-xl font-semibold">{m.name}</h2><p className="mt-1 text-sm text-muted-foreground">{m.language} · {m.currency}</p></div><div className="mt-auto flex flex-wrap items-center gap-2"><Badge variant="secondary">{m.section_count} seções</Badge><span className="text-xs text-muted-foreground">Atualizado em {new Date(m.updated_at).toLocaleDateString("pt-BR")}</span></div></CardContent></Card></Link>)}</div>
    {!filtered.length && <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><Globe2 className="size-8" /><p>Nenhum mercado encontrado.</p></div>}
  </div></main>
}
function Field({ name, label, placeholder, required }: { name: string; label: string; placeholder: string; required?: boolean }) { return <div className="flex flex-col gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} placeholder={placeholder} required={required} /></div> }
