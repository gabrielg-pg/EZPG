"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  ShoppingBag,
  Image as ImageIcon,
  Target,
  Clapperboard,
  MonitorSmartphone,
  Pickaxe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createAccessCredential,
  updateAccessCredential,
  deleteAccessCredential,
  type AccessCredential,
} from "@/app/actions/access-actions"

// Ícone por nome de plataforma conhecida; contas novas usam KeyRound.
function iconFor(name: string): React.ComponentType<{ className?: string }> {
  const key = name.toLowerCase()
  if (key.includes("gmail") || key.includes("e-mail") || key.includes("email")) return Mail
  if (key.includes("shopify")) return ShoppingBag
  if (key.includes("zona")) return Pickaxe
  if (key.includes("magnific") || key.includes("poky") || key.includes("imag")) return ImageIcon
  if (key.includes("winninghunter") || key.includes("hunter")) return Target
  if (key.includes("capcut")) return Clapperboard
  if (key.includes("adspower")) return MonitorSmartphone
  return KeyRound
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignora falha de clipboard
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={`Copiar ${label}`}
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function CredentialField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const display = secret && !revealed ? "•".repeat(Math.min(value.length, 16)) : value
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-2">
        <span className={cn("flex-1 truncate text-sm text-foreground", secret && "font-mono tracking-wide")}>
          {display}
        </span>
        {secret && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        )}
        <CopyButton value={value} label={label} />
      </div>
    </div>
  )
}

type FormState = { name: string; login: string; password: string; site: string }
const EMPTY_FORM: FormState = { name: "", login: "", password: "", site: "" }

export function AccessCredentialsBlock({ initialCredentials }: { initialCredentials: AccessCredential[] }) {
  const [credentials, setCredentials] = useState<AccessCredential[]>(initialCredentials)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<AccessCredential | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AccessCredential | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setError("")
    setAddOpen(true)
  }

  const openEdit = (cred: AccessCredential) => {
    setForm({ name: cred.name, login: cred.login, password: cred.password, site: cred.site ?? "" })
    setError("")
    setEditing(cred)
  }

  const handleAdd = () => {
    if (!form.name.trim() || !form.login.trim() || !form.password.trim()) {
      setError("Preencha nome, login e senha.")
      return
    }
    startTransition(async () => {
      const result = await createAccessCredential({
        name: form.name,
        login: form.login,
        password: form.password,
        site: form.site,
      })
      if (result.success && result.credential) {
        setCredentials((prev) => [...prev, result.credential as AccessCredential])
        setAddOpen(false)
      } else {
        setError(result.error || "Erro ao adicionar conta.")
      }
    })
  }

  const handleEdit = () => {
    if (!editing) return
    if (!form.name.trim() || !form.login.trim() || !form.password.trim()) {
      setError("Preencha nome, login e senha.")
      return
    }
    const id = editing.id
    startTransition(async () => {
      const result = await updateAccessCredential(id, {
        name: form.name,
        login: form.login,
        password: form.password,
        site: form.site,
      })
      if (result.success && result.credential) {
        setCredentials((prev) => prev.map((c) => (c.id === id ? (result.credential as AccessCredential) : c)))
        setEditing(null)
      } else {
        setError(result.error || "Erro ao atualizar conta.")
      }
    })
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setCredentials((prev) => prev.filter((c) => c.id !== id))
    setPendingDelete(null)
    startTransition(async () => {
      await deleteAccessCredential(id)
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Acessos</h3>
        <Badge variant="outline" className="ml-1 border-teal-500/25 bg-teal-500/15 text-teal-400">
          {credentials.length} {credentials.length === 1 ? "plataforma" : "plataformas"}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={openAdd}
          className="ml-auto border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Adicionar conta
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {credentials.map((cred) => {
          const Icon = iconFor(cred.name)
          return (
            <Card key={cred.id} className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    {cred.name}
                  </CardTitle>
                  {cred.site && (
                    <a
                      href={cred.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Abrir
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CredentialField label="Login" value={cred.login} />
                <CredentialField label="Senha" value={cred.password} secret />
                <div className="flex items-center justify-end gap-1 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(cred)}
                    className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDelete(cred)}
                    aria-label={`Excluir ${cred.name}`}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal adicionar/editar conta */}
      <Dialog
        open={addOpen || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false)
            setEditing(null)
          }
        }}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {editing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editing ? "Editar conta" : "Adicionar conta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ac-name" className="text-sm text-muted-foreground">
                Nome da plataforma
              </Label>
              <Input
                id="ac-name"
                placeholder="Ex: Shopify"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-login" className="text-sm text-muted-foreground">
                Login / E-mail
              </Label>
              <Input
                id="ac-login"
                placeholder="Ex: contato@empresa.com"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-password" className="text-sm text-muted-foreground">
                Senha
              </Label>
              <Input
                id="ac-password"
                placeholder="Digite a senha"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-site" className="text-sm text-muted-foreground">
                Site (opcional)
              </Label>
              <Input
                id="ac-site"
                placeholder="Ex: https://plataforma.com"
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false)
                setEditing(null)
              }}
              disabled={isPending}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={editing ? handleEdit : handleAdd}
              disabled={isPending}
              className="bg-primary text-primary-foreground"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : editing ? (
                <Check className="mr-1.5 h-4 w-4" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              {editing ? "Salvar" : "Adicionar"}
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
              Excluir conta
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
