"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Send,
  ThumbsUp,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react"
import {
  STATUS_META,
  STATUS_ORDER,
  CONTENT_TYPE_META,
  PILLAR_META,
  isLate,
  type NexusContent,
  type NexusStatus,
} from "@/lib/nexus"

export function NexusContentDetail({
  content,
  isAdmin,
  onClose,
  onEdit,
  onStatusChange,
  onSendForApproval,
  onApprove,
  onRequestChanges,
}: {
  content: NexusContent | null
  isAdmin: boolean
  onClose: () => void
  onEdit: (c: NexusContent) => void
  onStatusChange: (id: number, status: NexusStatus) => void
  onSendForApproval: (id: number) => void
  onApprove: (id: number) => void
  onRequestChanges: (id: number, note: string) => void
}) {
  const [copied, setCopied] = useState<string | null>(null)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionNote, setRevisionNote] = useState("")

  if (!content) return null

  const late = isLate(content.date, content.status)

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* noop */
    }
  }

  const refLinks = content.references
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <Dialog open={!!content} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <DialogTitle className="text-xl text-balance">{content.title}</DialogTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className={cn("border", STATUS_META[content.status].badge)}>
              {STATUS_META[content.status].label}
            </Badge>
            {late && (
              <Badge variant="outline" className="border border-red-500/30 bg-red-500/15 text-red-400">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Atrasado
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Meta rápida */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {content.publication_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {content.publication_time}
              </span>
            )}
            {content.content_type && (
              <span>{CONTENT_TYPE_META[content.content_type]}</span>
            )}
            {content.pillar && <span>{PILLAR_META[content.pillar]}</span>}
          </div>

          {content.revision_note && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              <p className="mb-1 font-semibold">Alteração solicitada:</p>
              {content.revision_note}
            </div>
          )}

          {content.objective && (
            <Field label="Objetivo">
              <p className="text-sm text-foreground">{content.objective}</p>
            </Field>
          )}

          {content.briefing && (
            <Field label="Briefing">
              <p className="whitespace-pre-wrap text-sm text-foreground">{content.briefing}</p>
            </Field>
          )}

          {content.caption && (
            <Field
              label="Copy / Legenda"
              action={
                <CopyBtn copied={copied === "caption"} onClick={() => copy("caption", content.caption)} />
              }
            >
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-background/50 p-3 text-sm text-foreground">
                {content.caption}
              </p>
            </Field>
          )}

          {content.cta && (
            <Field
              label="CTA"
              action={<CopyBtn copied={copied === "cta"} onClick={() => copy("cta", content.cta)} />}
            >
              <p className="text-sm text-foreground">{content.cta}</p>
            </Field>
          )}

          {refLinks.length > 0 && (
            <Field label="Referências">
              <div className="flex flex-col gap-1.5">
                {refLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.startsWith("http") ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </Field>
          )}

          {content.material_url && (
            <Field label="Material">
              <a
                href={content.material_url.startsWith("http") ? content.material_url : `https://${content.material_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir material
              </a>
            </Field>
          )}

          {content.notes && (
            <Field label="Observações">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{content.notes}</p>
            </Field>
          )}

          {/* Controles inline */}
          <div className="border-t border-border pt-4">
            <div className="space-y-2 sm:max-w-xs">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <Select value={content.status} onValueChange={(v) => onStatusChange(content.id, v as NexusStatus)}>
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
          </div>

          {/* Aprovação */}
          {revisionOpen ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="text-sm font-medium">Comentário da alteração</label>
              <Textarea
                rows={3}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Descreva o que precisa ser ajustado."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setRevisionOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onRequestChanges(content.id, revisionNote)
                    setRevisionOpen(false)
                    setRevisionNote("")
                  }}
                >
                  Enviar alteração
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={() => onEdit(content)}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Editar
              </Button>
              {content.status !== "aguardando_aprovacao" && content.status !== "publicado" && (
                <Button variant="outline" size="sm" onClick={() => onSendForApproval(content.id)}>
                  <Send className="mr-1.5 h-4 w-4" />
                  Enviar para aprovação
                </Button>
              )}
              {isAdmin && content.status === "aguardando_aprovacao" && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                    onClick={() => onApprove(content.id)}
                  >
                    <ThumbsUp className="mr-1.5 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRevisionOpen(true)}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Solicitar alteração
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  )
}

function CopyBtn({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  )
}
