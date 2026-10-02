"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Check, ChevronDown, Copy, ExternalLink, Pencil, Pin, PinOff, Plus, Store, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CerebroItem, CerebroTipo } from "@/app/actions/cerebro-actions"

interface CerebroColumnProps {
  tipo: CerebroTipo
  title: string
  icon: LucideIcon
  items: CerebroItem[]
  total: number
  emptyText: string
  filtered: boolean
  onAdd: () => void
  onEdit: (item: CerebroItem) => void
  onDelete: (item: CerebroItem) => void
  onTogglePin: (item: CerebroItem) => void
  onTagClick: (tag: string) => void
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })

function useCopy() {
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const copy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000)
    } catch {
      setCopiedId(null)
    }
  }
  return { copiedId, copy }
}

export function CerebroColumn({
  tipo,
  title,
  icon: Icon,
  items,
  total,
  emptyText,
  filtered,
  onAdd,
  onEdit,
  onDelete,
  onTogglePin,
  onTagClick,
}: CerebroColumnProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const { copiedId, copy } = useCopy()

  const groups =
    tipo === "link"
      ? Object.entries(
          items.reduce<Record<string, CerebroItem[]>>((acc, item) => {
            const key = item.fixado ? "Fixados" : item.categoria || "Sem categoria"
            ;(acc[key] ||= []).push(item)
            return acc
          }, {}),
        ).sort(([a], [b]) => (a === "Fixados" ? -1 : b === "Fixados" ? 1 : a.localeCompare(b, "pt-BR")))
      : [["", items] as [string, CerebroItem[]]]

  const actions = (item: CerebroItem) => (
    <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
      <IconButton label={item.fixado ? "Desafixar" : "Fixar no topo"} onClick={() => onTogglePin(item)}>
        {item.fixado ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </IconButton>
      <IconButton label="Editar" onClick={() => onEdit(item)}>
        <Pencil className="h-3.5 w-3.5" />
      </IconButton>
      <IconButton label="Excluir" onClick={() => onDelete(item)} danger>
        <Trash2 className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  )

  const tagList = (item: CerebroItem) =>
    item.tags?.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary transition-colors hover:border-primary/50"
          >
            {tag}
          </button>
        ))}
      </div>
    )

  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card",
        tipo === "estrutura" ? "min-h-64 max-h-[620px] lg:col-span-3" : "h-[620px]",
      )}
      aria-label={title}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {filtered ? `${items.length}/${total}` : total}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105"
          aria-label={`Adicionar em ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-muted-foreground text-pretty">
              {filtered ? "Nada encontrado com esse filtro." : emptyText}
            </p>
            {!filtered && (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map(([group, groupItems]) => (
              <div
                key={group || "all"}
                className={cn(tipo === "estrutura" ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-2")}
              >
                {group && (
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                )}
                {groupItems.map((item) => {
                  const expanded = expandedId === item.id

                  if (tipo === "estrutura") {
                    const meta = [item.nicho, item.pais, item.moeda].filter(Boolean) as string[]
                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {item.favicon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.favicon} alt="" className="h-4 w-4" loading="lazy" />
                            ) : (
                              <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                              {item.fixado && <Pin className="h-3 w-3 shrink-0 text-primary" aria-label="Fixado" />}
                              <span className="truncate">{item.titulo}</span>
                            </span>
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-w-0 items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <span className="truncate">{item.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem link</span>
                            )}
                          </div>
                          {item.url && (
                            <IconButton
                              label={copiedId === item.id ? "Copiado!" : "Copiar link da loja"}
                              onClick={() => copy(item.id, item.url ?? "")}
                            >
                              {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                            </IconButton>
                          )}
                          {actions(item)}
                        </div>
                        {meta.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.nicho && <MetaBadge label="Nicho" value={item.nicho} />}
                            {item.pais && <MetaBadge label="País" value={item.pais} />}
                            {item.moeda && <MetaBadge label="Moeda" value={item.moeda} />}
                          </div>
                        )}
                        {item.conteudo && (
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground line-clamp-3">{item.conteudo}</p>
                        )}
                      </div>
                    )
                  }

                  if (tipo === "link") {
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5 transition-colors hover:border-primary/30"
                      >
                        <a
                          href={item.url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {item.favicon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.favicon} alt="" className="h-4 w-4" loading="lazy" />
                            ) : (
                              <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                              {item.fixado && <Pin className="h-3 w-3 shrink-0 text-primary" aria-label="Fixado" />}
                              <span className="truncate">{item.titulo}</span>
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {item.conteudo || item.url?.replace(/^https?:\/\/(www\.)?/, "")}
                            </span>
                          </span>
                        </a>
                        <IconButton label={copiedId === item.id ? "Copiado!" : "Copiar endereço"} onClick={() => copy(item.id, item.url ?? "")}>
                          {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                        </IconButton>
                        {actions(item)}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex flex-col gap-2 rounded-xl border bg-background/40 p-3 transition-colors",
                        expanded ? "border-primary/40" : "border-border hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                          aria-expanded={expanded}
                          className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                        >
                          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            {item.fixado && <Pin className="h-3 w-3 shrink-0 text-primary" aria-label="Fixado" />}
                            <span className="text-pretty">{item.titulo}</span>
                            <ChevronDown
                              className={cn("ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                              aria-hidden="true"
                            />
                          </span>
                          {item.conteudo && (
                            <span
                              className={cn(
                                "whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground",
                                !expanded && "line-clamp-2",
                              )}
                            >
                              {item.conteudo}
                            </span>
                          )}
                        </button>
                        {tipo === "modelo" && (
                          <button
                            type="button"
                            onClick={() => copy(item.id, item.conteudo)}
                            title={copiedId === item.id ? "Copiado!" : "Copiar prompt"}
                            aria-label={copiedId === item.id ? "Prompt copiado" : "Copiar prompt completo"}
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                              copiedId === item.id
                                ? "border-primary/50 bg-primary/20 text-primary"
                                : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                            )}
                          >
                            {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {actions(item)}
                      </div>

                      {tagList(item)}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">{dateFormatter.format(new Date(item.created_at))}</span>
                        {tipo === "modelo" && (
                          <button
                            type="button"
                            onClick={() => copy(item.id, item.conteudo)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                              copiedId === item.id
                                ? "bg-primary/20 text-primary"
                                : "bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                          >
                            {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedId === item.id ? "Copiado!" : "Copiar"}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-white/5 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
