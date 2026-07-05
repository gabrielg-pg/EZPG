"use client"

import { useState, useMemo, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Plus, Mail, Phone, Pencil, Trash2, GripVertical, CalendarDays, UserCog, MessageSquareText } from "lucide-react"
import { toast } from "sonner"
import { formatDateBR } from "@/lib/date"
import {
  createContact,
  updateContact,
  moveContact,
  deleteContact,
  type CrmContact,
  type CrmStage,
} from "@/app/actions/crm-actions"

interface CrmBoardProps {
  initialContacts: CrmContact[]
  stages: CrmStage[]
}

type FormState = {
  name: string
  email: string
  phone: string
  stage_id: number
  interest_reason: string
  notes: string
  responsible: string
  form_submitted_at: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(stageId: number): FormState {
  return {
    name: "",
    email: "",
    phone: "",
    stage_id: stageId,
    interest_reason: "",
    notes: "",
    responsible: "",
    form_submitted_at: todayISO(),
  }
}

export function CrmBoard({ initialContacts, stages }: CrmBoardProps) {
  const [contacts, setContacts] = useState<CrmContact[]>(initialContacts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(stages[0]?.id ?? 0))
  const [deleteTarget, setDeleteTarget] = useState<CrmContact | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverStage, setDragOverStage] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const contactsByStage = useMemo(() => {
    const map: Record<number, CrmContact[]> = {}
    for (const stage of stages) map[stage.id] = []
    for (const c of contacts) {
      if (c.stage_id && map[c.stage_id]) map[c.stage_id].push(c)
    }
    return map
  }, [contacts, stages])

  const openCreate = (stageId: number) => {
    setEditingId(null)
    setForm(emptyForm(stageId))
    setDialogOpen(true)
  }

  const openEdit = (contact: CrmContact) => {
    setEditingId(contact.id)
    setForm({
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      stage_id: contact.stage_id ?? stages[0]?.id ?? 0,
      interest_reason: contact.interest_reason ?? "",
      notes: contact.notes ?? "",
      responsible: contact.responsible ?? "",
      form_submitted_at: contact.form_submitted_at
        ? contact.form_submitted_at.slice(0, 10)
        : todayISO(),
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome completo do candidato")
      return
    }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      stage_id: form.stage_id,
      interest_reason: form.interest_reason,
      notes: form.notes,
      responsible: form.responsible,
      form_submitted_at: form.form_submitted_at || undefined,
    }

    startTransition(async () => {
      const result = editingId
        ? await updateContact(editingId, payload)
        : await createContact(payload)

      if (!result.success) {
        toast.error(result.error ?? "Erro ao salvar")
        return
      }

      if (editingId) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  ...payload,
                  email: payload.email || null,
                  phone: payload.phone || null,
                  interest_reason: payload.interest_reason || null,
                  notes: payload.notes || null,
                  responsible: payload.responsible || null,
                  form_submitted_at: payload.form_submitted_at ?? null,
                }
              : c,
          ),
        )
      } else {
        setContacts((prev) => [
          {
            id: Math.max(0, ...prev.map((p) => p.id)) + 1,
            name: payload.name,
            stage_id: payload.stage_id,
            email: payload.email || null,
            phone: payload.phone || null,
            interest_reason: payload.interest_reason || null,
            notes: payload.notes || null,
            responsible: payload.responsible || null,
            form_submitted_at: payload.form_submitted_at ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      toast.success(editingId ? "Candidato atualizado" : "Candidato adicionado")
      setDialogOpen(false)
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    startTransition(async () => {
      const result = await deleteContact(id)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir")
        return
      }
      setContacts((prev) => prev.filter((c) => c.id !== id))
      toast.success("Candidato excluído")
      setDeleteTarget(null)
    })
  }

  const handleDrop = (stageId: number) => {
    if (dragId == null) return
    const id = dragId
    const current = contacts.find((c) => c.id === id)
    setDragId(null)
    setDragOverStage(null)
    if (!current || current.stage_id === stageId) return

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage_id: stageId } : c)),
    )
    startTransition(async () => {
      const result = await moveContact(id, stageId)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao mover candidato")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CRM de Parceiros</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe o funil de recrutamento, do formulário de interesse até o parceiro ativo.
          </p>
        </div>
        <Button onClick={() => openCreate(stages[0]?.id ?? 0)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo candidato
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageContacts = contactsByStage[stage.id] ?? []
          const isOver = dragOverStage === stage.id
          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-2xl border transition-colors ${
                isOver ? "border-primary bg-primary/5" : "border-border bg-white/[0.02]"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStage(stage.id)
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-semibold text-foreground text-sm">{stage.name}</span>
                  <span className="text-xs text-muted-foreground">({stageContacts.length})</span>
                </div>
                <button
                  onClick={() => openCreate(stage.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Adicionar candidato em ${stage.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 space-y-3 min-h-[120px]">
                {stageContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    draggable
                    onDragStart={() => setDragId(contact.id)}
                    onDragEnd={() => {
                      setDragId(null)
                      setDragOverStage(null)
                    }}
                    className="glass-card cursor-grab active:cursor-grabbing group"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {contact.name}
                            </p>
                            {contact.form_submitted_at && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <CalendarDays className="h-3 w-3 shrink-0" />
                                {formatDateBR(contact.form_submitted_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(contact)}
                            className="text-muted-foreground hover:text-foreground p-1"
                            aria-label="Editar candidato"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(contact)}
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label="Excluir candidato"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1 pl-6">
                        {contact.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {contact.email}
                          </p>
                        )}
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Phone className="h-3 w-3 shrink-0" />
                            {contact.phone}
                          </p>
                        )}
                        {contact.interest_reason && (
                          <p className="text-xs text-muted-foreground flex items-start gap-1">
                            <MessageSquareText className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{contact.interest_reason}</span>
                          </p>
                        )}
                        {contact.responsible && (
                          <p className="text-xs flex items-center gap-1 truncate text-primary">
                            <UserCog className="h-3 w-3 shrink-0" />
                            {contact.responsible}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar candidato" : "Novo candidato"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo do candidato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form_date">Data de envio do formulário</Label>
              <Input
                id="form_date"
                type="date"
                value={form.form_submitted_at}
                onChange={(e) => setForm({ ...form, form_submitted_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                placeholder="Quem está cuidando"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="stage">Etapa do funil</Label>
              <Select
                value={String(form.stage_id)}
                onValueChange={(v) => setForm({ ...form, stage_id: Number(v) })}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="interest">Motivo de interesse em ser parceiro</Label>
              <Textarea
                id="interest"
                value={form.interest_reason}
                onChange={(e) => setForm({ ...form, interest_reason: e.target.value })}
                rows={3}
                placeholder="Texto informado no formulário do site"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Observações da equipe durante a avaliação"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir candidato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O candidato &quot;{deleteTarget?.name}&quot; será
              removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
