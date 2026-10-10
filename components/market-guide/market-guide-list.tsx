"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronRight, Globe2, Plus, Search } from "lucide-react"
import { createMarket } from "@/app/actions/market-guide-actions"
import type { Market } from "@/app/actions/market-guide-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const SUMMARY_FIELDS = [
  { label: "Moeda", key: "currency" },
  { label: "Método de Envio", key: "shipping" },
  { label: "Domínio", key: "domain" },
  { label: "E-mail", key: "email" },
  { label: "Pagamentos", key: "payments" },
] as const

function sectionText(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) return value.map(sectionText).filter(Boolean).join(" · ")
  if (!value || typeof value !== "object") return ""

  const record = value as Record<string, unknown>
  if (typeof record.text === "string") return record.text.trim()
  if (typeof record.value === "string") return record.value.trim()
  if (Array.isArray(record.rows)) {
    return record.rows
      .map((row) => (row && typeof row === "object" ? Object.values(row).map(sectionText).filter(Boolean).join(" · ") : sectionText(row)))
      .filter(Boolean)
      .join(" · ")
  }

  return Object.entries(record)
    .filter(([key]) => key !== "rows")
    .map(([, item]) => sectionText(item))
    .filter(Boolean)
    .join(" · ")
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("pt-BR")
}

export function MarketGuideList({ initialMarkets, isAdmin }: { initialMarkets: Market[]; isAdmin: boolean }) {
  const [markets, setMarkets] = useState(initialMarkets)
  const [query, setQuery] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [newMarketId, setNewMarketId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return markets

    return markets.filter((market) => {
      const searchableText = [
        market.name,
        market.language,
        market.currency,
        ...Object.values(market.section_values ?? {}).map(sectionText),
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [markets, query])

  function handleCreateMarket() {
    setError("")
    startTransition(async () => {
      try {
        const result = await createMarket()
        if ("error" in result) {
          setError(result.error ?? "Não foi possível criar o mercado. Tente novamente.")
          return
        }

        setQuery("")
        setMarkets((current) => [result.market, ...current])
        setNewMarketId(result.market.id)
      } catch {
        setError("Não foi possível criar o mercado. Tente novamente.")
      }
    })
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full">
      <div className="w-full">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-sm font-semibold tracking-[0.16em] text-primary">BASE DE CONSULTA</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Guia de Mercados</h1>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {markets.length} {markets.length === 1 ? "mercado" : "mercados"}
                </Badge>
              </div>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Consulte e organize moeda, envio, domínio, e-mail e pagamentos de cada país.
              </p>
            </div>

            {isAdmin && (
              <Button type="button" onClick={handleCreateMarket} disabled={pending} className="shrink-0">
                <Plus data-icon="inline-start" />
                {pending ? "Criando card..." : "Novo Mercado"}
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar mercados por país, idioma ou informação"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por país, idioma, moeda, domínio ou pagamento..."
                className="h-11 pl-10"
              />
            </div>
            <p className="shrink-0 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
            </p>
          </div>
        </header>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((market) => {
              const values = {
                currency: market.currency,
                shipping: sectionText(market.section_values?.shipping),
                domain: sectionText(market.section_values?.domain),
                email: sectionText(market.section_values?.email),
                payments: sectionText(market.section_values?.payments),
              }

              return (
                <Card
                  key={market.id}
                  className={`h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 ${
                    newMarketId === market.id ? "border-primary/70 bg-primary/[0.03] ring-1 ring-primary/30" : ""
                  }`}
                >
                  <Link
                    href={`/guia-de-mercados/${market.slug}`}
                    aria-label={`Abrir e editar o mercado ${market.name}`}
                    className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <span
                            aria-hidden="true"
                            className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-3xl"
                          >
                            {market.flag || "🌐"}
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-semibold tracking-tight">{market.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {market.language || "Idioma a definir"}
                              {market.currency ? ` · ${market.currency}` : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
                      </div>

                      <div className="grid gap-x-5 gap-y-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
                        {SUMMARY_FIELDS.map((field) => {
                          const value = values[field.key]
                          return (
                            <div key={field.key} className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p>
                              <p className={`mt-1 break-words text-sm leading-5 ${value ? "text-foreground" : "text-muted-foreground"}`}>
                                {value || "A definir"}
                              </p>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{market.section_count ?? 0} seções</Badge>
                          <span className="text-xs text-muted-foreground">Atualizado em {formatDate(market.updated_at)}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                          Abrir para editar
                          <ChevronRight aria-hidden="true" className="size-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="mt-6 flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 text-center text-muted-foreground">
            <Globe2 aria-hidden="true" className="size-9 text-primary/70" />
            <p className="font-medium text-foreground">
              {markets.length === 0 ? "Ainda não há mercados cadastrados." : "Nenhum mercado encontrado."}
            </p>
            <p className="max-w-md text-sm">
              {markets.length === 0
                ? "Use “Novo Mercado” para criar o primeiro card e preencher os dados do país."
                : "Tente buscar por outro país, moeda, domínio ou método de pagamento."}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
