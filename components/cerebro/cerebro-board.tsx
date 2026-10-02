"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Brain, Link2, Lightbulb, Loader2, Search, Sparkles, Store, X } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Input } from "@/components/ui/input"
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
  createCerebroItem,
  deleteCerebroItem,
  fetchLinkMeta,
  toggleCerebroFixado,
  updateCerebroItem,
  type CerebroInput,
  type CerebroItem,
  type CerebroTipo,
} from "@/app/actions/cerebro-actions"
import { CerebroItemDialog } from "./cerebro-item-dialog"
import { CerebroColumn } from "./cerebro-column"

const TAGS_SUGERIDAS = ["Meta Ads", "Shopify", "Copy", "Operação", "Cliente", "Financeiro"]
const CATEGORIAS_INICIAIS = ["Ferramentas", "Fornecedores", "Meta", "Shopify", "Referências"]

function looksLikeUrl(text: string) {
  const value = text.trim()
  if (!value || /\s/.test(value)) return false
  return /^https?:\/\/\S+$/i.test(value) || /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(value)
}

function sortItems(items: CerebroItem[]) {
  return [...items].sort((a, b) => {
    if (a.fixado !== b.fixado) return a.fixado ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

interface CerebroBoardProps {
  initialItems: CerebroItem[]
  loadError?: string | null
}

export function CerebroBoard({ initialItems, loadError }: CerebroBoardProps) {
  const [items, setItems] = useState<CerebroItem[]>(() => sortItems(initialItems))
  const [capture, setCapture] = useState("")
  const [capturing, setCapturing] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ open: boolean; tipo: CerebroTipo; item: CerebroItem | null }>({
    open: false,
    tipo: "aprendizado",
    item: null,
  })
  const [pendingDelete, setPendingDelete] = useState<CerebroItem | null>(null)
  const captureRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        captureRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const upsert = useCallback((item: CerebroItem) => {
    setItems((prev) => sortItems([item, ...prev.filter((i) => i.id !== item.id)]))
  }, [])

  const removeLocal = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach((i) => i.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [items])

  const suggestedTags = useMemo(() => {
    const merged = [...TAGS_SUGERIDAS]
    allTags.forEach((t) => {
      if (!merged.some((m) => m.toLowerCase() === t.toLowerCase())) merged.push(t)
    })
    return merged
  }, [allTags])

  const categorias = useMemo(() => {
    const merged = [...CATEGORIAS_INICIAIS]
    items.forEach((i) => {
      if (i.categoria && !merged.some((c) => c.toLowerCase() === i.categoria!.toLowerCase())) merged.push(i.categoria)
    })
    return merged
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (activeTag && !i.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase())) return false
      if (!q) return true
      return [i.titulo, i.conteudo, i.url ?? "", i.categoria ?? "", i.nicho ?? "", i.pais ?? "", i.moeda ?? "", ...(i.tags ?? [])].some(
        (f) => f.toLowerCase().includes(q),
      )
    })
  }, [items, search, activeTag])

  const byTipo = (tipo: CerebroTipo) => filtered.filter((i) => i.tipo === tipo)
  const totalByTipo = (tipo: CerebroTipo) => items.filter((i) => i.tipo === tipo).length

  const undoCreate = async (id: number) => {
    removeLocal(id)
    const res = await deleteCerebroItem(id)
    if (!res.ok) toast.error(res.error)
  }

  const handleCapture = async () => {
    const text = capture.trim()
    if (!text || capturing) return
    setCapturing(true)
    setCaptureError(null)

    let input: CerebroInput
    if (looksLikeUrl(text)) {
      const meta = await fetchLinkMeta(text)
      input = meta.ok
        ? { tipo: "link", url: meta.data.url, titulo: meta.data.titulo, favicon: meta.data.favicon, categoria: "Ferramentas" }
        : { tipo: "link", url: text, titulo: "", categoria: "Ferramentas" }
    } else {
      const [first, ...rest] = text.split("\n")
      input = { tipo: "aprendizado", titulo: first.trim(), conteudo: rest.join("\n").trim(), tags: activeTag ? [activeTag] : [] }
    }

    const res = await createCerebroItem(input)
    setCapturing(false)
    if (!res.ok) {
      setCaptureError(res.error)
      captureRef.current?.focus()
      return
    }
    upsert(res.data)
    setCapture("")
    captureRef.current?.focus()
    const created = res.data
    toast.success(created.tipo === "link" ? "Link salvo" : "Aprendizado salvo", {
      description: created.titulo,
      action: { label: "Desfazer", onClick: () => undoCreate(created.id) },
    })
  }

  const handleDialogSubmit = async (input: CerebroInput) => {
    const res = dialog.item ? await updateCerebroItem(dialog.item.id, input) : await createCerebroItem(input)
    if (!res.ok) return res.error
    upsert(res.data)
    toast.success(dialog.item ? "Alterações salvas" : "Item salvo")
    return null
  }

  const handleTogglePin = async (item: CerebroItem) => {
    upsert({ ...item, fixado: !item.fixado })
    const res = await toggleCerebroFixado(item.id, !item.fixado)
    if (!res.ok) {
      upsert(item)
      toast.error(res.error)
    } else upsert(res.data)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    removeLocal(target.id)
    const res = await deleteCerebroItem(target.id)
    if (!res.ok) {
      upsert(target)
      toast.error(res.error)
    } else toast.success("Item excluído")
  }

  const openNew = (tipo: CerebroTipo) => setDialog({ open: true, tipo, item: null })
  const openEdit = (item: CerebroItem) => setDialog({ open: true, tipo: item.tipo, item })

  const isUrl = looksLikeUrl(capture)
  const hasFilter = Boolean(search.trim() || activeTag)

  return (
    <div className="flex flex-col gap-6">
      <Toaster theme="dark" position="bottom-right" richColors />

      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
          <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground text-balance">Cérebro</h2>
          <p className="text-sm text-muted-foreground">Tudo que você aprendeu e usa no dia a dia</p>
        </div>
      </header>

      <section aria-label="Captura rápida" className="flex flex-col gap-2">
        <div className="relative rounded-2xl border border-primary/40 bg-card shadow-lg shadow-primary/10 transition-colors focus-within:border-primary">
          <div className="pointer-events-none absolute left-4 top-4">
            {isUrl ? (
              <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            )}
          </div>
          <label htmlFor="cerebro-capture" className="sr-only">
            Captura rápida
          </label>
          <textarea
            id="cerebro-capture"
            ref={captureRef}
            value={capture}
            onChange={(e) => {
              setCapture(e.target.value)
              if (captureError) setCaptureError(null)
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleCapture()
              }
            }}
            rows={capture.includes("\n") ? 3 : 1}
            placeholder="Anote algo ou cole um link... (Enter para salvar)"
            className="block w-full resize-none bg-transparent py-4 pl-12 pr-36 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={capturing}
          />
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-xs text-muted-foreground">
            {capturing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Salvando" />
            ) : capture.trim() ? (
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                {isUrl ? "Link" : "Aprendizado"}
              </span>
            ) : (
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono sm:inline">Ctrl K</kbd>
            )}
          </div>
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          {captureError ? (
            <span role="alert" className="text-destructive">
              {captureError} Seu texto foi mantido.
            </span>
          ) : (
            "Links viram Link. Qualquer outro texto vira Aprendizado (primeira linha = título). Shift + Enter quebra linha."
          )}
        </p>
      </section>

      <section aria-label="Busca e filtros" className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar em tudo..."
            className="pl-9"
            aria-label="Buscar no Cérebro"
          />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {allTags.length === 0 ? (
            <span className="text-xs text-muted-foreground">As tags dos seus itens aparecem aqui para filtrar.</span>
          ) : (
            allTags.map((tag) => {
              const active = activeTag === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(active ? null : tag)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  }
                >
                  {tag}
                </button>
              )
            })
          )}
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setActiveTag(null)
              }}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Limpar filtro
            </button>
          )}
        </div>
      </section>

      {loadError && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CerebroColumn
          tipo="aprendizado"
          title="Aprendizados"
          icon={Lightbulb}
          items={byTipo("aprendizado")}
          total={totalByTipo("aprendizado")}
          emptyText="Nenhum aprendizado ainda. Anote o primeiro."
          filtered={hasFilter}
          onAdd={() => openNew("aprendizado")}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          onTogglePin={handleTogglePin}
          onTagClick={setActiveTag}
        />
        <CerebroColumn
          tipo="link"
          title="Links"
          icon={Link2}
          items={byTipo("link")}
          total={totalByTipo("link")}
          emptyText="Nenhum link ainda. Cole o primeiro na barra acima."
          filtered={hasFilter}
          onAdd={() => openNew("link")}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          onTogglePin={handleTogglePin}
          onTagClick={setActiveTag}
        />
        <CerebroColumn
          tipo="modelo"
          title="Modelos e Prompts"
          icon={Sparkles}
          items={byTipo("modelo")}
          total={totalByTipo("modelo")}
          emptyText="Nenhum modelo ainda. Salve o primeiro texto pronto."
          filtered={hasFilter}
          onAdd={() => openNew("modelo")}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          onTogglePin={handleTogglePin}
          onTagClick={setActiveTag}
        />
        <CerebroColumn
          tipo="estrutura"
          title="Estruturas para Modelar"
          icon={Store}
          items={byTipo("estrutura")}
          total={totalByTipo("estrutura")}
          emptyText="Nenhuma estrutura ainda. Registre a primeira loja para modelar."
          filtered={hasFilter}
          onAdd={() => openNew("estrutura")}
          onEdit={openEdit}
          onDelete={setPendingDelete}
          onTogglePin={handleTogglePin}
          onTagClick={setActiveTag}
        />
      </div>

      <CerebroItemDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        tipo={dialog.tipo}
        item={dialog.item}
        suggestedTags={suggestedTags}
        suggestedCategorias={categorias}
        onSubmit={handleDialogSubmit}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${pendingDelete?.titulo ?? ""}" será excluído permanentemente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
