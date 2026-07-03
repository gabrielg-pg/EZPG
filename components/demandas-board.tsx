"use client"

import type React from "react"

import { useMemo, useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Check, X, Loader2, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { createDemanda, toggleDemanda, deleteDemanda, type Demanda } from "@/app/actions/demandas-actions"

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

  // Datas de cada coluna a partir da segunda-feira (weekStart)
  const dayDates = useMemo(() => {
    const map: Record<number, Date> = {}
    const [y, m, d] = weekStart.split("-").map(Number)
    const monday = new Date(y, m - 1, d)
    DAYS.forEach((day) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + (day.value - 1))
      map[day.value] = date
    })
    return map
  }, [weekStart])

  const totalCount = demandas.length
  const completedCount = demandas.filter((d) => d.completed).length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAdd = (dayOfWeek: number) => {
    if (!newTitle.trim()) return
    setError(null)
    const title = newTitle.trim()

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
          const dayDemandas = demandas.filter((d) => d.day_of_week === day.value)
          const dayCompleted = dayDemandas.filter((d) => d.completed).length
          const date = dayDates[day.value]
          const dateLabel = date
            ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
            : ""

          return (
            <div key={day.value} className="flex flex-col rounded-xl border border-border bg-card/50">
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between border-b border-border p-3">
                <div>
                  <p className="font-semibold text-foreground">{day.label}</p>
                  <p className="text-xs text-muted-foreground">{dateLabel}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    dayDemandas.length > 0 && dayCompleted === dayDemandas.length
                      ? "bg-green-500/15 text-green-500"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {dayCompleted}/{dayDemandas.length}
                </span>
              </div>

              {/* Lista de demandas */}
              <div className="flex-1 space-y-2 p-3">
                {dayDemandas.length === 0 && addingDay !== day.value && (
                  <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma demanda ainda.</p>
                )}

                {dayDemandas.map((demanda) => (
                  <div
                    key={demanda.id}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5"
                  >
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
                ))}

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
              <div className="p-3 pt-0">
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
