"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Phone, User, Trash2, Edit, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getMeetingsByDate,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getComercialUsers,
} from "@/app/actions/meeting-actions"

const TIME_SLOTS = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
]

interface Meeting {
  id: string
  meeting_date: string
  meeting_time: string
  lead_name: string
  lead_phone: string
  attendant_user_id: number
  performer_user_id: number
  attendant_name: string
  performer_name: string
  reason: string
  status: string
}

interface ComercialUser {
  id: number
  name: string
  username: string
  role: string
}

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

function formatDateBR(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function formatDateShort(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("pt-BR")
}

export function MeetingsScheduler({ currentUserId }: { currentUserId: number }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [comercialUsers, setComercialUsers] = useState<ComercialUser[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    lead_name: "",
    lead_phone: "",
    meeting_time: "",
    attendant_user_id: "",
    performer_user_id: "",
    reason: "",
  })

  useEffect(() => {
    loadMeetings()
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const loadMeetings = async () => {
    const result = await getMeetingsByDate(selectedDate)
    if (result.success) {
      setMeetings(result.meetings as Meeting[])
    }
  }

  const loadUsers = async () => {
    const result = await getComercialUsers()
    if (result.success) {
      setComercialUsers(result.users as ComercialUser[])
    }
  }

  // ✅ Agora clicar no slot SEMPRE cria uma nova reunião naquele horário
  const handleCreateAtSlot = (time: string) => {
    setEditingMeeting(null)
    setFormData({
      lead_name: "",
      lead_phone: "",
      meeting_time: time,
      attendant_user_id: String(currentUserId),
      performer_user_id: "",
      reason: "",
    })
    setSelectedSlot(time)
    setIsDialogOpen(true)
    setError(null)
  }

  // ✅ Edição agora é por reunião (pela lista do dia)
  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setFormData({
      lead_name: meeting.lead_name,
      lead_phone: formatPhoneNumber(meeting.lead_phone),
      meeting_time: meeting.meeting_time.slice(0, 5),
      attendant_user_id: String(meeting.attendant_user_id),
      performer_user_id: String(meeting.performer_user_id),
      reason: meeting.reason,
    })
    setSelectedSlot(meeting.meeting_time.slice(0, 5))
    setIsDialogOpen(true)
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)

    if (
      !formData.lead_name ||
      !formData.lead_phone ||
      !formData.meeting_time ||
      !formData.attendant_user_id ||
      !formData.performer_user_id ||
      !formData.reason
    ) {
      setError("Todos os campos são obrigatórios")
      return
    }

    startTransition(async () => {
      if (editingMeeting) {
        const result = await updateMeeting(editingMeeting.id, {
          lead_name: formData.lead_name,
          lead_phone: formData.lead_phone.replace(/\D/g, ""),
          attendant_user_id: Number(formData.attendant_user_id),
          performer_user_id: Number(formData.performer_user_id),
          reason: formData.reason,
        })
        if (!result.success) {
          setError(result.error || "Erro ao atualizar reunião")
          return
        }
      } else {
        const result = await createMeeting({
          meeting_date: selectedDate,
          meeting_time: formData.meeting_time,
          lead_name: formData.lead_name,
          lead_phone: formData.lead_phone.replace(/\D/g, ""),
          attendant_user_id: Number(formData.attendant_user_id),
          performer_user_id: Number(formData.performer_user_id),
          reason: formData.reason,
        })
        if (!result.success) {
          setError(result.error || "Erro ao criar reunião")
          return
        }
      }

      setIsDialogOpen(false)
      loadMeetings()
    })
  }

  const handleDelete = async () => {
    if (!editingMeeting) return

    startTransition(async () => {
      const result = await deleteMeeting(editingMeeting.id)
      if (result.success) {
        setIsDialogOpen(false)
        loadMeetings()
      } else {
        setError(result.error || "Erro ao deletar reunião")
      }
    })
  }

  const handleStatusChange = async (meetingId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateMeeting(meetingId, { status: newStatus })
      if (result.success) {
        loadMeetings()
      }
    })
  }

  const changeDate = (days: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const getReasonColor = (reason: string) => {
    if (reason === "Mentoria") {
      return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    }

    if (reason === "Onboarding") {
      return "bg-orange-500/15 text-orange-400 border-orange-500/30"
    }

    // Planos (default)
    return "bg-blue-500/20 text-blue-400 border-blue-500/30"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Compra":
        return "bg-green-500/20 text-green-400 border border-green-500/30"

      case "Realizado":
        return "bg-green-500/10 text-green-400 border border-green-500/30"

      case "Talvez":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"

      case "Não compra":
        return "bg-red-500/20 text-red-400 border border-red-500/30"

      case "Pendente":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"

      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação de data */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Agenda de Reuniões
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-2 bg-secondary rounded-lg text-sm font-medium text-foreground min-w-[140px] text-center">
                {formatDateShort(selectedDate)}
              </div>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground capitalize">{formatDateBR(selectedDate)}</p>
        </CardHeader>
      </Card>

      {/* Grade de horários */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horários Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {TIME_SLOTS.map((time) => {
              // ✅ Agora pode ter mais de uma reunião por horário
              const meetingsAtTime = meetings.filter((m) => m.meeting_time === time + ":00")
              const isBooked = meetingsAtTime.length > 0
              const firstMeeting = meetingsAtTime[0]

              return (
                <Button
                  key={time}
                  variant={isBooked ? "secondary" : "outline"}
                  className={cn(
                    "h-auto py-3 flex flex-col items-start gap-1 relative",
                    isBooked && "border-primary/50 bg-primary/5",
                  )}
                  // ✅ clicar no slot abre CRIAÇÃO (não edição)
                  onClick={() => handleCreateAtSlot(time)}
                >
                  <span
                    className={cn(
                      "text-sm font-bold px-2 py-0.5 rounded-full",
                      isBooked ? "bg-primary/20 text-primary" : "text-foreground",
                    )}
                  >
                    {time}
                  </span>

                  {isBooked ? (
                    <>
                      <span className="text-xs text-muted-foreground truncate w-full text-left">
                        {firstMeeting.lead_name}
                        {meetingsAtTime.length > 1 ? ` (+${meetingsAtTime.length - 1})` : ""}
                      </span>
                      <Badge className={cn("text-xs", getReasonColor(firstMeeting.reason))}>{firstMeeting.reason}</Badge>
                      <Badge className={cn("text-xs", getStatusColor(firstMeeting.status))}>{firstMeeting.status}</Badge>
                      <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Adicionar mais
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Disponível
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de reuniões do dia */}
      {meetings.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Reuniões do Dia ({meetings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-secondary/50 border border-border"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {meeting.meeting_time.slice(0, 5)}
                      </span>
                      <span className="font-semibold text-foreground">{meeting.lead_name}</span>
                      <Badge variant="outline" className={getReasonColor(meeting.reason)}>
                        {meeting.reason}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Phone className="h-3 w-3 text-primary" />
                        {formatPhoneNumber(meeting.lead_phone)}
                      </span>
                      <span className="flex items-center gap-1 text-foreground">
                        <User className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">Atendente:</span>{" "}
                        <span className="font-medium">{meeting.attendant_name}</span>
                      </span>
                      <span className="flex items-center gap-1 text-foreground">
                        <User className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">Realizador:</span>{" "}
                        <span className="font-medium">{meeting.performer_name}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                      <Select value={meeting.status} onValueChange={(value) => handleStatusChange(meeting.id, value)}>
                        <SelectTrigger className={cn("w-36", getStatusColor(meeting.status))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Compra">Compra</SelectItem>
                          <SelectItem value="Realizado">Realizado</SelectItem>
                          <SelectItem value="Talvez">Talvez</SelectItem>
                          <SelectItem value="Não compra">Não compra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleEditMeeting(meeting)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingMeeting ? "Editar Reunião" : "Nova Reunião"}</DialogTitle>
            <DialogDescription>
              {selectedSlot && `Horário: ${selectedSlot} - ${formatDateBR(selectedDate)}`}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead_name" className="text-foreground">
                Nome do Lead *
              </Label>
              <Input
                id="lead_name"
                value={formData.lead_name}
                onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                placeholder="Nome completo do lead"
                className="bg-secondary border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_phone" className="text-foreground">
                Telefone do Lead *
              </Label>
              <Input
                id="lead_phone"
                value={formData.lead_phone}
                onChange={(e) => setFormData({ ...formData, lead_phone: formatPhoneNumber(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="bg-secondary border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_time" className="text-foreground">
                Horário *
              </Label>
              <Select
                value={formData.meeting_time}
                onValueChange={(value) => setFormData({ ...formData, meeting_time: value })}
                disabled={!!editingMeeting}
              >
                <SelectTrigger className="bg-secondary border-input text-foreground">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>

                {/* ✅ agora não desabilita mais horários "ocupados" */}
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendant" className="text-foreground">
                Atendente *
              </Label>
              <Select
                value={formData.attendant_user_id}
                onValueChange={(value) => setFormData({ ...formData, attendant_user_id: value })}
              >
                <SelectTrigger className="bg-secondary border-input text-foreground">
                  <SelectValue placeholder="Selecione o atendente" />
                </SelectTrigger>
                <SelectContent>
                  {comercialUsers.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performer" className="text-foreground">
                Realizador *
              </Label>
              <Select
                value={formData.performer_user_id}
                onValueChange={(value) => setFormData({ ...formData, performer_user_id: value })}
              >
                <SelectTrigger className="bg-secondary border-input text-foreground">
                  <SelectValue placeholder="Selecione o realizador" />
                </SelectTrigger>
                <SelectContent>
                  {comercialUsers.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-foreground">
                Motivo *
              </Label>
              <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
                <SelectTrigger className="bg-secondary border-input text-foreground">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mentoria">Mentoria</SelectItem>
                  <SelectItem value="Planos">Planos</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingMeeting && (
              <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Excluir
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingMeeting ? "Salvar Alterações" : "Criar Reunião"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
