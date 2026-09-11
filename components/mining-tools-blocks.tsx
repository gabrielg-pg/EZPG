"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Puzzle,
  Code2,
  Search,
  ShieldCheck,
  Globe,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Loader2,
} from "lucide-react"
import {
  addMiningExtension,
  updateMiningExtension,
  deleteMiningExtension,
  addUsefulCode,
  updateUsefulCode,
  deleteUsefulCode,
  type MiningExtension,
  type UsefulCode,
  type UsefulCodeType,
} from "@/app/actions/mining-tools-actions"

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignora
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

export function MiningToolsBlocks({
  initialExtensions = [],
  initialUsefulCodes = [],
}: {
  initialExtensions?: MiningExtension[]
  initialUsefulCodes?: UsefulCode[]
}) {
  const [extensions, setExtensions] = useState<MiningExtension[]>(initialExtensions)
  const [codes, setCodes] = useState<UsefulCode[]>(initialUsefulCodes)
  const [isPending, startTransition] = useTransition()

  /* ---- Extensão modal ---- */
  const [extOpen, setExtOpen] = useState(false)
  const [extEditing, setExtEditing] = useState<MiningExtension | null>(null)
  const [extForm, setExtForm] = useState({ name: "", url: "" })
  const [extError, setExtError] = useState("")

  const openAddExt = () => {
    setExtEditing(null)
    setExtForm({ name: "", url: "" })
    setExtError("")
    setExtOpen(true)
  }
  const openEditExt = (ext: MiningExtension) => {
    setExtEditing(ext)
    setExtForm({ name: ext.name, url: ext.url })
    setExtError("")
    setExtOpen(true)
  }
  const submitExt = () => {
    if (!extForm.name.trim() || !extForm.url.trim()) {
      setExtError("Preencha nome e link.")
      return
    }
    startTransition(async () => {
      if (extEditing) {
        const res = await updateMiningExtension(extEditing.id, extForm)
        if (res.success && res.extension) {
          setExtensions((prev) => prev.map((e) => (e.id === extEditing.id ? (res.extension as MiningExtension) : e)))
          setExtOpen(false)
        } else setExtError(res.error || "Erro ao salvar.")
      } else {
        const res = await addMiningExtension(extForm)
        if (res.success && res.extension) {
          setExtensions((prev) => [...prev, res.extension as MiningExtension])
          setExtOpen(false)
        } else setExtError(res.error || "Erro ao adicionar.")
      }
    })
  }
  const removeExt = (id: number) => {
    setExtensions((prev) => prev.filter((e) => e.id !== id))
    startTransition(async () => {
      await deleteMiningExtension(id)
    })
  }

  /* ---- Código útil modal ---- */
  const [codeOpen, setCodeOpen] = useState(false)
  const [codeEditing, setCodeEditing] = useState<UsefulCode | null>(null)
  const [codeForm, setCodeForm] = useState<{ title: string; type: UsefulCodeType; value: string; description: string }>({
    title: "",
    type: "code",
    value: "",
    description: "",
  })
  const [codeError, setCodeError] = useState("")

  const openAddCode = () => {
    setCodeEditing(null)
    setCodeForm({ title: "", type: "code", value: "", description: "" })
    setCodeError("")
    setCodeOpen(true)
  }
  const openEditCode = (c: UsefulCode) => {
    setCodeEditing(c)
    setCodeForm({ title: c.title, type: c.type, value: c.value, description: c.description })
    setCodeError("")
    setCodeOpen(true)
  }
  const submitCode = () => {
    if (!codeForm.title.trim() || !codeForm.value.trim()) {
      setCodeError("Preencha título e conteúdo.")
      return
    }
    startTransition(async () => {
      if (codeEditing) {
        const res = await updateUsefulCode(codeEditing.id, codeForm)
        if (res.success && res.code) {
          setCodes((prev) => prev.map((c) => (c.id === codeEditing.id ? (res.code as UsefulCode) : c)))
          setCodeOpen(false)
        } else setCodeError(res.error || "Erro ao salvar.")
      } else {
        const res = await addUsefulCode(codeForm)
        if (res.success && res.code) {
          setCodes((prev) => [...prev, res.code as UsefulCode])
          setCodeOpen(false)
        } else setCodeError(res.error || "Erro ao adicionar.")
      }
    })
  }
  const removeCode = (id: number) => {
    setCodes((prev) => prev.filter((c) => c.id !== id))
    startTransition(async () => {
      await deleteUsefulCode(id)
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Extensões */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Extensões</h3>
          </div>
          <Button size="sm" onClick={openAddExt} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="space-y-2 p-4">
            {extensions.length === 0 && (
              <p className="px-1 py-2 text-sm text-muted-foreground">Nenhuma extensão adicionada ainda.</p>
            )}
            {extensions.map((ext) => (
              <div
                key={ext.id}
                className="group/ext flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <a
                  href={ext.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-3 text-sm font-medium text-foreground"
                >
                  <Puzzle className="h-4 w-4 text-primary" />
                  {ext.name}
                </a>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEditExt(ext)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover/ext:opacity-100"
                    title="Editar extensão"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeExt(ext.id)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover/ext:opacity-100"
                    title="Excluir extensão"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <a href={ext.url} target="_blank" rel="noopener noreferrer" className="p-1 text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Códigos úteis */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Códigos úteis</h3>
          </div>
          <Button size="sm" onClick={openAddCode} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="space-y-4 p-4">
            {codes.map((c) => (
              <div key={c.id} className="group/code space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {c.type === "link" ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Search className="h-4 w-4 text-primary" />
                    )}
                    {c.title}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEditCode(c)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover/code:opacity-100"
                      title="Editar código"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeCode(c.id)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover/code:opacity-100"
                      title="Excluir código"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {c.type === "link" ? (
                  <a
                    href={c.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex items-center gap-3 truncate text-sm font-medium text-foreground">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                      {c.value.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                ) : (
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                    <code className="flex-1 truncate font-mono text-sm text-teal-400">{c.value}</code>
                    <CopyButton value={c.value} label="código" />
                  </div>
                )}
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-lg border border-teal-500/20 bg-teal-500/5 px-4 py-3">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Lembre-se: minere apenas lojas com <span className="font-semibold text-foreground">10 mil visitas
                ou mais</span> (confira no Similarweb) e priorize os primeiros produtos da esquerda para a direita.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modal Extensão */}
      <Dialog open={extOpen} onOpenChange={(o) => !o && setExtOpen(false)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Puzzle className="h-5 w-5 text-primary" />
              {extEditing ? "Editar Extensão" : "Adicionar Extensão"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ext-name" className="text-sm text-muted-foreground">
                Nome
              </Label>
              <Input
                id="ext-name"
                value={extForm.name}
                onChange={(e) => setExtForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Similarweb — Website Traffic"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ext-url" className="text-sm text-muted-foreground">
                Link
              </Label>
              <Input
                id="ext-url"
                value={extForm.url}
                onChange={(e) => setExtForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="bg-background/50 border-sidebar-border text-white"
              />
            </div>
            {extError && <p className="text-xs text-red-400">{extError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setExtOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={submitExt} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : extEditing ? null : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                {extEditing ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Código útil */}
      <Dialog open={codeOpen} onOpenChange={(o) => !o && setCodeOpen(false)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Code2 className="h-5 w-5 text-primary" />
              {codeEditing ? "Editar Código útil" : "Adicionar Código útil"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="code-title" className="text-sm text-muted-foreground">
                Título
              </Label>
              <Input
                id="code-title"
                value={codeForm.title}
                onChange={(e) => setCodeForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: Produtos mais vendidos da loja"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code-type" className="text-sm text-muted-foreground">
                Tipo
              </Label>
              <Select
                value={codeForm.type}
                onValueChange={(v) => setCodeForm((f) => ({ ...f, type: v as UsefulCodeType }))}
              >
                <SelectTrigger id="code-type" className="bg-background/50 border-sidebar-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar border-sidebar-border text-white">
                  <SelectItem value="code" className="focus:bg-white/10 focus:text-white">
                    Código (para copiar)
                  </SelectItem>
                  <SelectItem value="link" className="focus:bg-white/10 focus:text-white">
                    Link (para abrir)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code-value" className="text-sm text-muted-foreground">
                {codeForm.type === "link" ? "Link" : "Código"}
              </Label>
              <Input
                id="code-value"
                value={codeForm.value}
                onChange={(e) => setCodeForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={codeForm.type === "link" ? "https://..." : "collections/all?sort_by=best-selling"}
                className="bg-background/50 border-sidebar-border font-mono text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code-description" className="text-sm text-muted-foreground">
                Descrição (opcional)
              </Label>
              <Textarea
                id="code-description"
                value={codeForm.description}
                onChange={(e) => setCodeForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Explique brevemente para que serve."
                className="min-h-[70px] bg-background/50 border-sidebar-border text-white"
              />
            </div>
            {codeError && <p className="text-xs text-red-400">{codeError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setCodeOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button className="flex-1" onClick={submitCode} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : codeEditing ? null : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                {codeEditing ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
