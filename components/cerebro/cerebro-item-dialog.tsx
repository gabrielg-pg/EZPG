"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fetchLinkMeta, type CerebroInput, type CerebroItem, type CerebroTipo } from "@/app/actions/cerebro-actions"

const TIPO_LABEL: Record<CerebroTipo, { novo: string; editar: string; desc: string }> = {
  aprendizado: { novo: "Novo aprendizado", editar: "Editar aprendizado", desc: "Registre um erro, solução ou insight." },
  link: { novo: "Novo link", editar: "Editar link", desc: "Guarde um link que você usa no dia a dia." },
  modelo: { novo: "Novo modelo ou prompt", editar: "Editar modelo", desc: "Salve um texto pronto para reutilizar." },
  estrutura: {
    novo: "Nova estrutura para modelar",
    editar: "Editar estrutura",
    desc: "Registre uma loja de referência para modelar.",
  },
}

const MOEDAS_SUGERIDAS = ["EUR", "GBP", "USD", "BRL", "CHF", "CAD", "AUD"]

interface CerebroItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: CerebroTipo
  item: CerebroItem | null
  suggestedTags: string[]
  suggestedCategorias: string[]
  onSubmit: (input: CerebroInput) => Promise<string | null>
}

export function CerebroItemDialog({
  open,
  onOpenChange,
  tipo,
  item,
  suggestedTags,
  suggestedCategorias,
  onSubmit,
}: CerebroItemDialogProps) {
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [url, setUrl] = useState("")
  const [categoria, setCategoria] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState("")
  const [favicon, setFavicon] = useState<string | null>(null)
  const [nicho, setNicho] = useState("")
  const [pais, setPais] = useState("")
  const [moeda, setMoeda] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setTitulo(item?.titulo ?? "")
    setConteudo(item?.conteudo ?? "")
    setUrl(item?.url ?? "")
    setCategoria(item?.categoria ?? (tipo === "link" ? "Ferramentas" : ""))
    setTags(item?.tags ?? [])
    setFavicon(item?.favicon ?? null)
    setNicho(item?.nicho ?? "")
    setPais(item?.pais ?? "")
    setMoeda(item?.moeda ?? "")
    setTagDraft("")
    setError(null)
  }, [open, item, tipo])

  const labels = TIPO_LABEL[tipo]

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (!tag) return
    setTags((prev) => (prev.some((t) => t.toLowerCase() === tag.toLowerCase()) ? prev : [...prev, tag]))
    setTagDraft("")
  }

  const loadMeta = async (value: string) => {
    if (!value.trim()) return
    setFetchingMeta(true)
    const res = await fetchLinkMeta(value)
    setFetchingMeta(false)
    if (res.ok) {
      setUrl(res.data.url)
      setFavicon(res.data.favicon)
      setTitulo((current) => current.trim() || res.data.titulo)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const err = await onSubmit({ tipo, titulo, conteudo, url, categoria, tags, favicon, nicho, pais, moeda })
      if (err) setError(err)
      else onOpenChange(false)
    })
  }

  const availableTags = suggestedTags.filter((t) => !tags.some((x) => x.toLowerCase() === t.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{item ? labels.editar : labels.novo}</DialogTitle>
            <DialogDescription>{labels.desc}</DialogDescription>
          </DialogHeader>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {tipo === "estrutura" && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estrutura-nome">Nome da loja</Label>
                <Input
                  id="estrutura-nome"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Noa Barcelona"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="estrutura-nicho">Nicho</Label>
                  <Input id="estrutura-nicho" value={nicho} onChange={(e) => setNicho(e.target.value)} placeholder="Ex: Fashion" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="estrutura-pais">País</Label>
                  <Input id="estrutura-pais" value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Ex: Reino Unido" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="estrutura-moeda">Moeda</Label>
                  <Input
                    id="estrutura-moeda"
                    list="estrutura-moedas"
                    value={moeda}
                    onChange={(e) => setMoeda(e.target.value)}
                    placeholder="Ex: GBP"
                  />
                  <datalist id="estrutura-moedas">
                    {MOEDAS_SUGERIDAS.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estrutura-url">Link da loja</Label>
                <Input id="estrutura-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estrutura-obs">Observação (opcional)</Label>
                <Textarea
                  id="estrutura-obs"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={3}
                  className="resize-y font-sans leading-relaxed"
                  placeholder="O que vale modelar nessa loja"
                />
              </div>
            </>
          )}

          {tipo === "link" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cerebro-url">Endereço</Label>
              <div className="relative">
                <Input
                  id="cerebro-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={(e) => loadMeta(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text")
                    if (pasted) setTimeout(() => loadMeta(pasted), 0)
                  }}
                  placeholder="https://..."
                  required
                  autoFocus
                />
                {fetchingMeta && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Buscando informações do site" />
                )}
              </div>
            </div>
          )}

          {tipo !== "estrutura" && (
          <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cerebro-titulo">{tipo === "link" ? "Nome" : "Título"}</Label>
            <Input
              id="cerebro-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={tipo === "link" ? "Nome do site" : "Título"}
              required={tipo !== "link"}
              autoFocus={tipo !== "link"}
            />
          </div>

          {tipo === "link" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cerebro-categoria">Categoria</Label>
              <Input
                id="cerebro-categoria"
                list="cerebro-categorias"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Escolha ou crie uma categoria"
              />
              <datalist id="cerebro-categorias">
                {suggestedCategorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="cerebro-conteudo">
              {tipo === "link" ? "Observação (opcional)" : tipo === "modelo" ? "Conteúdo" : "Descrição"}
            </Label>
            <Textarea
              id="cerebro-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={tipo === "link" ? 3 : 7}
              className="resize-y font-sans leading-relaxed"
              required={tipo === "modelo"}
            />
          </div>
          </>
          )}

          {tipo !== "link" && tipo !== "estrutura" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cerebro-tag">Tags</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        className="rounded hover:text-foreground"
                        aria-label={`Remover tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="cerebro-tag"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addTag(tagDraft)
                    }
                  }}
                  placeholder="Nova tag e Enter"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => addTag(tagDraft)} aria-label="Adicionar tag">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
