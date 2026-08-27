"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import {
  PLATFORM_META,
  CONTENT_TYPE_META,
  PILLAR_META,
  STATUS_META,
  STATUS_ORDER,
  type NexusContent,
  type NexusPlatform,
  type NexusContentType,
  type NexusPillar,
  type NexusStatus,
} from "@/lib/nexus"

type SelectableUser = { id: number; name: string }

export type ContentFormValue = {
  title: string
  date: string
  publication_time: string | null
  platforms: NexusPlatform[]
  content_type: string | null
  status: NexusStatus
  responsible_user_id: number | null
  pillar: string | null
  objective: string
  briefing: string
  caption: string
  cta: string
  references: string
  material_url: string
  notes: string
}

function emptyForm(date: string): ContentFormValue {
  return {
    title: "",
    date,
    publication_time: "",
    platforms: [],
    content_type: null,
    status: "ideia",
    responsible_user_id: null,
    pillar: null,
    objective: "",
    briefing: "",
    caption: "",
    cta: "",
    references: "",
    material_url: "",
    notes: "",
  }
}

export function NexusContentDialog({
  open,
  onOpenChange,
  defaultDate,
  editing,
  users,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultDate: string
  editing: NexusContent | null
  users: SelectableUser[]
  onSubmit: (value: ContentFormValue) => Promise<void>
}) {
  const [form, setForm] = useState<ContentFormValue>(emptyForm(defaultDate))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        title: editing.title,
        date: editing.date,
        publication_time: editing.publication_time ?? "",
        platforms: editing.platforms,
        content_type: editing.content_type,
        status: editing.status,
        responsible_user_id: editing.responsible_user_id,
        pillar: editing.pillar,
        objective: editing.objective,
        briefing: editing.briefing,
        caption: editing.caption,
        cta: editing.cta,
        references: editing.references,
        material_url: editing.material_url,
        notes: editing.notes,
      })
    } else {
      setForm(emptyForm(defaultDate))
    }
  }, [open, editing, defaultDate])

  const togglePlatform = (p: NexusPlatform) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editing ? "Editar conteúdo" : "Adicionar conteúdo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="nx-title">Título</Label>
            <Input
              id="nx-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Reel — Bastidores Pro Growth"
            />
          </div>

          {/* Plataformas */}
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PLATFORM_META) as NexusPlatform[]).map((p) => {
                const active = form.platforms.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? PLATFORM_META[p].badge
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                    )}
                  >
                    {PLATFORM_META[p].label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de conteúdo</Label>
              <Select
                value={form.content_type ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, content_type: v as NexusContentType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONTENT_TYPE_META) as NexusContentType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {CONTENT_TYPE_META[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="nx-time">Horário</Label>
              <Input
                id="nx-time"
                type="time"
                value={form.publication_time ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, publication_time: e.target.value }))}
              />
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="nx-date">Data</Label>
              <Input
                id="nx-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as NexusStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={form.responsible_user_id ? String(form.responsible_user_id) : ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, responsible_user_id: v ? Number(v) : null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilar */}
            <div className="space-y-2">
              <Label>Tema / Pilar</Label>
              <Select
                value={form.pillar ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, pillar: v as NexusPillar }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PILLAR_META) as NexusPillar[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PILLAR_META[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="nx-obj">Objetivo</Label>
            <Input
              id="nx-obj"
              value={form.objective}
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
              placeholder="Gerar autoridade para a marca"
            />
          </div>

          {/* Briefing */}
          <div className="space-y-2">
            <Label htmlFor="nx-brief">Briefing</Label>
            <Textarea
              id="nx-brief"
              rows={3}
              value={form.briefing}
              onChange={(e) => setForm((f) => ({ ...f, briefing: e.target.value }))}
              placeholder="Explique exatamente o conteúdo que deve ser produzido."
            />
          </div>

          {/* Copy / Legenda */}
          <div className="space-y-2">
            <Label htmlFor="nx-caption">Copy / Legenda</Label>
            <Textarea
              id="nx-caption"
              rows={4}
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              placeholder="Escreva a legenda do conteúdo."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* CTA */}
            <div className="space-y-2">
              <Label htmlFor="nx-cta">CTA</Label>
              <Input
                id="nx-cta"
                value={form.cta}
                onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
                placeholder="Comenta GROWTH para saber mais."
              />
            </div>

            {/* Link do material */}
            <div className="space-y-2">
              <Label htmlFor="nx-material">Link do material</Label>
              <Input
                id="nx-material"
                value={form.material_url}
                onChange={(e) => setForm((f) => ({ ...f, material_url: e.target.value }))}
                placeholder="Drive, Canva, CapCut, Figma..."
              />
            </div>
          </div>

          {/* Referências */}
          <div className="space-y-2">
            <Label htmlFor="nx-ref">Referências</Label>
            <Textarea
              id="nx-ref"
              rows={2}
              value={form.references}
              onChange={(e) => setForm((f) => ({ ...f, references: e.target.value }))}
              placeholder="Links de referência (um por linha)."
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="nx-notes">Observações</Label>
            <Textarea
              id="nx-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar conteúdo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
