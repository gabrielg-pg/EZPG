"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  BookOpen,
  Palette,
  MessageSquareText,
  Search,
  Code,
  Target,
  Rocket,
  Folder,
  Layers,
  Globe,
  Lightbulb,
  Megaphone,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import {
  createExecutionZoneCard,
  updateExecutionZoneCard,
  deleteExecutionZoneCard,
  type ExecutionZoneCard,
} from "@/app/actions/execution-zone-actions"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  palette: Palette,
  message: MessageSquareText,
  search: Search,
  code: Code,
  target: Target,
  rocket: Rocket,
  folder: Folder,
  layers: Layers,
  globe: Globe,
  lightbulb: Lightbulb,
  megaphone: Megaphone,
}

const COLORS: Record<string, { color: string; shadow: string }> = {
  blue: { color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
  purple: { color: "from-purple-500 to-pink-500", shadow: "shadow-purple-500/20" },
  emerald: { color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20" },
  amber: { color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
  rose: { color: "from-rose-500 to-red-500", shadow: "shadow-rose-500/20" },
  indigo: { color: "from-indigo-500 to-violet-500", shadow: "shadow-indigo-500/20" },
}

const ICON_OPTIONS = Object.keys(ICONS)
const COLOR_OPTIONS = Object.keys(COLORS)

type CardForm = {
  title: string
  subtitle: string
  description: string
  link: string
  icon_key: string
  color_key: string
}

const emptyForm: CardForm = {
  title: "",
  subtitle: "",
  description: "",
  link: "",
  icon_key: "book",
  color_key: "blue",
}

export function ExecutionZoneCards({ initialCards = [] }: { initialCards?: ExecutionZoneCard[] }) {
  const [cards, setCards] = useState<ExecutionZoneCard[]>(initialCards)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CardForm>(emptyForm)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  const openEdit = (card: ExecutionZoneCard) => {
    setEditingId(card.id)
    setForm({
      title: card.title,
      subtitle: card.subtitle,
      description: card.description,
      link: card.link,
      icon_key: card.icon_key,
      color_key: card.color_key,
    })
    setError("")
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!form.title.trim() || !form.subtitle.trim() || !form.link.trim()) {
      setError("Preencha título, subtítulo e link.")
      return
    }
    startTransition(async () => {
      if (editingId != null) {
        const result = await updateExecutionZoneCard({ id: editingId, ...form })
        if (result.success && result.card) {
          setCards((prev) => prev.map((c) => (c.id === editingId ? (result.card as ExecutionZoneCard) : c)))
          setModalOpen(false)
        } else {
          setError(result.error || "Erro ao editar card.")
        }
      } else {
        const result = await createExecutionZoneCard(form)
        if (result.success && result.card) {
          setCards((prev) => [...prev, result.card as ExecutionZoneCard])
          setModalOpen(false)
        } else {
          setError(result.error || "Erro ao adicionar card.")
        }
      }
    })
  }

  const handleDelete = (id: number) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
    startTransition(async () => {
      await deleteExecutionZoneCard(id)
    })
  }

  return (
    <div className="space-y-8">
      {/* Header com botão adicionar */}
      <div className="flex items-center justify-end">
        <Button
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((resource) => {
          const Icon = ICONS[resource.icon_key] ?? BookOpen
          const palette = COLORS[resource.color_key] ?? COLORS.blue
          return (
            <Card
              key={resource.id}
              className={`group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-all duration-300 hover:shadow-xl ${palette.shadow}`}
            >
              {/* Gradient accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${palette.color}`} />

              {/* Glow effect on hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${palette.color}`}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${palette.color} flex items-center justify-center shadow-lg ${palette.shadow} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {/* Ações: editar / excluir */}
                  <div className="relative z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(resource)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      title="Editar card"
                      aria-label="Editar card"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors"
                      title="Excluir card"
                      aria-label="Excluir card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-foreground mt-4 group-hover:text-primary transition-colors duration-300">
                  {resource.title}
                </CardTitle>
                <CardDescription className="text-sm font-medium text-primary/80">{resource.subtitle}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{resource.description}</p>

                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(resource.link, "_blank", "noopener,noreferrer")
                  }}
                  className={`relative z-10 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white bg-gradient-to-r ${palette.color} hover:opacity-90 transition-all duration-300 shadow-lg ${palette.shadow} hover:shadow-xl cursor-pointer pointer-events-auto`}
                >
                  <span>Acessar</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal adicionar/editar */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {editingId != null ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId != null ? "Editar card" : "Adicionar card"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ez-title" className="text-sm text-muted-foreground">
                Título
              </Label>
              <Input
                id="ez-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex.: PG | TUTORIAIS"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ez-subtitle" className="text-sm text-muted-foreground">
                Subtítulo
              </Label>
              <Input
                id="ez-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Ex.: Base interna de conhecimento operacional"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ez-description" className="text-sm text-muted-foreground">
                Descrição
              </Label>
              <Textarea
                id="ez-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o conteúdo deste card..."
                rows={4}
                className="bg-background/50 border-sidebar-border text-white resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ez-link" className="text-sm text-muted-foreground">
                Link de direcionamento
              </Label>
              <Input
                id="ez-link"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
                className="bg-background/50 border-sidebar-border text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Ícone</Label>
                <Select value={form.icon_key} onValueChange={(v) => setForm((f) => ({ ...f, icon_key: v }))}>
                  <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-sidebar border-sidebar-border text-white max-h-64">
                    {ICON_OPTIONS.map((key) => {
                      const Icon = ICONS[key]
                      return (
                        <SelectItem key={key} value={key} className="focus:bg-white/10 focus:text-white capitalize">
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {key}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Cor</Label>
                <Select value={form.color_key} onValueChange={(v) => setForm((f) => ({ ...f, color_key: v }))}>
                  <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-sidebar border-sidebar-border text-white max-h-64">
                    {COLOR_OPTIONS.map((key) => (
                      <SelectItem key={key} value={key} className="focus:bg-white/10 focus:text-white capitalize">
                        <span className="flex items-center gap-2">
                          <span className={`h-4 w-4 rounded-full bg-gradient-to-br ${COLORS[key].color}`} />
                          {key}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : editingId != null ? (
                  <Pencil className="h-4 w-4 mr-1.5" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                {editingId != null ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
