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
import { Plus, Building2, Mail, Phone, Pencil, Trash2, GripVertical } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"
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
  company: string
  email: string
  phone: string
  stage_id: number
  value: string
  notes: string
}

function emptyForm(stageId: number): FormState {
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    stage_id: stageId,
    value: "",
    notes: "",
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
      company: contact.company ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      stage_id: contact.stage_id ?? stages[0]?.id ?? 0,
      value: contact.value ? String(contact.value) : "",
      notes: contact.notes ?? "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      company: form.company,
      email: form.email,
      phone: form.phone,
      stage_id: form.stage_id,
      value: form.value ? Number(form.value) : 0,
      notes: form.notes,
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
            c.id === editingId ? { ...c, ...payload, value: payload.value } : c,
          ),
        )
      } else {
        // recarrega otimisticamente com id temporário; refresh do server virá via revalidate
        setContacts((prev) => [
          {
            id: Math.max(0, ...prev.map((p) => p.id)) + 1,
            ...payload,
            company: payload.company || null,
            email: payload.email || null,
            phone: payload.phone || null,
            notes: payload.notes || null,
            owner_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      toast.success(editingId ? "Contato atualizado" : "Contato criado")
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
      toast.success("Contato excluído")
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
        toast.error(result.error ?? "Erro ao mover contato")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CRM</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus contatos e acompanhe o funil de vendas.
          </p>
        </div>
        <Button onClick={() => openCreate(stages[0]?.id ?? 0)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageContacts = contactsByStage[stage.id] ?? []
          const total = stageContacts.reduce((acc, c) => acc + Number(c.value || 0), 0)
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
                  aria-label={`Adicionar contato em ${stage.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 space-y-3 min-h-[120px]">
                {total > 0 && (
                  <p className="text-xs text-muted-foreground px-1">
                    Total: <span className="text-foreground font-medium">{formatCurrency(total)}</span>
                  </p>
                )}
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
                            {contact.company && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {contact.company}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(contact)}
                            className="text-muted-foreground hover:text-foreground p-1"
                            aria-label="Editar contato"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(contact)}
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label="Excluir contato"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {(contact.email || contact.phone) && (
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
                        </div>
                      )}

                      {Number(contact.value) > 0 && (
                        <p className="mt-2 pl-6 text-sm font-semibold text-primary">
                          {formatCurrency(contact.value)}
                        </p>
                      )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar contato" : "Novo contato"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
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
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="stage">Estágio</Label>
              <Select
                value={String(form.stage_id)}
                onValueChange={(v) => setForm({ ...form, stage_id: Number(v) })}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Selecione o estágio" />
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
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
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
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contato &quot;{deleteTarget?.name}&quot; será
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
