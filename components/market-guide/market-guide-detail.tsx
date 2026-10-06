"use client"

import { useState, useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, Eye, EyeOff, GripVertical, Plus, Save, Settings2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  archiveMarket,
  createSection,
  deleteSection,
  duplicateMarket,
  updateMarket,
  updateSection,
  type Market,
  type MarketSection,
} from "@/app/actions/market-guide-actions"

type SaveFeedback = { error?: string; saved?: boolean }

function sectionText(section: MarketSection) {
  const rawContent: unknown = section.content
  if (typeof rawContent === "string") return rawContent
  if (!rawContent || typeof rawContent !== "object") return ""

  const content = rawContent as Record<string, unknown>
  if (typeof content.text === "string") return content.text
  if (typeof content.value === "string") return content.value

  if (section.section_type === "table" && Array.isArray(content.rows)) {
    return content.rows
      .map((row) => (row && typeof row === "object" ? Object.values(row).map(stringifyValue).join(" | ") : stringifyValue(row)))
      .join("\n")
  }

  return Object.entries(content)
    .filter(([key]) => key !== "rows")
    .map(([key, value]) => {
      const readableValue = stringifyValue(value)
      return readableValue ? `${key}: ${readableValue}` : ""
    })
    .filter(Boolean)
    .join("\n")
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value && typeof value === "object") return Object.values(value).map(stringifyValue).filter(Boolean).join(" · ")
  return ""
}

function sectionContentFromText(section: MarketSection, value: string): Record<string, unknown> {
  if (section.section_type !== "table") return { text: value }

  const existingRows = Array.isArray(section.content.rows)
    ? (section.content.rows as Record<string, unknown>[])
    : []
  const existingColumns = existingRows[0] ? Object.keys(existingRows[0]) : []
  const rows = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim())
      const columns = existingColumns.length ? existingColumns : cells.map((_, index) => `coluna_${index + 1}`)
      return Object.fromEntries(cells.map((cell, index) => [columns[index] ?? `coluna_${index + 1}`, cell]))
    })

  return { rows }
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("pt-BR")
}

export function MarketGuideDetail({ initial, isAdmin }: { initial: { market: Market; sections: MarketSection[] }; isAdmin: boolean }) {
  const router = useRouter()
  const [market, setMarket] = useState(initial.market)
  const [sections, setSections] = useState(initial.sections)
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState("")
  const [marketError, setMarketError] = useState("")
  const [marketSaved, setMarketSaved] = useState(false)
  const [sectionFeedback, setSectionFeedback] = useState<Record<number, SaveFeedback>>({})

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied(""), 1200)
    } catch {
      setCopied("")
    }
  }

  function saveSection(section: MarketSection, content: Record<string, unknown>, title = section.title, visible = section.visible) {
    setSectionFeedback((current) => ({ ...current, [section.id]: {} }))
    startTransition(async () => {
      try {
        const result = await updateSection(section.id, { title, content, visible })
        if (result.error) {
          setSectionFeedback((current) => ({ ...current, [section.id]: { error: result.error } }))
          return
        }

        setSections((items) => items.map((item) => (item.id === section.id ? { ...item, title, content, visible } : item)))
        setSectionFeedback((current) => ({ ...current, [section.id]: { saved: true } }))
      } catch {
        setSectionFeedback((current) => ({
          ...current,
          [section.id]: { error: "Não foi possível salvar esta seção. Tente novamente." },
        }))
      }
    })
  }

  function saveMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      name: String(data.get("name") ?? ""),
      flag: String(data.get("flag") ?? ""),
      language: String(data.get("language") ?? ""),
      currency: String(data.get("currency") ?? ""),
    }

    setMarketError("")
    setMarketSaved(false)
    startTransition(async () => {
      try {
        const result = await updateMarket(market.id, input)
        if (result.error || !result.slug) {
          setMarketError(result.error ?? "Não foi possível salvar o mercado.")
          return
        }

        const updatedMarket: Market = {
          ...market,
          ...input,
          slug: result.slug,
          updated_at: result.updated_at ?? new Date().toISOString(),
        }
        setMarket(updatedMarket)
        setEditing(false)
        setMarketSaved(true)
        router.replace(`/guia-de-mercados/${result.slug}`, { scroll: false })
        router.refresh()
      } catch {
        setMarketError("Não foi possível salvar o mercado. Tente novamente.")
      }
    })
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full">
      <div className="w-full">
        <Link
          href="/guia-de-mercados"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar aos mercados
        </Link>

        <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-3xl">
              {market.flag || "🌐"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{market.name}</h1>
                {marketSaved && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Check aria-hidden="true" className="size-3.5" />
                    Mercado salvo
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">
                {market.language || "Idioma não definido"}
                {market.currency ? ` · ${market.currency}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Atualizado em {formatDate(market.updated_at)} por {market.updated_by_name || "Admin"}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing((current) => !current)
                  setMarketError("")
                  setMarketSaved(false)
                }}
              >
                <Settings2 data-icon="inline-start" />
                {editing ? "Fechar edição" : "Editar mercado"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  startTransition(async () => {
                    const result = await duplicateMarket(market.id)
                    if (result.slug) window.location.href = `/guia-de-mercados/${result.slug}`
                  })
                }
                disabled={pending}
              >
                <Copy data-icon="inline-start" />
                Duplicar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  startTransition(async () => {
                    await archiveMarket(market.id)
                    window.location.href = "/guia-de-mercados"
                  })
                }
                disabled={pending}
              >
                Arquivar
              </Button>
            </div>
          )}
        </header>

        {editing && (
          <form
            onSubmit={saveMarket}
            className="mb-6 grid gap-4 rounded-2xl border border-primary/25 bg-card/70 p-5 sm:grid-cols-2 2xl:grid-cols-4"
          >
            <label className="flex flex-col gap-2 text-sm font-medium">
              Nome do mercado
              <Input name="name" defaultValue={market.name} placeholder="Itália" required maxLength={120} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Bandeira
              <Input name="flag" defaultValue={market.flag} placeholder="🇮🇹" maxLength={16} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Idioma
              <Input name="language" defaultValue={market.language} placeholder="Italiano" maxLength={100} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Moeda
              <Input name="currency" defaultValue={market.currency} placeholder="EUR" maxLength={40} />
            </label>
            {marketError && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2 2xl:col-span-4">
                {marketError}
              </p>
            )}
            <Button type="submit" disabled={pending} className="sm:col-span-2 2xl:col-span-4">
              <Save data-icon="inline-start" />
              {pending ? "Salvando..." : "Salvar mercado"}
            </Button>
          </form>
        )}

        {isAdmin && editing && (
          <Button
            type="button"
            variant="outline"
            className="mb-5"
            onClick={() =>
              startTransition(async () => {
                try {
                  const result = await createSection(market.id, { title: "Nova seção", sectionType: "text" })
                  if (result.error) {
                    setMarketError(result.error)
                    return
                  }
                  window.location.reload()
                } catch {
                  setMarketError("Não foi possível adicionar a seção. Tente novamente.")
                }
              })
            }
            disabled={pending}
          >
            <Plus data-icon="inline-start" />
            Adicionar seção
          </Button>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          {sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              editable={isAdmin && editing}
              pending={pending}
              feedback={sectionFeedback[section.id]}
              copied={copied}
              onCopy={copy}
              onSave={saveSection}
              onDelete={() => {
                setSectionFeedback((current) => ({ ...current, [section.id]: {} }))
                startTransition(async () => {
                  try {
                    await deleteSection(section.id)
                    setSections((current) => current.filter((item) => item.id !== section.id))
                  } catch {
                    setSectionFeedback((current) => ({
                      ...current,
                      [section.id]: { error: "Não foi possível excluir esta seção. Tente novamente." },
                    }))
                  }
                })
              }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

function SectionEditor({
  section,
  editable,
  pending,
  feedback,
  copied,
  onCopy,
  onSave,
  onDelete,
}: {
  section: MarketSection
  editable: boolean
  pending: boolean
  feedback?: SaveFeedback
  copied: string
  onCopy: (value: string, key: string) => void
  onSave: (section: MarketSection, content: Record<string, unknown>, title?: string, visible?: boolean) => void
  onDelete: () => void
}) {
  const [title, setTitle] = useState(section.title)
  const [content, setContent] = useState(() => sectionText(section))
  const [visible, setVisible] = useState(section.visible)

  return (
    <section className={`flex h-full flex-col rounded-2xl border bg-card p-5 transition-colors ${
      section.visible ? "border-border" : "border-border/60 opacity-60"
    }`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {editable && <GripVertical aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
          {editable ? (
            <Input
              aria-label="Nome da seção"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              className="max-w-md font-semibold"
            />
          ) : (
            <h2 className="text-lg font-semibold">{section.title}</h2>
          )}
        </div>

        {editable && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={visible ? "Ocultar seção" : "Mostrar seção"}
              aria-label={visible ? "Ocultar seção" : "Mostrar seção"}
              aria-pressed={visible}
              onClick={() => {
                const nextVisible = !visible
                setVisible(nextVisible)
                onSave(section, section.content, title, nextVisible)
              }}
              disabled={pending}
            >
              {visible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Excluir seção"
              aria-label="Excluir seção"
              onClick={onDelete}
              disabled={pending}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {editable ? (
        <div className="mt-auto flex flex-col gap-3">
          {section.section_type === "table" && (
            <p className="text-xs text-muted-foreground">
              Uma linha por item; para separar colunas, use o caractere |.
            </p>
          )}
          <Textarea
            aria-label={`Conteúdo de ${title || section.title}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={section.section_type === "table" ? 6 : 5}
            placeholder="Digite as informações desta seção..."
            className="resize-y text-sm leading-6"
          />
          {feedback?.error && <p role="alert" className="text-sm text-destructive">{feedback.error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => onSave(section, sectionContentFromText(section, content), title, visible)}
              disabled={pending || !title.trim()}
            >
              <Save data-icon="inline-start" />
              {pending ? "Salvando..." : "Salvar seção"}
            </Button>
            {feedback?.saved && (
              <span role="status" className="inline-flex items-center gap-1.5 text-sm text-primary">
                <Check aria-hidden="true" className="size-4" />
                Salvo com sucesso
              </span>
            )}
          </div>
        </div>
      ) : (
        <RenderContent section={section} copied={copied} onCopy={onCopy} />
      )}
    </section>
  )
}

function RenderContent({
  section,
  copied,
  onCopy,
}: {
  section: MarketSection
  copied: string
  onCopy: (value: string, key: string) => void
}) {
  const rows = Array.isArray(section.content.rows) ? (section.content.rows as Record<string, string>[]) : []
  const value = sectionText(section)

  if (section.section_type === "table" && rows.length > 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${section.id}-${index}`} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{Object.values(row)[0]}</td>
                <td className="py-3 text-muted-foreground">{Object.values(row).slice(1).join(" · ")}</td>
                <td className="py-3 text-right">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Copiar linha"
                    onClick={() => onCopy(Object.values(row).join(" | "), String(index))}
                  >
                    {copied === String(index) ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!value.trim()) return <p className="text-sm italic text-muted-foreground">Não preenchido.</p>

  return (
    <div className="flex items-start justify-between gap-3">
      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{value}</p>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Copiar conteúdo da seção"
        className="shrink-0"
        onClick={() => onCopy(value, String(section.id))}
      >
        {copied === String(section.id) ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Button>
    </div>
  )
}
