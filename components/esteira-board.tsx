"use client"

import { useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import {
  addEsteiraProduct,
  toggleEsteiraDone,
  deleteEsteiraProduct,
  type EsteiraProduct,
  type EsteiraRegion,
} from "@/app/actions/esteira-actions"
import { ExternalLink, Plus, Trash2, Loader2, Archive, Flag, Globe, ArrowUpRight } from "lucide-react"

const CRIATIVOS_DRIVE_LINK =
  "https://drive.google.com/drive/folders/1UaLtpLBsUkOQzKzglRFp6SXjSdBKc2-3?hl=pt-br"

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const regionStyle: Record<
  EsteiraRegion,
  { label: string; icon: typeof Flag; dot: string; tag: string; ring: string }
> = {
  nacional: {
    label: "Nacional",
    icon: Flag,
    dot: "bg-[#10B981]",
    tag: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
    ring: "focus-visible:ring-[#10B981]/40",
  },
  global: {
    label: "Global",
    icon: Globe,
    dot: "bg-[#3B82F6]",
    tag: "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30",
    ring: "focus-visible:ring-[#3B82F6]/40",
  },
}

function formatDate(value: string | Date) {
  // O driver do Neon devolve DATE como objeto Date; TIMESTAMPTZ como string ISO.
  // Normalizamos para 'YYYY-MM-DD' e formatamos como dd/mm/aaaa (sem timezone shift).
  let iso: string
  if (value instanceof Date) {
    iso = value.toISOString()
  } else {
    iso = String(value)
  }
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split("-")
  if (y && m && d) return `${d}/${m}/${y}`
  return iso
}

export function EsteiraBoard({ initialProducts = [] }: { initialProducts?: EsteiraProduct[] }) {
  const [products, setProducts] = useState<EsteiraProduct[]>(initialProducts)
  const [isPending, startTransition] = useTransition()

  const active = products.filter((p) => !p.is_done)
  const archived = products.filter((p) => p.is_done)

  // Agrupa arquivados por mês/ano do done_at, mais recente primeiro.
  const archivedByMonth = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; sort: number; items: EsteiraProduct[] }>()
    for (const p of archived) {
      const ref = p.done_at ?? p.created_at
      const dt = new Date(ref)
      const key = `${dt.getFullYear()}-${dt.getMonth()}`
      const label = `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`
      const sort = dt.getFullYear() * 12 + dt.getMonth()
      if (!groups.has(key)) groups.set(key, { key, label, sort, items: [] })
      groups.get(key)!.items.push(p)
    }
    return Array.from(groups.values()).sort((a, b) => b.sort - a.sort)
  }, [archived])

  const handleToggle = (product: EsteiraProduct, done: boolean) => {
    // Atualização otimista
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, is_done: done, done_at: done ? new Date().toISOString() : null }
          : p,
      ),
    )
    startTransition(async () => {
      const res = await toggleEsteiraDone(product.id, done)
      if (!res.success) {
        // Reverte em caso de erro
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, is_done: !done, done_at: product.done_at } : p,
          ),
        )
      }
    })
  }

  const handleDelete = (id: number) => {
    const previous = products
    setProducts((prev) => prev.filter((p) => p.id !== id))
    startTransition(async () => {
      const res = await deleteEsteiraProduct(id)
      if (!res.success) setProducts(previous)
    })
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho + botão Ir para Criativos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Esteira de Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Mineração em andamento por região. Marque como realizado para arquivar automaticamente por mês.
          </p>
        </div>
        <a
          href={CRIATIVOS_DRIVE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#7C3AED]/25 transition-all hover:bg-[#7C3AED]/90 hover:shadow-xl"
        >
          Ir para Criativos
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* ESTEIRA — Trabalho Atual */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(["nacional", "global"] as EsteiraRegion[]).map((region) => (
          <EsteiraColumn
            key={region}
            region={region}
            items={active.filter((p) => p.region === region)}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onAdd={(product) => setProducts((prev) => [product, ...prev])}
            isPending={isPending}
          />
        ))}
      </section>

      {/* ARQUIVO DE MESES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Arquivo de meses</h3>
        </div>

        {archivedByMonth.length === 0 ? (
          <Card className="border-border/50 bg-card/40">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nenhum produto arquivado ainda. Ao marcar um item como realizado, ele será arquivado aqui pelo mês
              correspondente.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {archivedByMonth.map((group) => (
              <AccordionItem
                key={group.key}
                value={group.key}
                className="rounded-xl border border-border/50 bg-card/40 px-4"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <span className="flex items-center gap-3 text-sm font-semibold text-foreground">
                    {group.label}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {group.items.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {(["nacional", "global"] as EsteiraRegion[]).map((region) => {
                      const items = group.items.filter((p) => p.region === region)
                      const style = regionStyle[region]
                      return (
                        <div key={region} className="space-y-2">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
                              style.tag,
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                            {style.label}
                          </div>
                          {items.length === 0 ? (
                            <p className="pl-1 text-xs text-muted-foreground">Sem itens neste mês.</p>
                          ) : (
                            <ul className="space-y-2">
                              {items.map((p) => (
                                <ProductRow
                                  key={p.id}
                                  product={p}
                                  onToggle={handleToggle}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>
    </div>
  )
}

function EsteiraColumn({
  region,
  items,
  onToggle,
  onDelete,
  onAdd,
  isPending,
}: {
  region: EsteiraRegion
  items: EsteiraProduct[]
  onToggle: (p: EsteiraProduct, done: boolean) => void
  onDelete: (id: number) => void
  onAdd: (p: EsteiraProduct) => void
  isPending: boolean
}) {
  const style = regionStyle[region]
  const Icon = style.icon
  const [link, setLink] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    setError(null)
    if (!link.trim()) {
      setError("Informe o link do produto")
      return
    }
    setAdding(true)
    const res = await addEsteiraProduct({ region, link: link.trim(), itemDate: date })
    setAdding(false)
    if (res.success && res.product) {
      onAdd(res.product)
      setLink("")
    } else {
      setError(res.error ?? "Erro ao adicionar")
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 p-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/50 p-4">
        <div className={cn("inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-semibold", style.tag)}>
          <Icon className="h-4 w-4" />
          {style.label}
        </div>
        <span className="text-xs text-muted-foreground">{items.length} em mineração</span>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Form de adicionar */}
        <div className="space-y-2 rounded-xl border border-border/50 bg-secondary/30 p-3">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) handleAdd()
            }}
            placeholder="Cole o link do produto minerado"
            className={cn("h-9 bg-background text-sm", style.ring)}
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn("h-9 w-40 bg-background text-sm", style.ring)}
            />
            <Button
              onClick={handleAdd}
              disabled={adding}
              className="ml-auto h-9 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Lista de ativos */}
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Nenhum produto em mineração nesta região.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((p) => (
              <ProductRow key={p.id} product={p} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ProductRow({
  product,
  onToggle,
  onDelete,
}: {
  product: EsteiraProduct
  onToggle: (p: EsteiraProduct, done: boolean) => void
  onDelete: (id: number) => void
}) {
  const done = product.is_done
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
      <Checkbox
        checked={done}
        onCheckedChange={(checked) => onToggle(product, checked === true)}
        className="border-input data-[state=checked]:border-[#10B981] data-[state=checked]:bg-[#10B981]"
        aria-label={done ? "Marcar como não realizado" : "Marcar como realizado"}
      />
      <a
        href={product.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 text-sm transition-colors",
          done ? "text-muted-foreground/60 line-through" : "text-foreground hover:text-primary",
        )}
      >
        <span className="truncate">{product.link}</span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </a>
      <span className={cn("shrink-0 text-xs", done ? "text-muted-foreground/50" : "text-muted-foreground")}>
        {formatDate(product.item_date)}
      </span>
      <button
        type="button"
        onClick={() => onDelete(product.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Excluir produto"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
