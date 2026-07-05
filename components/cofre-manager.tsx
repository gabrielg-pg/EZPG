"use client"

import { useMemo, useState, useTransition } from "react"
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  createCredential,
  updateCredential,
  deleteCredential,
  type Credential,
} from "@/app/actions/cofre-actions"

// Paleta de acentos por categoria (tonalidades derivadas do tema AEESJB)
const CATEGORY_ACCENTS = [
  { dot: "#DC2626", tint: "rgba(220, 38, 38, 0.12)", border: "rgba(220, 38, 38, 0.35)" },
  { dot: "#EA580C", tint: "rgba(234, 88, 12, 0.12)", border: "rgba(234, 88, 12, 0.35)" },
  { dot: "#D97706", tint: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.35)" },
  { dot: "#B91C1C", tint: "rgba(185, 28, 28, 0.14)", border: "rgba(185, 28, 28, 0.4)" },
  { dot: "#9F1239", tint: "rgba(159, 18, 57, 0.14)", border: "rgba(159, 18, 57, 0.4)" },
  { dot: "#C2410C", tint: "rgba(194, 65, 12, 0.12)", border: "rgba(194, 65, 12, 0.35)" },
]

function accentForCategory(index: number) {
  return CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length]
}

type FormState = {
  name: string
  category: string
  url: string
  login: string
  password: string
  notes: string
}

const emptyForm: FormState = {
  name: "",
  category: "",
  url: "",
  login: "",
  password: "",
  notes: "",
}

export function CofreManager({ initialCredentials }: { initialCredentials: Credential[] }) {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null)
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categories = useMemo(() => {
    const set = new Set<string>()
    credentials.forEach((c) => set.add(c.category))
    return Array.from(set)
  }, [credentials])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return credentials
    return credentials.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.login ?? "").toLowerCase().includes(q) ||
        (c.url ?? "").toLowerCase().includes(q),
    )
  }, [credentials, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Credential[]>()
    filtered.forEach((c) => {
      const list = map.get(c.category) ?? []
      list.push(c)
      map.set(c.category, list)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    credentials.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1))
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [credentials])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(c: Credential) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      category: c.category,
      url: c.url ?? "",
      login: c.login ?? "",
      password: c.password ?? "",
      notes: c.notes ?? "",
    })
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Informe o nome da credencial")
      return
    }
    startTransition(async () => {
      const payload = {
        name: form.name,
        category: form.category.trim() || "Geral",
        url: form.url,
        login: form.login,
        password: form.password,
        notes: form.notes,
      }
      const result = editingId
        ? await updateCredential(editingId, payload)
        : await createCredential(payload)

      if (!result.success) {
        toast.error(result.error ?? "Erro ao salvar")
        return
      }

      if (editingId) {
        setCredentials((prev) => prev.map((c) => (c.id === editingId ? result.credential : c)))
        toast.success("Credencial atualizada")
      } else {
        setCredentials((prev) => [...prev, result.credential])
        toast.success("Credencial adicionada")
      }
      setDialogOpen(false)
      setForm(emptyForm)
      setEditingId(null)
    })
  }

  function handleDelete(c: Credential) {
    startTransition(async () => {
      const result = await deleteCredential(c.id)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir")
        return
      }
      setCredentials((prev) => prev.filter((x) => x.id !== c.id))
      toast.success("Credencial excluída")
      setDeleteTarget(null)
    })
  }

  async function copyValue(value: string | null, key: string) {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cofre</h1>
            <p className="text-sm text-muted-foreground">
              Cofre de credenciais internas da AEESJB
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          Nova Credencial
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total de Credenciais
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">{credentials.length}</p>
        </div>
        {categoryCounts.slice(0, 3).map(({ category, count }, i) => {
          const accent = accentForCategory(i)
          return (
            <div key={category} className="rounded-xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent.dot }} />
                {category}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{count}</p>
            </div>
          )
        })}
        {categoryCounts.length < 3 &&
          Array.from({ length: 3 - categoryCounts.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-xl border border-dashed border-border/60 bg-card/40 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Categoria
              </p>
              <p className="mt-2 text-3xl font-bold text-muted-foreground/40">0</p>
            </div>
          ))}
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar credencial..."
          className="pl-9"
        />
      </div>

      {/* Grupos por categoria */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 py-16 text-center">
          <KeyRound className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            {search ? "Nenhuma credencial encontrada" : "Nenhuma credencial cadastrada"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Tente outro termo de busca."
              : 'Clique em "Nova Credencial" para começar. As categorias aparecem automaticamente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items], groupIndex) => {
            const accent = accentForCategory(groupIndex)
            return (
              <section key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: accent.dot }}
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {category}
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length} {items.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((c) => {
                    const isRevealed = revealed[c.id] ?? false
                    return (
                      <div
                        key={c.id}
                        className="group relative overflow-hidden rounded-xl border p-5"
                        style={{
                          borderColor: accent.border,
                          background: `linear-gradient(135deg, ${accent.tint}, transparent 70%)`,
                        }}
                      >
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground">{c.name}</h3>
                            {c.url && (
                              <a
                                href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span className="truncate">{c.url}</span>
                              </a>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Editar credencial"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(c)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Excluir credencial"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Login */}
                        <div className="mb-3">
                          <p className="mb-1 text-xs text-muted-foreground">Login</p>
                          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                            <span className="truncate font-mono text-sm text-foreground">
                              {c.login || "—"}
                            </span>
                            {c.login && (
                              <button
                                type="button"
                                onClick={() => copyValue(c.login, `login-${c.id}`)}
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label="Copiar login"
                              >
                                {copiedKey === `login-${c.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Senha */}
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Senha</p>
                          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                            <span className="truncate font-mono text-sm text-foreground">
                              {c.password ? (isRevealed ? c.password : "•".repeat(12)) : "—"}
                            </span>
                            {c.password && (
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealed((prev) => ({ ...prev, [c.id]: !isRevealed }))
                                  }
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label={isRevealed ? "Ocultar senha" : "Mostrar senha"}
                                >
                                  {isRevealed ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyValue(c.password, `pass-${c.id}`)}
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label="Copiar senha"
                                >
                                  {copiedKey === `pass-${c.id}` ? (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {c.notes && <p className="mt-3 text-xs text-muted-foreground">{c.notes}</p>}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar credencial" : "Nova credencial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cred-name">Nome</Label>
              <Input
                id="cred-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Figma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-category">Categoria</Label>
              <Input
                id="cred-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Design"
                list="cofre-categorias"
              />
              <datalist id="cofre-categorias">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Digite uma categoria nova ou escolha uma existente. O grupo é criado automaticamente.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-url">Site (opcional)</Label>
              <Input
                id="cred-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="www.exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-login">Login</Label>
              <Input
                id="cred-login"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-password">Senha</Label>
              <Input
                id="cred-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cred-notes">Observações (opcional)</Label>
              <Textarea
                id="cred-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notas adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir credencial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.name}&quot;? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) handleDelete(deleteTarget)
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
