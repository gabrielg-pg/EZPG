"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, Check, CheckCircle2, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Demanda,
  createDemanda,
  deleteDemanda,
  completeDemanda,
} from "@/app/actions/demandas-actions"

interface Member {
  id: string
  name: string
  initials: string
  color: string
  bgColor: string
}

const MEMBERS: Member[] = [
  { id: "alisson", name: "Alisson Jordi", initials: "AJ", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  { id: "luiz_gabriel", name: "Luiz Gabriel", initials: "LG", color: "text-teal-400", bgColor: "bg-teal-500/20" },
  { id: "luis_claudio", name: "Luis Claudio", initials: "LC", color: "text-blue-400", bgColor: "bg-blue-500/20" },
]

const LABELS = {
  hoje: { label: "Hoje", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  rotina: { label: "Rotina", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
}

interface DemandasBoardProps {
  initialDemandas: Demanda[]
  completedToday: Demanda[]
  isAdmin: boolean
}

export function DemandasBoard({ initialDemandas, completedToday, isAdmin }: DemandasBoardProps) {
  const [demandas, setDemandas] = useState<Demanda[]>(initialDemandas)
  const [completed, setCompleted] = useState<Demanda[]>(completedToday)
  const [isPending, startTransition] = useTransition()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskLabel, setNewTaskLabel] = useState<"hoje" | "urgente" | "rotina">("rotina")
  const [fadingOut, setFadingOut] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get current date formatted
  const today = new Date()
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const getMemberDemandas = (memberId: string) => {
    return demandas.filter((d) => d.member_id === memberId && !d.completed)
  }

  const getMemberStats = (memberId: string) => {
    const memberTasks = demandas.filter((d) => d.member_id === memberId)
    const completedTasks = memberTasks.filter((d) => d.completed)
    return {
      total: memberTasks.length,
      completed: completedTasks.length,
      percentage: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
    }
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedMember) return
    setError(null)

    startTransition(async () => {
      try {
        const result = await createDemanda({
          member_id: selectedMember,
          title: newTaskTitle.trim(),
          label: newTaskLabel,
        })

        if (result.success) {
          // Optimistically add to UI
          const newDemanda: Demanda = {
            id: Date.now(), // Temporary ID
            member_id: selectedMember,
            title: newTaskTitle.trim(),
            label: newTaskLabel,
            completed: false,
            completed_at: null,
            completed_date: null,
            created_at: new Date().toISOString(),
          }
          setDemandas([newDemanda, ...demandas])
          setNewTaskTitle("")
          setNewTaskLabel("rotina")
          setAddDialogOpen(false)
        } else {
          setError(result.error || "Erro ao criar tarefa")
        }
      } catch (err) {
        console.error("[v0] Error creating demanda:", err)
        setError("Erro inesperado ao criar tarefa")
      }
    })
  }

  const handleCompleteTask = (demanda: Demanda) => {
    setFadingOut(demanda.id)

    setTimeout(() => {
      startTransition(async () => {
        const result = await completeDemanda(demanda.id)

        if (result.success) {
          // Update local state
          const completedDemanda = {
            ...demanda,
            completed: true,
            completed_at: new Date().toISOString(),
            completed_date: new Date().toISOString().split("T")[0],
          }
          setDemandas(demandas.filter((d) => d.id !== demanda.id))
          setCompleted([completedDemanda, ...completed])
        }
        setFadingOut(null)
      })
    }, 250)
  }

  const handleDeleteTask = (id: number) => {
    startTransition(async () => {
      const result = await deleteDemanda(id)
      if (result.success) {
        setDemandas(demandas.filter((d) => d.id !== id))
      }
    })
  }

  const formatCompletedTime = (completedAt: string | null) => {
    if (!completedAt) return ""
    const date = new Date(completedAt)
    return `${date.getHours().toString().padStart(2, "0")}h${date.getMinutes().toString().padStart(2, "0")}`
  }

  const getMemberById = (id: string) => MEMBERS.find((m) => m.id === id)

  return (
    <div className="space-y-6">
      {/* Header with date badge */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Demandas</h1>
        <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-4 py-2 text-sm capitalize">
          {formattedDate}
        </Badge>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MEMBERS.map((member) => {
          const memberDemandas = getMemberDemandas(member.id)
          const stats = getMemberStats(member.id)

          return (
            <Card key={member.id} className="bg-card/50 border-border backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                        member.bgColor,
                        member.color
                      )}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <CardTitle className="text-base text-foreground">{member.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {stats.completed}/{stats.total} feitas
                      </p>
                    </div>
                  </div>
                  {/* Add button (admin only) */}
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        setSelectedMember(member.id)
                        setError(null)
                        setAddDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {/* Progress bar */}
                <Progress value={stats.percentage} className="h-1.5 mt-3 bg-secondary" />
              </CardHeader>
              <CardContent className="space-y-2">
                {memberDemandas.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Tudo concluído!</p>
                  </div>
                ) : (
                  memberDemandas.map((demanda) => (
                    <div
                      key={demanda.id}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-all duration-250",
                        fadingOut === demanda.id && "opacity-0 scale-95"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleCompleteTask(demanda)}
                        disabled={isPending}
                        className="h-5 w-5 rounded border-2 border-muted-foreground/50 hover:border-primary flex items-center justify-center transition-colors shrink-0"
                      >
                        {isPending && fadingOut === demanda.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                      </button>
                      {/* Task content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{demanda.title}</p>
                      </div>
                      {/* Label */}
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", LABELS[demanda.label].color)}
                      >
                        {LABELS[demanda.label].label}
                      </Badge>
                      {/* Delete button (admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTask(demanda.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Completed Today Section */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground">Concluídas hoje</CardTitle>
              <p className="text-xs text-muted-foreground">
                {completed.length} {completed.length === 1 ? "atividade" : "atividades"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade concluída ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completed.map((demanda) => {
                const member = getMemberById(demanda.member_id)
                return (
                  <div
                    key={demanda.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="flex-1 text-sm text-muted-foreground line-through truncate">
                      {demanda.title}
                    </p>
                    {member && (
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", member.bgColor, member.color, "border-transparent")}
                      >
                        {member.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatCompletedTime(demanda.completed_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Nova Tarefa
            </DialogTitle>
          </DialogHeader>
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Membro</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="bg-secondary/50 border-input">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {MEMBERS.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold",
                            member.bgColor,
                            member.color
                          )}
                        >
                          {member.initials}
                        </div>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tarefa</label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Descreva a tarefa..."
                className="bg-secondary/50 border-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Etiqueta</label>
              <Select value={newTaskLabel} onValueChange={(v) => setNewTaskLabel(v as typeof newTaskLabel)}>
                <SelectTrigger className="bg-secondary/50 border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="hoje">
                    <Badge variant="outline" className={LABELS.hoje.color}>
                      Hoje
                    </Badge>
                  </SelectItem>
                  <SelectItem value="urgente">
                    <Badge variant="outline" className={LABELS.urgente.color}>
                      Urgente
                    </Badge>
                  </SelectItem>
                  <SelectItem value="rotina">
                    <Badge variant="outline" className={LABELS.rotina.color}>
                      Rotina
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={isPending || !newTaskTitle.trim() || !selectedMember}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Tarefa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
