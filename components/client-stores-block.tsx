"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Store, Plus, ExternalLink, Trash2, Loader2, MapPin, Globe } from "lucide-react"
import {
  createClientStore,
  deleteClientStore,
  type ClientStoreEntry,
  type ClientStoreType,
} from "@/app/actions/client-store-actions"

type ColumnConfig = {
  type: ClientStoreType
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const COLUMNS: ColumnConfig[] = [
  { type: "nacional", title: "Nacionais", icon: MapPin },
  { type: "global", title: "Globais", icon: Globe },
]

export function ClientStoresBlock({ initialStores }: { initialStores: ClientStoreEntry[] }) {
  const [stores, setStores] = useState<ClientStoreEntry[]>(initialStores)
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState<ClientStoreType>("nacional")
  const [form, setForm] = useState({ name: "", site: "", niche: "" })
  const [error, setError] = useState("")
  const [pendingDelete, setPendingDelete] = useState<ClientStoreEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  const openAdd = (type: ClientStoreType) => {
    setAddType(type)
    setForm({ name: "", site: "", niche: "" })
    setError("")
    setAddOpen(true)
  }

  const handleAdd = () => {
    if (!form.name.trim() || !form.site.trim() || !form.niche.trim()) {
      setError("Preencha todos os campos.")
      return
    }
    startTransition(async () => {
      const result = await createClientStore({
        name: form.name,
        site: form.site,
        niche: form.niche,
        type: addType,
      })
      if (result.success && result.store) {
        setStores((prev) => [...prev, result.store as ClientStoreEntry])
        setAddOpen(false)
      } else {
        setError(result.error || "Erro ao adicionar loja.")
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
        <h3 className="text-lg font-semibold text-foreground">Lojas de nossos clientes</h3>
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
                        <div className="min-w-0 flex-1 space-y-1">
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
                          <Badge className="border-teal-500/25 bg-teal-500/15 text-teal-400 hover:bg-teal-500/15">
                            {store.niche}
                          </Badge>
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
