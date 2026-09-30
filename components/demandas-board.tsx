"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Check, X, Loader2, CalendarCheck, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createDemanda,
  toggleDemanda,
  deleteDemanda,
  reorderDemandas,
  type Demanda,
} from "@/app/actions/demandas-actions"

const SECTION_PRESETS = [
  { key: "MANHA", title: "☀️ MANHÃ" },
  { key: "TARDE", title: "🌙 TARDE" },
  { key: "NOITE", title: "🌌 NOITE" },
]

function sectionKey(title: string): string | null {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
  return SECTION_PRESETS.some((s) => s.key === normalized) ? normalized : null
}

const isSection = (d: Demanda) => sectionKey(d.title) !== null

function sortByPosition(a: Demanda, b: Demanda) {
  const pa = a.position ?? Number.MAX_SAFE_INTEGER
  const pb = b.position ?? Number.MAX_SAFE_INTEGER
  return pa - pb || a.id - b.id
}

const DAYS = [
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
]

interface DemandasBoardProps {
  initialDemandas: Demanda[]
  weekStart: string
}

export function DemandasBoard({ initialDemandas, weekStart }: DemandasBoardProps) {
  const [demandas, setDemandas] = useState<Demanda[]>(initialDemandas)
  const [addingDay, setAddingDay] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tasks = demandas.filter((d) => !isSection(d))
  const totalCount = tasks.length
  const completedCount = tasks.filter((d) => d.completed).length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleMove = (dayOfWeek: number, id: number, direction: -1 | 1) => {
    const dayList = demandas.filter((d) => d.day_of_week === dayOfWeek).sort(sortByPosition)
    const index = dayList.findIndex((d) => d.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= dayList.length) return

    const reordered = [...dayList]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const positions = new Map(reordered.map((d, i) => [d.id, i + 1]))
    const previous = demandas

    setDemandas((prev) => prev.map((d) => (positions.has(d.id) ? { ...d, position: positions.get(d.id)! } : d)))
    startTransition(async () => {
      const result = await reorderDemandas(reordered.map((d) => d.id))
      if (!result.success) {
        setDemandas(previous)
        setError(result.error || "Erro ao mover demanda")
      }
    })
  }

  const handleAdd = (dayOfWeek: number, presetTitle?: string) => {
    const title = (presetTitle ?? newTitle).trim()
    if (!title) return
    setError(null)

    startTransition(async () => {
      const result = await createDemanda({ title, dayOfWeek, weekStart })
      if (result.success && result.demanda) {
        setDemandas((prev) => [...prev, result.demanda as Demanda])
        setNewTitle("")
        setAddingDay(null)
      } else {
        setError(result.error || "Erro ao adicionar demanda")
      }
    })
  }

  const handleToggle = (id: number, current: boolean) => {
    setDemandas((prev) => prev.map((d) => (d.id === id ? { ...d, completed: !current } : d)))
    startTransition(async () => {
      const result = await toggleDemanda(id, !current)
      if (!result.success) {
        setDemandas((prev) => prev.map((d) => (d.id === id ? { ...d, completed: current } : d)))
      }
    })
  }

  const handleDelete = (id: number) => {
    const previous = demandas
    setDemandas((prev) => prev.filter((d) => d.id !== id))
    startTransition(async () => {
      const result = await deleteDemanda(id)
      if (!result.success) {
        setDemandas(previous)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, dayOfWeek: number) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd(dayOfWeek)
    }
    if (e.key === "Escape") {
      setAddingDay(null)
      setNewTitle("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/50" />
          <h2 className="text-2xl font-bold text-foreground">Demandas</h2>
        </div>
        <p className="mt-1 pl-4 text-sm text-muted-foreground">Organize as entregas da semana.</p>
      </div>

      {/* Resumo geral da semana */}
      <Card className="border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progresso da semana</p>
              <p className="text-lg font-semibold text-foreground">
                {completedCount} de {totalCount} demandas concluídas
              </p>
            </div>
          </div>
          <div className="min-w-48 flex-1 sm:max-w-xs">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Conclusão</span>
              <span className="font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          {error}
        </div>
      )}

      {/* Colunas dos dias */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {DAYS.map((day) => {
          const dayDemandas = demandas.filter((d) => d.day_of_week === day.value).sort(sortByPosition)
          const dayTasks = dayDemandas.filter((d) => !isSection(d))
          const dayCompleted = dayTasks.filter((d) => d.completed).length

          return (
            <div key={day.value} className="flex flex-col rounded-xl border border-border bg-card/50">
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between border-b border-border p-3">
                <p className="font-semibold text-foreground">{day.label}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    dayTasks.length > 0 && dayCompleted === dayTasks.length
                      ? "bg-green-500/15 text-green-500"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {dayCompleted}/{dayTasks.length}
                </span>
              </div>

              {/* Lista de demandas */}
              <div className="flex-1 space-y-2 p-3">
                {dayDemandas.length === 0 && addingDay !== day.value && (
                  <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma demanda ainda.</p>
                )}

                {dayDemandas.map((demanda, index) => {
                  const moveControls = (
                    <div className="flex shrink-0 flex-col opacity-40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        onClick={() => handleMove(day.value, demanda.id, -1)}
                        disabled={index === 0}
                        aria-label="Mover para cima"
                        className="rounded text-muted-foreground hover:text-primary disabled:pointer-events-none disabled:opacity-20"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMove(day.value, demanda.id, 1)}
                        disabled={index === dayDemandas.length - 1}
                        aria-label="Mover para baixo"
                        className="rounded text-muted-foreground hover:text-primary disabled:pointer-events-none disabled:opacity-20"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  )

                  if (isSection(demanda)) {
                    return (
                      <div key={demanda.id} className="group flex items-center gap-2 pt-2 first:pt-0">
                        {moveControls}
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary">
                          {demanda.title}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
                        <button
                          onClick={() => handleDelete(demanda.id)}
                          aria-label="Excluir seção"
                          className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  }

                  return (
                  <div
                    key={demanda.id}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5"
                  >
                    {moveControls}
                    <button
                      onClick={() => handleToggle(demanda.id, demanda.completed)}
                      aria-label={demanda.completed ? "Marcar como pendente" : "Marcar como concluída"}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                        demanda.completed
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-muted-foreground/40 hover:border-primary",
                      )}
                    >
                      {demanda.completed && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 break-words text-sm transition-colors",
                        demanda.completed ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {demanda.title}
                    </span>
                    <button
                      onClick={() => handleDelete(demanda.id)}
                      aria-label="Excluir demanda"
                      className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  )
                })}

                {/* Campo inline para adicionar */}
                {addingDay === day.value && (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, day.value)}
                      onBlur={() => {
                        if (!newTitle.trim()) setAddingDay(null)
                      }}
                      placeholder="Nome da demanda..."
                      className="h-9 text-sm"
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={isPending || !newTitle.trim()}
                      onClick={() => handleAdd(day.value)}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Botão adicionar */}
              <div className="flex flex-col gap-2 p-3 pt-0">
                <div className="flex items-center justify-center gap-2">
                  {SECTION_PRESETS.slice(0, 2).map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => handleAdd(day.value, preset.title)}
                      disabled={isPending}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
                    >
                      + {preset.title}
                    </button>
                  ))}
                </div>
                {addingDay !== day.value && (
                  <Button
                    variant="ghost"
                    className="w-full justify-center gap-2 border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    onClick={() => {
                      setError(null)
                      setNewTitle("")
                      setAddingDay(day.value)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
