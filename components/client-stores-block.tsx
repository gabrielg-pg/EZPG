"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Store, Plus, ExternalLink, Trash2, Loader2, MapPin, Globe, Pencil, Check, X, Wallet } from "lucide-react"
import {
  createClientStore,
  deleteClientStore,
  updateClientStoreAdspend,
} from "@/app/actions/client-store-actions"
import {
  ADSPEND_CURRENCIES,
  type ClientStoreEntry,
  type ClientStoreType,
  type AdspendCurrency,
} from "@/lib/client-stores"

type ColumnConfig = {
  type: ClientStoreType
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const COLUMNS: ColumnConfig[] = [
  { type: "nacional", title: "Nacionais", icon: MapPin },
  { type: "global", title: "Globais", icon: Globe },
]

const CURRENCY_META: Record<AdspendCurrency, { label: string; symbol: string; locale: string }> = {
  BRL: { label: "Real (R$)", symbol: "R$", locale: "pt-BR" },
  USD: { label: "Dólar (US$)", symbol: "US$", locale: "en-US" },
  EUR: { label: "Euro (€)", symbol: "€", locale: "de-DE" },
  GBP: { label: "Libra (£)", symbol: "£", locale: "en-GB" },
}

function formatAdspend(value: number, currency: AdspendCurrency): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.BRL
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${meta.symbol} ${value.toFixed(2)}`
  }
}

export function ClientStoresBlock({ initialStores }: { initialStores: ClientStoreEntry[] }) {
  const [stores, setStores] = useState<ClientStoreEntry[]>(initialStores)
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState<ClientStoreType>("nacional")
  const [form, setForm] = useState<{
    name: string
    site: string
    niche: string
    adspend: string
    adspendCurrency: AdspendCurrency
  }>({ name: "", site: "", niche: "", adspend: "", adspendCurrency: "BRL" })
  const [error, setError] = useState("")
  const [pendingDelete, setPendingDelete] = useState<ClientStoreEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  // Edição inline de ADSPEND
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<{ adspend: string; adspendCurrency: AdspendCurrency }>({
    adspend: "",
    adspendCurrency: "BRL",
  })
  const [savingId, setSavingId] = useState<number | null>(null)

  const openAdd = (type: ClientStoreType) => {
    setAddType(type)
    setForm({ name: "", site: "", niche: "", adspend: "", adspendCurrency: "BRL" })
    setError("")
    setAddOpen(true)
  }

  const handleAdd = () => {
    if (!form.name.trim() || !form.site.trim() || !form.niche.trim()) {
      setError("Preencha nome, site e nicho.")
      return
    }
    const adspendValue = form.adspend.trim() === "" ? 0 : Number.parseFloat(form.adspend)
    if (!(adspendValue >= 0)) {
      setError("Informe um valor de ADSPEND válido.")
      return
    }
    startTransition(async () => {
      const result = await createClientStore({
        name: form.name,
        site: form.site,
        niche: form.niche,
        type: addType,
        adspend: adspendValue,
        adspendCurrency: form.adspendCurrency,
      })
      if (result.success && result.store) {
        setStores((prev) => [...prev, result.store as ClientStoreEntry])
        setAddOpen(false)
      } else {
        setError(result.error || "Erro ao adicionar loja.")
      }
    })
  }

  const startEditAdspend = (store: ClientStoreEntry) => {
    setEditingId(store.id)
    setEditDraft({ adspend: String(store.adspend ?? 0), adspendCurrency: store.adspend_currency ?? "BRL" })
  }

  const saveEditAdspend = (id: number) => {
    const value = editDraft.adspend.trim() === "" ? 0 : Number.parseFloat(editDraft.adspend)
    if (!(value >= 0)) return
    setSavingId(id)
    startTransition(async () => {
      const result = await updateClientStoreAdspend(id, value, editDraft.adspendCurrency)
      setSavingId(null)
      if (result.success) {
        setStores((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, adspend: value, adspend_currency: editDraft.adspendCurrency } : s,
          ),
        )
        setEditingId(null)
      }
    })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setStores((prev) => prev.filter((s) => s.id !== id))
    setPendingDelete(null)
    startTransition(async () => {
      await deleteClientStore(id)
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Lojas de nossos clientes + ADSPEND</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {COLUMNS.map((column) => {
          const Icon = column.icon
          const columnStores = stores.filter((s) => s.type === column.type)
          return (
            <Card key={column.type} className="flex flex-col border-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    {column.title}
                    <Badge variant="outline" className="ml-1 border-border bg-secondary/50 text-muted-foreground">
                      {columnStores.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAdd(column.type)}
                    className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar loja
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {columnStores.length === 0 ? (
                  <p className="py-6 text-center text-sm italic text-muted-foreground/60">
                    Nenhuma loja adicionada ainda.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {columnStores.map((store) => (
                      <li
                        key={store.id}
                        className="group flex items-start gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 transition-colors hover:border-primary/40"
                      >
                        <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate text-sm font-medium text-foreground">{store.name}</p>
                          <a
                            href={store.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {store.site.replace(/^https?:\/\//, "")}
                          </a>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-teal-500/25 bg-teal-500/15 text-teal-400 hover:bg-teal-500/15">
                              {store.niche}
                            </Badge>
                          </div>

                          {/* ADSPEND mês */}
                          {editingId === store.id ? (
                            <div className="flex items-center gap-2 pt-0.5">
                              <Select
                                value={editDraft.adspendCurrency}
                                onValueChange={(v) =>
                                  setEditDraft((d) => ({ ...d, adspendCurrency: v as AdspendCurrency }))
                                }
                              >
                                <SelectTrigger className="h-8 w-[92px] shrink-0 border-border bg-background/60 text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ADSPEND_CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {CURRENCY_META[c].symbol} {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                autoFocus
                                value={editDraft.adspend}
                                onChange={(e) => setEditDraft((d) => ({ ...d, adspend: e.target.value }))}
                                placeholder="0,00"
                                className="h-8 w-32 border-border bg-background/60 text-foreground"
                              />
                              <button
                                type="button"
                                onClick={() => saveEditAdspend(store.id)}
                                disabled={savingId === store.id}
                                aria-label="Salvar ADSPEND"
                                className="rounded-md p-1.5 text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                              >
                                {savingId === store.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                disabled={savingId === store.id}
                                aria-label="Cancelar edição"
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditAdspend(store)}
                              className="group/adspend flex items-center gap-1.5 rounded-md text-left"
                              title="Editar ADSPEND mensal"
                            >
                              <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">ADSPEND/mês:</span>
                              <span className="text-xs font-semibold text-foreground">
                                {formatAdspend(store.adspend ?? 0, store.adspend_currency ?? "BRL")}
                              </span>
                              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover/adspend:opacity-100" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(store)}
                          aria-label={`Excluir ${store.name}`}
                          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de adicionar loja */}
      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Store className="h-5 w-5 text-primary" />
              Adicionar loja
              <span className="text-sm font-normal text-muted-foreground">
                — {addType === "nacional" ? "Nacionais" : "Globais"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cs-name" className="text-sm text-muted-foreground">
                Nome da loja
              </Label>
              <Input
                id="cs-name"
                placeholder="Ex: Minha Loja"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-site" className="text-sm text-muted-foreground">
                Site da loja
              </Label>
              <Input
                id="cs-site"
                placeholder="Ex: https://loja.com"
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cs-niche" className="text-sm text-muted-foreground">
                Nicho da loja
              </Label>
              <Input
                id="cs-niche"
                placeholder="Ex: Moda feminina"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">ADSPEND mensal</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={form.adspendCurrency}
                  onValueChange={(v) => setForm({ ...form, adspendCurrency: v as AdspendCurrency })}
                >
                  <SelectTrigger className="w-[130px] shrink-0 border-border bg-secondary/40 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADSPEND_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_META[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.adspend}
                  onChange={(e) => setForm({ ...form, adspend: e.target.value })}
                  className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <p className="text-xs text-muted-foreground/70">
                Valor que o cliente pode gastar por mês em tráfego pago.
              </p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={isPending}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={isPending} className="bg-primary text-primary-foreground">
              {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir loja
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{pendingDelete?.name}</span>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
