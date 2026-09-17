"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Eye, EyeOff, Copy, ExternalLink, Pencil, Trash2, Check, KeyRound } from "lucide-react"
import { createCofreItem, updateCofreItem, deleteCofreItem } from "@/app/actions/cofre-actions"

const CATEGORIES = [
  "DESIGN",
  "MINERAÇÃO",
  "MÍDIAS SOCIAIS",
  "E-MAILS",
  "ZONA DE EXECUÇÃO",
  "PRO GROWTH BR",
  "PRO GROWTH USA",
  "PG DASH",
]

const CATEGORY_STYLES: Record<string, { gradient: string; badge: string; accent: string }> = {
  DESIGN: { gradient: "from-pink-500/15 to-pink-500/5 border-pink-500/25", badge: "bg-pink-500/20 text-pink-300", accent: "bg-pink-500" },
  MINERAÇÃO: { gradient: "from-yellow-500/15 to-yellow-500/5 border-yellow-500/25", badge: "bg-yellow-500/20 text-yellow-300", accent: "bg-yellow-500" },
  "MÍDIAS SOCIAIS": { gradient: "from-blue-500/15 to-blue-500/5 border-blue-500/25", badge: "bg-blue-500/20 text-blue-300", accent: "bg-blue-500" },
  "E-MAILS": { gradient: "from-green-500/15 to-green-500/5 border-green-500/25", badge: "bg-green-500/20 text-green-300", accent: "bg-green-500" },
  "ZONA DE EXECUÇÃO": { gradient: "from-orange-500/15 to-orange-500/5 border-orange-500/25", badge: "bg-orange-500/20 text-orange-300", accent: "bg-orange-500" },
  "PRO GROWTH BR": { gradient: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/25", badge: "bg-emerald-500/20 text-emerald-300", accent: "bg-emerald-500" },
  "PRO GROWTH USA": { gradient: "from-indigo-500/15 to-indigo-500/5 border-indigo-500/25", badge: "bg-indigo-500/20 text-indigo-300", accent: "bg-indigo-500" },
  "PG DASH": { gradient: "from-purple-500/15 to-purple-500/5 border-purple-500/25", badge: "bg-purple-500/20 text-purple-300", accent: "bg-purple-500" },
}

interface CofreItem {
  id: number
  name: string
  login: string
  password: string
  site: string
  category: string
  notes: string
}

export function CofreVault({ initialItems }: { initialItems: CofreItem[] }) {
  const [items, setItems] = useState<CofreItem[]>(initialItems)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CofreItem | null>(null)
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set())
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ name: "", login: "", password: "", site: "", category: "", notes: "" })
  const [loading, setLoading] = useState(false)

  const openCreate = (category?: string) => {
    setEditingItem(null)
    setForm({ name: "", login: "", password: "", site: "", category: category || "", notes: "" })
    setModalOpen(true)
  }
  const openEdit = (item: CofreItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      login: item.login,
      password: item.password,
      site: item.site,
      category: item.category,
      notes: item.notes,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.category) return
    setLoading(true)
    if (editingItem) {
      const updated = await updateCofreItem(editingItem.id, form)
      setItems(items.map((i) => (i.id === editingItem.id ? (updated[0] as CofreItem) : i)))
    } else {
      const created = await createCofreItem(form)
      setItems([...items, created[0] as CofreItem])
    }
    setLoading(false)
    setModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    await deleteCofreItem(id)
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
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.login.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase()),
      )
    : items

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Cofre</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">Cofre de credenciais internas da PRO GROWTH GLOBAL</p>
        </div>
        <Button
          onClick={() => openCreate()}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:from-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Credencial
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Total de Credenciais</p>
          <p className="text-3xl font-bold text-white">{items.length}</p>
        </div>
        {CATEGORIES.slice(0, 3).map((cat) => (
          <div key={cat} className="bg-sidebar border border-sidebar-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1 truncate">{cat}</p>
            <p className="text-3xl font-bold text-white">{items.filter((i) => i.category === cat).length}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar credencial..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-sidebar border-sidebar-border text-white max-w-sm placeholder:text-muted-foreground/50"
      />

      {/* Categories */}
      {CATEGORIES.map((category) => {
        const catItems = filtered.filter((i) => i.category === category)
        const style = CATEGORY_STYLES[category]
        return (
          <div key={category} className="space-y-3">
            {/* Category header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${style.accent}`} />
                <h2 className="text-sm font-bold text-white tracking-widest">{category}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                  {catItems.length} {catItems.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openCreate(category)}
                className="text-xs text-muted-foreground hover:text-white hover:bg-white/5 h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {/* Cards */}
            {catItems.length === 0 ? (
              <div className="border border-dashed border-sidebar-border rounded-xl p-6 text-center">
                <p className="text-xs text-muted-foreground/50 italic">Nenhuma credencial nesta categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gradient-to-br ${style.gradient} border rounded-xl p-4 space-y-3 group transition-all hover:scale-[1.01]`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                        {item.site && (
                          <a
                            href={item.site.startsWith("http") ? item.site : `https://${item.site}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.site.replace(/^https?:\/\//, "").split("/")[0]}</span>
                          </a>
                        )}
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
          </div>
        )
      })}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              {editingItem ? "Editar Credencial" : "Nova Credencial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome *</Label>
                <Input
                  placeholder="Ex: Canva"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria *</Label>
                <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                  <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-sidebar border-sidebar-border text-white">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="focus:bg-white/10 focus:text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Site / URL</Label>
              <Input
                placeholder="Ex: canva.com"
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Login / E-mail</Label>
              <Input
                placeholder="Ex: admin@progrowth.com"
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
                placeholder="Ex: conta principal, 2FA ativo..."
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
