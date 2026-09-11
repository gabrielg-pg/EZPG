"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Eye, EyeOff, Copy, Pencil, Trash2, Check, Gauge } from "lucide-react"
import {
  createPgDashAccount,
  updatePgDashAccount,
  deletePgDashAccount,
} from "@/app/actions/pg-dash-actions"

interface PgDashAccount {
  id: number
  brand_name: string
  login: string
  password: string
  notes: string
}

export function PgDashVault({ initialItems }: { initialItems: PgDashAccount[] }) {
  const [items, setItems] = useState<PgDashAccount[]>(initialItems)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PgDashAccount | null>(null)
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ brandName: "", login: "", password: "", notes: "" })
  const [loading, setLoading] = useState(false)

  const openCreate = () => {
    setEditingItem(null)
    setForm({ brandName: "", login: "", password: "", notes: "" })
    setModalOpen(true)
  }
  const openEdit = (item: PgDashAccount) => {
    setEditingItem(item)
    setForm({
      brandName: item.brand_name,
      login: item.login,
      password: item.password,
      notes: item.notes,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.brandName) return
    setLoading(true)
    if (editingItem) {
      const updated = await updatePgDashAccount(editingItem.id, form)
      setItems(items.map((i) => (i.id === editingItem.id ? (updated[0] as PgDashAccount) : i)))
    } else {
      const created = await createPgDashAccount(form)
      setItems([...items, created[0] as PgDashAccount])
    }
    setLoading(false)
    setModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deletePgDashAccount(id)
    setItems(items.filter((i) => i.id !== id))
  }

  const toggleReveal = (id: number) => {
    const next = new Set(revealedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setRevealedIds(next)
  }

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const filtered = search
    ? items.filter(
        (i) =>
          i.brand_name.toLowerCase().includes(search.toLowerCase()) ||
          i.login.toLowerCase().includes(search.toLowerCase()),
      )
    : items

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PG Dash</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">
            Controle das contas criadas no PG Dash por marca
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:from-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Contas</p>
          <p className="text-3xl font-bold text-white">{items.length}</p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por marca ou login..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-sidebar border-sidebar-border text-white max-w-sm placeholder:text-muted-foreground/50"
      />

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-sidebar-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground/50 italic">
            Nenhuma conta cadastrada. Clique em &quot;Nova Conta&quot; para adicionar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/25 rounded-xl p-4 space-y-3 group transition-all hover:scale-[1.01]"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{item.brand_name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-300 inline-block mt-1">
                    PG DASH
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-2">
                {item.login && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Login</p>
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1.5">
                      <p className="text-xs text-white font-mono flex-1 truncate">{item.login}</p>
                      <button
                        onClick={() => copyText(`login-${item.id}`, item.login)}
                        className="shrink-0 text-muted-foreground hover:text-white transition-colors"
                      >
                        {copiedField === `login-${item.id}` ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {item.password && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Senha</p>
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1.5">
                      <p className="text-xs text-white font-mono flex-1 truncate">
                        {revealedIds.has(item.id) ? item.password : "••••••••••••"}
                      </p>
                      <button
                        onClick={() => toggleReveal(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-white transition-colors"
                      >
                        {revealedIds.has(item.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => copyText(`pass-${item.id}`, item.password)}
                        className="shrink-0 text-muted-foreground hover:text-white transition-colors"
                      >
                        {copiedField === `pass-${item.id}` ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-muted-foreground/70 italic border-t border-white/5 pt-2">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              {editingItem ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome da Marca *</Label>
              <Input
                placeholder="Ex: Splash Mania"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Login / E-mail</Label>
              <Input
                placeholder="Ex: marca@progrowth.com"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Senha</Label>
              <Input
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notas</Label>
              <Input
                placeholder="Ex: dashboard do cliente, plano..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5 bg-transparent"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "A guardar..." : editingItem ? "Guardar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
