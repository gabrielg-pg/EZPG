"use client"

import React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Phone, User, Trash2, Edit, Plus, ChevronLeft, ChevronRight, Loader2, Eye, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getMeetingsByDate,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getComercialUsers,
} from "@/app/actions/meeting-actions"

const TIME_SLOTS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
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
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
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
  observations?: string
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
    observations: "",
  })

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [detailsSlotTime, setDetailsSlotTime] = useState<string | null>(null)

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
      attendant_user_id: "",
      performer_user_id: "",
      reason: "",
      observations: "",
    })
    setSelectedSlot(time)
    setIsDialogOpen(true)
    setError(null)
  }

  // Abre o dialog de detalhes para um horário específico
  const handleOpenDetails = (time: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailsSlotTime(time)
    setDetailsDialogOpen(true)
  }

  // Abre detalhes de uma reunião específica (da lista do dia)
  const handleOpenMeetingDetails = (meeting: Meeting) => {
    setDetailsSlotTime(meeting.meeting_time.slice(0, 5))
    setDetailsDialogOpen(true)
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
      observations: meeting.observations || "",
    })
    setSelectedSlot(meeting.meeting_time.slice(0, 5))
    setIsDialogOpen(true)
    setDetailsDialogOpen(false)
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
          observations: formData.observations || undefined,
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
          observations: formData.observations || undefined,
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

        case "Reunião Confirmada":
        return "bg-green-500/20 text-green-400 border border-green-500/30"

      case "Realizado":
        return "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"

      case "Reagendar":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30"

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
      {/* Header com navegacao de data */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Agenda de Reunioes
              </CardTitle>
              <p className="text-muted-foreground capitalize mt-1 ml-12">{formatDateBR(selectedDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="rounded-xl h-10 w-10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-sm font-semibold text-foreground min-w-[140px] text-center">
                {formatDateShort(selectedDate)}
              </div>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="rounded-xl h-10 w-10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grade de horarios */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horarios Disponiveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {TIME_SLOTS.map((time) => {
              const meetingsAtTime = meetings.filter((m) => m.meeting_time === time + ":00")
              const isBooked = meetingsAtTime.length > 0
              const firstMeeting = meetingsAtTime[0]

              return (
                <div
                  key={time}
                  className={cn(
                    "h-auto py-3 flex flex-col items-start gap-1.5 relative rounded-xl border cursor-pointer transition-all duration-200",
                    isBooked
                      ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
                      : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/30",
                  )}
                  onClick={() => handleCreateAtSlot(time)}
                >
                  <div className="w-full px-3">
                    <span
                      className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded-full",
                        isBooked ? "bg-[rgba(139,92,246,0.2)] text-[#A855F7]" : "text-white",
                      )}
                    >
                      {time}
                    </span>
                  </div>

                  <div className="w-full px-3">
                    {isBooked ? (
                      <>
                        <span className="text-xs text-[#9CA3AF] truncate block w-full text-left">
                          {firstMeeting.lead_name}
                          {meetingsAtTime.length > 1 ? ` (+${meetingsAtTime.length - 1})` : ""}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className={cn("text-xs", getReasonColor(firstMeeting.reason))}>
                            {firstMeeting.reason}
                          </Badge>
                          <Badge className={cn("text-xs", getStatusColor(firstMeeting.status))}>
                            {firstMeeting.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2 w-full">
                          <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Adicionar
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs bg-[rgba(139,92,246,0.15)] hover:bg-[rgba(139,92,246,0.25)] text-white"
                            onClick={(e) => handleOpenDetails(time, e)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Disponível
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de reunioes do dia */}
      {meetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Reunioes do Dia ({meetings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)]"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg text-[#A855F7] bg-[rgba(139,92,246,0.2)] px-3 py-1 rounded-full">
                        {meeting.meeting_time.slice(0, 5)}
                      </span>
                      <span className="font-semibold text-white">{meeting.lead_name}</span>
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
                          <SelectItem value="Reunião Confirmada">Reunião Confirmada</SelectItem>
                          <SelectItem value="Reagendar">Reagendar</SelectItem>
                          <SelectItem value="Talvez">Talvez</SelectItem>
                          <SelectItem value="Não compra">Não compra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenMeetingDetails(meeting)}
                      title="Ver detalhes"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditMeeting(meeting)} title="Editar">
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

            <div className="space-y-2">
              <Label htmlFor="observations" className="text-foreground">
                Observações
              </Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observações adicionais sobre a reunião..."
                className="bg-secondary border-input text-foreground min-h-[80px]"
              />
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

      {/* Dialog de Detalhes das Reuniões */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Reuniões às {detailsSlotTime}
            </DialogTitle>
            <DialogDescription>{formatDateBR(selectedDate)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {meetings
              .filter((m) => m.meeting_time === detailsSlotTime + ":00")
              .map((meeting) => (
                <div key={meeting.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{meeting.lead_name}</span>
                      <Badge variant="outline" className={getReasonColor(meeting.reason)}>
                        {meeting.reason}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditMeeting(meeting)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <p className="text-foreground font-medium">{formatPhoneNumber(meeting.lead_phone)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atendente:</span>
                      <p className="text-foreground font-medium">{meeting.attendant_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Realizador:</span>
                      <p className="text-foreground font-medium">{meeting.performer_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Motivo:</span>
                      <p className="text-foreground font-medium">{meeting.reason}</p>
                    </div>
                  </div>

                  {meeting.observations && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground text-sm">Observações:</span>
                      <p className="text-foreground text-sm mt-1 whitespace-pre-wrap">{meeting.observations}</p>
                    </div>
                  )}
                </div>
              ))}

            {meetings.filter((m) => m.meeting_time === detailsSlotTime + ":00").length === 0 && (
              <p className="text-muted-foreground text-center py-4">Nenhuma reunião neste horário</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="bg-transparent">
              Fechar
            </Button>
            <Button
              onClick={() => {
                setDetailsDialogOpen(false)
                if (detailsSlotTime) handleCreateAtSlot(detailsSlotTime)
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Reunião
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
