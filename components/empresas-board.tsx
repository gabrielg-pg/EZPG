"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  createEmpresa,
  updateEmpresa,
  duplicateEmpresa,
  deleteEmpresa,
  type Empresa,
  type EmpresaInput,
} from "@/app/actions/empresa-actions"
import {
  Building2,
  Plus,
  MoreVertical,
  Pencil,
  Copy,
  Eye,
  Trash2,
  Loader2,
  Check,
  X,
  KeyRound,
  Calendar,
  User,
  CircleCheck,
  CircleX,
} from "lucide-react"

/* ---------------- Toast system (self-contained) ---------------- */
type ToastType = "success" | "error" | "info"
interface ToastItem {
  id: number
  message: string
  type: ToastType
}

function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  const style: Record<ToastType, { border: string; icon: ReactNode }> = {
    success: {
      border: "border-l-[#10b981]",
      icon: <CircleCheck className="h-5 w-5 text-[#10b981]" />,
    },
    error: {
      border: "border-l-red-500",
      icon: <CircleX className="h-5 w-5 text-red-500" />,
    },
    info: {
      border: "border-l-[#a855f7]",
      icon: <Building2 className="h-5 w-5 text-[#a855f7]" />,
    },
  }
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 border-border bg-card p-3 shadow-lg",
            "animate-in slide-in-from-right-4 fade-in duration-300",
            style[t.type].border,
          )}
        >
          <span className="mt-0.5 shrink-0">{style[t.type].icon}</span>
          <p className="flex-1 text-sm text-foreground">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Helpers ---------------- */
function toISODate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function formatDate(value: string | Date): string {
  const iso = toISODate(value)
  const [y, m, d] = iso.split("-")
  if (y && m && d) return `${d}/${m}/${y}`
  return iso
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return "—"
  const dt = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(dt.getTime())) return "—"
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Progresso real: completude do cadastro da empresa.
function computeProgress(e: Empresa): number {
  let filled = 0
  const total = 5
  if (e.nome && e.nome.trim().length >= 3) filled++
  if (e.login && e.login.trim().length > 0) filled++
  if (e.senha && e.senha.length > 0) filled++
  if (e.data_abertura) filled++
  if (e.apresentacao && e.apresentacao.trim().length > 0) filled++
  return Math.round((filled / total) * 100)
}

const emptyForm: EmpresaInput = {
  nome: "",
  login: "",
  senha: "",
  dataAbertura: "",
  apresentacao: "",
  ativo: true,
}

/* ---------------- Main component ---------------- */
export function EmpresasBoard({ initialEmpresas }: { initialEmpresas: Empresa[] }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(initialEmpresas)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [isPending, startTransition] = useTransition()

  // Modais
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<EmpresaInput>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [showFormPassword, setShowFormPassword] = useState(false)

  const [viewing, setViewing] = useState<Empresa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null)

  // Senha visível por card (id -> bool)
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setEmpresas(initialEmpresas)
  }, [initialEmpresas])

  function pushToast(message: string, type: ToastType) {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowFormPassword(false)
    setFormOpen(true)
  }

  function openEdit(e: Empresa) {
    setEditingId(e.id)
    setForm({
      nome: e.nome,
      login: e.login,
      senha: e.senha,
      dataAbertura: toISODate(e.data_abertura),
      apresentacao: e.apresentacao,
      ativo: e.ativo,
    })
    setFormError(null)
    setShowFormPassword(false)
    setFormOpen(true)
  }

  // Validação no cliente antes de enviar (o servidor revalida).
  function validateClient(data: EmpresaInput): string | null {
    const nome = data.nome.trim()
    if (nome.length < 3 || nome.length > 100) return "O nome deve ter entre 3 e 100 caracteres."
    if (!data.login.trim()) return "Informe o login."
    if (!data.senha) return "Informe a senha."
    if (!data.dataAbertura) return "Informe a data de abertura."
    const abertura = new Date(data.dataAbertura)
    if (Number.isNaN(abertura.getTime())) return "Data de abertura inválida."
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (abertura.getTime() > today.getTime()) return "A data de abertura deve estar no passado."
    if ((data.apresentacao ?? "").length > 500) return "A apresentação deve ter no máximo 500 caracteres."
    return null
  }

  function submitForm() {
    const err = validateClient(form)
    if (err) {
      setFormError(err)
      return
    }
    setFormError(null)
    startTransition(async () => {
      const result = editingId
        ? await updateEmpresa(editingId, form)
        : await createEmpresa(form)
      if (result.success && result.empresa) {
        if (editingId) {
          setEmpresas((prev) => prev.map((e) => (e.id === editingId ? result.empresa! : e)))
          pushToast("Empresa atualizada com sucesso.", "success")
        } else {
          setEmpresas((prev) => [result.empresa!, ...prev])
          pushToast("Empresa criada com sucesso.", "success")
        }
        setFormOpen(false)
      } else {
        setFormError(result.error ?? "Erro ao salvar.")
      }
    })
  }

  function handleDuplicate(e: Empresa) {
    startTransition(async () => {
      const result = await duplicateEmpresa(e.id)
      if (result.success && result.empresa) {
        setEmpresas((prev) => [result.empresa!, ...prev])
        pushToast("Empresa duplicada.", "info")
      } else {
        pushToast(result.error ?? "Erro ao duplicar.", "error")
      }
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      const result = await deleteEmpresa(target.id)
      if (result.success) {
        setEmpresas((prev) => prev.filter((e) => e.id !== target.id))
        pushToast("Empresa removida.", "success")
      } else {
        pushToast(result.error ?? "Erro ao remover.", "error")
      }
      setDeleteTarget(null)
    })
  }

  const apresentacaoLen = form.apresentacao?.length ?? 0

  return (
    <div className="space-y-6">
      <Toasts items={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#a855f7]/15 text-[#a855f7]">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
            <p className="text-sm text-muted-foreground">Gerenciar e acompanhar suas empresas</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#a855f7] text-white hover:bg-[#9333ea]"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Empty state */}
      {empresas.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#a855f7]/10 text-[#a855f7]">
              <Building2 className="h-8 w-8" />
            </span>
            <p className="text-base font-medium text-foreground">Nenhuma empresa criada</p>
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Nova Empresa&quot; para começar.
            </p>
            <Button onClick={openCreate} className="mt-2 gap-2 bg-[#a855f7] text-white hover:bg-[#9333ea]">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((e) => {
            const progress = computeProgress(e)
            const isRevealed = revealed[e.id]
            return (
              <Card
                key={e.id}
                className="group flex flex-col border-border bg-card transition-all duration-200 animate-in fade-in hover:border-[#a855f7]/40 hover:shadow-lg hover:shadow-[#a855f7]/5"
              >
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  {/* Top: nome + status + menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-foreground" title={e.nome}>
                        {e.nome}
                      </h3>
                      <span
                        className={cn(
                          "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                          e.ativo
                            ? "border-[#10b981]/30 bg-[#10b981]/15 text-[#10b981]"
                            : "border-border bg-muted text-muted-foreground",
                        )}
                      >
                        {e.ativo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {e.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          aria-label="Ações"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(e)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(e)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewing(e)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver completo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(e)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Credenciais */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate" title={e.login}>
                        {e.login}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <KeyRound className="h-4 w-4 shrink-0" />
                      <span className="font-mono">
                        {isRevealed ? e.senha || "—" : "••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRevealed((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                        className="ml-auto text-muted-foreground transition-colors hover:text-[#a855f7]"
                        aria-label={isRevealed ? "Ocultar senha" : "Mostrar senha"}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{formatDate(e.data_abertura)}</span>
                    </div>
                  </div>

                  {/* Apresentação */}
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {e.apresentacao
                      ? e.apresentacao.length > 100
                        ? `${e.apresentacao.slice(0, 100)}…`
                        : e.apresentacao
                      : "Sem apresentação."}
                  </p>

                  {/* Progresso */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Cadastro completo</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2 bg-muted [&>div]:bg-[#a855f7]"
                    />
                  </div>

                  {/* Ação principal */}
                  <Button
                    onClick={() => openEdit(e)}
                    variant="outline"
                    className="mt-auto w-full gap-2 border-[#a855f7]/40 text-[#a855f7] hover:bg-[#a855f7]/10 hover:text-[#a855f7]"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize os dados da empresa e salve as alterações."
                : "Preencha os dados para cadastrar uma nova empresa."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-nome">
                Nome da Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emp-nome"
                value={form.nome}
                maxLength={100}
                onChange={(ev) => setForm((f) => ({ ...f, nome: ev.target.value }))}
                placeholder="Ex.: Pro Growth Global"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emp-login">
                  Login <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emp-login"
                  value={form.login}
                  onChange={(ev) => setForm((f) => ({ ...f, login: ev.target.value }))}
                  placeholder="email ou usuário"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-senha">
                  Senha <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="emp-senha"
                    type={showFormPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={(ev) => setForm((f) => ({ ...f, senha: ev.target.value }))}
                    placeholder="••••••"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showFormPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-data">
                Data de Abertura <span className="text-red-500">*</span>
              </Label>
              <Input
                id="emp-data"
                type="date"
                value={form.dataAbertura}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(ev) => setForm((f) => ({ ...f, dataAbertura: ev.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="emp-apresentacao">Apresentação</Label>
                <span className="text-xs text-muted-foreground">{apresentacaoLen}/500</span>
              </div>
              <Textarea
                id="emp-apresentacao"
                value={form.apresentacao}
                maxLength={500}
                rows={4}
                onChange={(ev) => setForm((f) => ({ ...f, apresentacao: ev.target.value }))}
                placeholder="Breve descrição da empresa…"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={form.ativo}
                onCheckedChange={(c) => setForm((f) => ({ ...f, ativo: c === true }))}
              />
              <span className="text-sm text-foreground">Ativar Empresa</span>
            </label>

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <CircleX className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={submitForm}
              disabled={isPending}
              className="gap-2 bg-[#a855f7] text-white hover:bg-[#9333ea]"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal ver completo */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#a855f7]" />
                  {viewing.nome}
                </DialogTitle>
                <DialogDescription>Detalhes completos da empresa.</DialogDescription>
              </DialogHeader>
              <dl className="space-y-3 py-2 text-sm">
                <ViewRow label="Status">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      viewing.ativo
                        ? "border-[#10b981]/30 bg-[#10b981]/15 text-[#10b981]"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {viewing.ativo ? "Ativo" : "Inativo"}
                  </span>
                </ViewRow>
                <ViewRow label="Login">{viewing.login}</ViewRow>
                <ViewRow label="Senha">
                  <span className="font-mono">{viewing.senha || "—"}</span>
                </ViewRow>
                <ViewRow label="Data de abertura">{formatDate(viewing.data_abertura)}</ViewRow>
                <ViewRow label="Apresentação">
                  <span className="whitespace-pre-wrap">
                    {viewing.apresentacao || "Sem apresentação."}
                  </span>
                </ViewRow>
                <ViewRow label="Criada em">{formatDateTime(viewing.created_at)}</ViewRow>
                <ViewRow label="Última edição">
                  {viewing.updated_at ? formatDateTime(viewing.updated_at) : "Nunca editada"}
                </ViewRow>
              </dl>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    const target = viewing
                    setViewing(null)
                    if (target) openEdit(target)
                  }}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button onClick={() => setViewing(null)} className="bg-[#a855f7] text-white hover:bg-[#9333ea]">
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A empresa{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.nome}</span> será
              removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(ev) => {
                ev.preventDefault()
                confirmDelete()
              }}
              disabled={isPending}
              className="gap-2 bg-red-500 text-white hover:bg-red-600"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ViewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 pb-2 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-foreground">{children}</dd>
    </div>
  )
}
