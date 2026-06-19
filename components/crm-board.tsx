"use client"

import type React from "react"
import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  CalendarDays,
  User,
  Tag,
  Radio,
  ArrowRight,
  Trash2,
  Pencil,
  Store,
  TrendingUp,
  CheckCircle2,
  Percent,
} from "lucide-react"
import {
  createCrmLead,
  updateCrmLead,
  moveCrmLead,
  deleteCrmLead,
} from "@/app/actions/crm-actions"

type Lead = {
  id: number
  nome: string
  plano: string
  origem: string
  data_reuniao: string | null
  responsavel: string
  observacoes: string
  etapa: string
  motivo_perda: string | null
  created_at: string
  updated_at: string
}

const STAGES = [
  { id: "reuniao_agendada", label: "Reunião Agendada", color: "border-t-blue-500" },
  { id: "reuniao_realizada", label: "Reunião Realizada", color: "border-t-cyan-500" },
  { id: "proposta_enviada", label: "Proposta Enviada", color: "border-t-amber-500" },
  { id: "fechado", label: "Fechado", color: "border-t-emerald-500" },
  { id: "perdido", label: "Perdido", color: "border-t-red-500" },
]

const PLANOS = ["Start Growth", "Pro Vértebra", "Scale Vértebra", "Scale Global"]
const ORIGENS = ["Instagram", "YouTube", "Indicação", "Tráfego Pago"]
const MOTIVOS_PERDA = ["Preço", "Desconfiança", "Sem urgência", "Sem capital", "Outro"]

const PLANO_COLORS: Record<string, string> = {
  "Start Growth": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Pro Vértebra": "bg-primary/15 text-primary border-primary/30",
  "Scale Vértebra": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Scale Global": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
}

const emptyForm = {
  nome: "",
  plano: PLANOS[0],
  origem: ORIGENS[0],
  data_reuniao: "",
  responsavel: "",
  observacoes: "",
}

function getNextStage(current: string): string | null {
  const idx = STAGES.findIndex((s) => s.id === current)
  if (idx === -1 || idx >= 3) return null // 3 = fechado, não avança além
  return STAGES[idx + 1].id
}

export function CrmBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [defaultStage, setDefaultStage] = useState("reuniao_agendada")

  const [lossDialogOpen, setLossDialogOpen] = useState(false)
  const [lossLeadId, setLossLeadId] = useState<number | null>(null)
  const [lossReason, setLossReason] = useState(MOTIVOS_PERDA[0])

  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  // Métricas
  const metrics = useMemo(() => {
    const realizadas = leads.filter((l) =>
      ["reuniao_realizada", "proposta_enviada", "fechado"].includes(l.etapa),
    ).length
    const fechados = leads.filter((l) => l.etapa === "fechado").length
    const taxa = realizadas > 0 ? Math.round((fechados / realizadas) * 100) : 0
    return { realizadas, fechados, taxa }
  }, [leads])

  function openNew(stage: string) {
    setEditingId(null)
    setForm(emptyForm)
    setDefaultStage(stage)
    setDialogOpen(true)
  }

  function openEdit(lead: Lead) {
    setEditingId(lead.id)
    setForm({
      nome: lead.nome,
      plano: lead.plano || PLANOS[0],
      origem: lead.origem || ORIGENS[0],
      data_reuniao: lead.data_reuniao ? lead.data_reuniao.slice(0, 10) : "",
      responsavel: lead.responsavel || "",
      observacoes: lead.observacoes || "",
    })
    setDialogOpen(true)
  }

  function handleSave() {
    if (!form.nome.trim()) return
    startTransition(async () => {
      if (editingId) {
        const res = await updateCrmLead(editingId, {
          ...form,
          data_reuniao: form.data_reuniao || null,
        })
        if (res[0]) {
          setLeads((prev) => prev.map((l) => (l.id === editingId ? (res[0] as Lead) : l)))
        }
      } else {
        const res = await createCrmLead({
          ...form,
          data_reuniao: form.data_reuniao || null,
          etapa: defaultStage,
        })
        if (res[0]) setLeads((prev) => [res[0] as Lead, ...prev])
      }
      setDialogOpen(false)
    })
  }

  function applyMove(id: number, stage: string, motivo?: string) {
    // Atualização otimista
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, etapa: stage, motivo_perda: stage === "perdido" ? motivo || null : null }
          : l,
      ),
    )
    startTransition(async () => {
      await moveCrmLead(id, stage, motivo)
    })
  }

  function handleMove(id: number, stage: string) {
    if (stage === "perdido") {
      setLossLeadId(id)
      setLossReason(MOTIVOS_PERDA[0])
      setLossDialogOpen(true)
      return
    }
    applyMove(id, stage)
  }

  function confirmLoss() {
    if (lossLeadId !== null) {
      applyMove(lossLeadId, "perdido", lossReason)
    }
    setLossDialogOpen(false)
    setLossLeadId(null)
  }

  function handleDelete(id: number) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    startTransition(async () => {
      await deleteCrmLead(id)
    })
  }

  function formatDate(d: string | null) {
    if (!d) return "Sem data"
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground text-balance">CRM — Pipeline de Leads</h2>
          <p className="text-sm text-muted-foreground">Acompanhe seus leads desde a reunião até o fechamento.</p>
        </div>
        <Button onClick={() => openNew("reuniao_agendada")} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/15">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reuniões Realizadas</p>
            <p className="text-2xl font-bold text-foreground">{metrics.realizadas}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/15">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fechamentos</p>
            <p className="text-2xl font-bold text-foreground">{metrics.fechados}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de Fechamento</p>
            <p className="text-2xl font-bold text-foreground">{metrics.taxa}%</p>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.etapa === stage.id)
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStage(stage.id)
              }}
              onDragLeave={() => setDragOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedId !== null) handleMove(draggedId, stage.id)
                setDraggedId(null)
                setDragOverStage(null)
              }}
              className={`flex w-72 shrink-0 flex-col rounded-xl border border-t-4 bg-card/50 ${stage.color} ${
                dragOverStage === stage.id ? "ring-2 ring-primary/50" : ""
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {stageLeads.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
                {stageLeads.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nenhum lead aqui.</p>
                )}
                {stageLeads.map((lead) => {
                  const next = getNextStage(lead.etapa)
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggedId(lead.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className="group cursor-grab rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground leading-tight">{lead.nome}</p>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(lead)}
                            className="text-muted-foreground hover:text-primary"
                            aria-label="Editar lead"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Excluir lead"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                            PLANO_COLORS[lead.plano] || "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <Tag className="h-3 w-3" />
                          {lead.plano}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Radio className="h-3 w-3" />
                          {lead.origem || "Sem origem"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(lead.data_reuniao)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          {lead.responsavel || "Sem responsável"}
                        </div>
                      </div>

                      {lead.observacoes && (
                        <p className="mt-2 line-clamp-2 rounded-md bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
                          {lead.observacoes}
                        </p>
                      )}

                      {lead.etapa === "perdido" && lead.motivo_perda && (
                        <p className="mt-2 text-[11px] font-medium text-red-400">Motivo: {lead.motivo_perda}</p>
                      )}

                      {lead.etapa === "fechado" ? (
                        <Button
                          asChild
                          size="sm"
                          className="mt-3 h-7 w-full gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"
                        >
                          <Link href={`/nova-loja?lead=${encodeURIComponent(lead.nome)}`}>
                            <Store className="h-3.5 w-3.5" />
                            Criar Loja
                          </Link>
                        </Button>
                      ) : (
                        next && (
                          <button
                            onClick={() => handleMove(lead.id, next)}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                          >
                            Avançar
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => openNew(stage.id)}
                className="m-3 mt-0 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal Novo/Editar Lead */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {editingId ? "Editar Lead" : "Novo Lead"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do lead</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Plano de interesse</Label>
                <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANOS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data da reunião</Label>
                <Input
                  type="date"
                  value={form.data_reuniao}
                  onChange={(e) => setForm({ ...form, data_reuniao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  placeholder="Ex: Alisson"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Anotações sobre o lead..."
                rows={3}
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!form.nome.trim()}>
              {editingId ? "Salvar" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Motivo da Perda */}
      <Dialog open={lossDialogOpen} onOpenChange={setLossDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Motivo da perda</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Selecione o motivo</Label>
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_PERDA.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setLossDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmLoss}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
