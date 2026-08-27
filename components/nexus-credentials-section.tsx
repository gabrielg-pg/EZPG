"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  KeyRound,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Lock,
} from "lucide-react"
import type { NexusCredential } from "@/lib/nexus"
import {
  createNexusCredential,
  updateNexusCredential,
  deleteNexusCredential,
  revealNexusPassword,
} from "@/app/actions/nexus-actions"

type SelectableUser = { id: number; name: string }

export function NexusCredentialsSection({
  credentials,
  users,
  isAdmin,
  onChanged,
}: {
  credentials: NexusCredential[]
  users: SelectableUser[]
  isAdmin: boolean
  onChanged: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NexusCredential | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NexusCredential | null>(null)
  const [isPending, startTransition] = useTransition()

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: NexusCredential) => {
    setEditing(c)
    setDialogOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      await deleteNexusCredential(deleteTarget.id)
      setDeleteTarget(null)
      onChanged()
    })
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Acessos</h2>
            <p className="text-sm text-muted-foreground">
              Credenciais das redes sociais e ferramentas
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar conta
          </Button>
        )}
      </div>

      {credentials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum acesso cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {credentials.map((c) => (
            <CredentialCard key={c.id} credential={c} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {isAdmin && (
        <CredentialDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
          users={users}
          onSaved={onChanged}
        />
      )}

      {/* Confirmação de exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Excluir acesso</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o acesso{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.platform_name}</span>? Esta ação não
            pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function CredentialCard({
  credential,
  isAdmin,
  onEdit,
  onDelete,
}: {
  credential: NexusCredential
  isAdmin: boolean
  onEdit: (c: NexusCredential) => void
  onDelete: (c: NexusCredential) => void
}) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const [loadingReveal, setLoadingReveal] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* noop */
    }
  }

  const toggleReveal = async () => {
    if (revealed !== null) {
      setRevealed(null)
      return
    }
    setLoadingReveal(true)
    const res = await revealNexusPassword(credential.id)
    setLoadingReveal(false)
    if (res.success) {
      setRevealed(res.password ?? "")
    }
  }

  const copyPassword = async () => {
    if (revealed !== null) {
      copy("password", revealed)
      return
    }
    // busca sob demanda e copia sem exibir
    const res = await revealNexusPassword(credential.id)
    if (res.success && res.password !== undefined) {
      copy("password", res.password)
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground text-balance">{credential.platform_name}</h3>
        {credential.platform_url && (
          <a
            href={credential.platform_url.startsWith("http") ? credential.platform_url : `https://${credential.platform_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
            title="Abrir plataforma"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="space-y-3">
        {/* Login */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Login</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm text-foreground">{credential.username || "—"}</span>
            {credential.username && (
              <button
                type="button"
                onClick={() => copy("login", credential.username)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                title="Copiar login"
              >
                {copied === "login" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Senha */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Senha</p>
          {credential.can_reveal ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-mono text-sm text-foreground">
                {loadingReveal ? "•••••••" : revealed !== null ? revealed || "—" : "••••••••••••"}
              </span>
              <button
                type="button"
                onClick={toggleReveal}
                className="text-muted-foreground transition-colors hover:text-foreground"
                title={revealed !== null ? "Ocultar senha" : "Mostrar senha"}
              >
                {loadingReveal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : revealed !== null ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={copyPassword}
                className="text-muted-foreground transition-colors hover:text-foreground"
                title="Copiar senha"
              >
                {copied === "password" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Sem permissão para visualizar
            </div>
          )}
        </div>

        {credential.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{credential.notes}</p>
        )}
      </div>

      {isAdmin && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onEdit(credential)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-red-400 hover:text-red-300"
            onClick={() => onDelete(credential)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      )}
    </div>
  )
}

function CredentialDialog({
  open,
  onOpenChange,
  editing,
  users,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: NexusCredential | null
  users: SelectableUser[]
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    platform_name: "",
    platform_url: "",
    username: "",
    password: "",
    notes: "",
    authorized_user_ids: [] as number[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initializedFor, setInitializedFor] = useState<number | null>(-1)

  // Sincroniza o form quando abre com um alvo diferente.
  const targetId = editing?.id ?? 0
  if (open && initializedFor !== targetId) {
    setInitializedFor(targetId)
    setError(null)
    if (editing) {
      setForm({
        platform_name: editing.platform_name,
        platform_url: editing.platform_url,
        username: editing.username,
        password: "",
        notes: editing.notes,
        authorized_user_ids: editing.authorized_user_ids,
      })
    } else {
      setForm({
        platform_name: "",
        platform_url: "",
        username: "",
        password: "",
        notes: "",
        authorized_user_ids: [],
      })
    }
  }
  if (!open && initializedFor !== -1) {
    setInitializedFor(-1)
  }

  const toggleUser = (id: number) => {
    setForm((f) => ({
      ...f,
      authorized_user_ids: f.authorized_user_ids.includes(id)
        ? f.authorized_user_ids.filter((x) => x !== id)
        : [...f.authorized_user_ids, id],
    }))
  }

  const handleSave = async () => {
    if (!form.platform_name.trim()) {
      setError("Informe o nome da plataforma")
      return
    }
    setSaving(true)
    setError(null)
    const res = editing
      ? await updateNexusCredential(editing.id, {
          ...form,
          changePassword: form.password.trim().length > 0,
        })
      : await createNexusCredential(form)
    setSaving(false)
    if (res.success) {
      onOpenChange(false)
      onSaved()
    } else {
      setError(res.error ?? "Erro ao salvar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar acesso" : "Adicionar conta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="cred-name">Nome da plataforma</Label>
            <Input
              id="cred-name"
              value={form.platform_name}
              onChange={(e) => setForm((f) => ({ ...f, platform_name: e.target.value }))}
              placeholder="Instagram Pro Growth"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cred-url">URL</Label>
            <Input
              id="cred-url"
              value={form.platform_url}
              onChange={(e) => setForm((f) => ({ ...f, platform_url: e.target.value }))}
              placeholder="https://instagram.com/"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cred-login">Login</Label>
            <Input
              id="cred-login"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="hello@progrowthglobal.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cred-pass">Senha {editing && <span className="text-muted-foreground">(deixe em branco para manter)</span>}</Label>
            <Input
              id="cred-pass"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cred-notes">Observações</Label>
            <Textarea
              id="cred-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Quem pode acessar?</Label>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
              {users.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">Nenhum usuário disponível.</p>
              ) : (
                users.map((u) => {
                  const active = form.authorized_user_ids.includes(u.id)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      {u.name}
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  )
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários autorizados podem visualizar e revelar a senha deste acesso.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.platform_name.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
