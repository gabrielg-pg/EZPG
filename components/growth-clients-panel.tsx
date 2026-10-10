"use client"

import type { ReactNode } from "react"
import { useState, useMemo, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Clock,
  PauseCircle,
  DollarSign,
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
  Pause,
  Play,
  Ban,
  Pencil,
  Trash2,
  History,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type GrowthClient,
  type ClientCycle,
  type ContractStatus,
  type PaymentStatus,
  type TabStatus,
  CONTRACT_STATUSES,
  PAYMENT_STATUSES,
  CONTRACT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  DEFAULT_RESPONSIBLE,
  daysRemaining,
  rowAlert,
  formatCurrency,
  formatDateBR,
  toDateInput,
} from "@/lib/growth-clients"
import {
  createGrowthClient,
  updateGrowthClient,
  deleteGrowthClient,
  renewGrowthClient,
  pauseGrowthClient,
  reactivateGrowthClient,
  notRenewGrowthClient,
  getClientHistory,
} from "@/app/actions/growth-clients-actions"

const CONTRACT_BADGE: Record<ContractStatus, string> = {
  ativo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  renovado: "bg-primary/15 text-primary border-primary/30",
  vencido: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  inadimplente: "bg-orange-500/15 text-orange-400 border-orange-500/30",
}

const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  pago: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  aguardando: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  atrasado: "bg-rose-500/15 text-rose-400 border-rose-500/30",
}

type TabKey = TabStatus

export function GrowthClientsPanel({ initialClients }: { initialClients: GrowthClient[] }) {
  const [clients, setClients] = useState<GrowthClient[]>(initialClients)
  const [tab, setTab] = useState<TabKey>("ativos")
  const [search, setSearch] = useState("")
  const [contractFilter, setContractFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()

  // Modais
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GrowthClient | null>(null)
  const [notRenewTarget, setNotRenewTarget] = useState<GrowthClient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GrowthClient | null>(null)
  const [historyClient, setHistoryClient] = useState<GrowthClient | null>(null)

  const responsibles = useMemo(() => {
    const set = new Set(clients.map((c) => c.responsible).filter(Boolean))
    return Array.from(set)
  }, [clients])

  // Contagens dos cards — apenas Ativos (exceto Pausados)
  const ativos = useMemo(() => clients.filter((c) => c.tab_status === "ativos"), [clients])
  const pausados = useMemo(() => clients.filter((c) => c.tab_status === "pausados"), [clients])
  const naoRenovados = useMemo(() => clients.filter((c) => c.tab_status === "nao_renovados"), [clients])

  const vencendo7 = useMemo(
    () => ativos.filter((c) => daysRemaining(c.cycle_end) <= 7).length,
    [ativos]
  )
  const mrr = useMemo(
    () => ativos.reduce((sum, c) => sum + (Number.parseFloat(String(c.monthly_value)) || 0), 0),
    [ativos]
  )

  const currentList = tab === "ativos" ? ativos : tab === "pausados" ? pausados : naoRenovados

  const filtered = useMemo(() => {
    return currentList.filter((c) => {
      if (search && !c.brand_name.toLowerCase().includes(search.toLowerCase())) return false
      if (contractFilter !== "all" && c.contract_status !== contractFilter) return false
      if (paymentFilter !== "all" && c.payment_status !== paymentFilter) return false
      if (responsibleFilter !== "all" && c.responsible !== responsibleFilter) return false
      return true
    })
  }, [currentList, search, contractFilter, paymentFilter, responsibleFilter])

  // ---- Ações ----
  const doRenew = (c: GrowthClient) =>
    startTransition(async () => {
      await renewGrowthClient(c.id)
      window.location.reload()
    })

  const doPause = (c: GrowthClient) =>
    startTransition(async () => {
      await pauseGrowthClient(c.id, daysRemaining(c.cycle_end))
      window.location.reload()
    })

  const doReactivate = (c: GrowthClient) =>
    startTransition(async () => {
      await reactivateGrowthClient(c.id)
      window.location.reload()
    })

  const confirmNotRenew = (reason: string) => {
    if (!notRenewTarget) return
    const id = notRenewTarget.id
    setNotRenewTarget(null)
    startTransition(async () => {
      await notRenewGrowthClient(id, reason)
      window.location.reload()
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    startTransition(async () => {
      await deleteGrowthClient(id)
      window.location.reload()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Growth Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Gestão de contratos de tráfego pago — ciclos, renovações e cobrança.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Clientes Ativos"
          value={String(ativos.length)}
          icon={<Users className="h-5 w-5" />}
          tone="emerald"
        />
        <SummaryCard
          label="Vencendo em 7 dias"
          value={String(vencendo7)}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <SummaryCard
          label="Pausados"
          value={String(pausados.length)}
          icon={<PauseCircle className="h-5 w-5" />}
          tone="slate"
        />
        <SummaryCard
          label="Faturamento Mensal (MRR)"
          value={formatCurrency(mrr)}
          icon={<DollarSign className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {[
          { key: "ativos" as const, label: `Ativos (${ativos.length})` },
          { key: "pausados" as const, label: `Pausados (${pausados.length})` },
          { key: "nao_renovados" as const, label: `Não Renovados (${naoRenovados.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os contratos</SelectItem>
              {CONTRACT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTRACT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos pagamentos</SelectItem>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PAYMENT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos responsáveis</SelectItem>
              {responsibles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Marca</TableHead>
                <TableHead className="text-muted-foreground">Início</TableHead>
                <TableHead className="text-muted-foreground">Término</TableHead>
                {tab === "pausados" ? (
                  <TableHead className="text-muted-foreground">Pausado em</TableHead>
                ) : tab === "nao_renovados" ? (
                  <TableHead className="text-muted-foreground">Saída</TableHead>
                ) : null}
                <TableHead className="text-muted-foreground">
                  {tab === "nao_renovados" ? "Motivo" : "Dias restantes"}
                </TableHead>
                <TableHead className="text-muted-foreground">Mensalidade</TableHead>
                <TableHead className="text-muted-foreground">Ciclo</TableHead>
                {tab === "ativos" && (
                  <>
                    <TableHead className="text-muted-foreground">Contrato</TableHead>
                    <TableHead className="text-muted-foreground">Pagamento</TableHead>
                  </>
                )}
                <TableHead className="text-muted-foreground">Responsável</TableHead>
                <TableHead className="text-right text-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={12} className="py-12 text-center text-muted-foreground">
                    Nenhum cliente nesta aba.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const alert = tab === "ativos" ? rowAlert(c.cycle_end) : "none"
                  const d = daysRemaining(c.cycle_end)
                  return (
                    <TableRow
                      key={c.id}
                      className={cn(
                        "border-border",
                        alert === "warning" && "bg-amber-500/5 hover:bg-amber-500/10",
                        alert === "danger" && "bg-rose-500/5 hover:bg-rose-500/10"
                      )}
                    >
                      <TableCell>
                        <button
                          onClick={() => setHistoryClient(c)}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {c.brand_name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateBR(c.cycle_start)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateBR(c.cycle_end)}</TableCell>

                      {tab === "pausados" ? (
                        <TableCell className="text-muted-foreground">{formatDateBR(c.paused_at)}</TableCell>
                      ) : tab === "nao_renovados" ? (
                        <TableCell className="text-muted-foreground">{formatDateBR(c.exit_date)}</TableCell>
                      ) : null}

                      {tab === "nao_renovados" ? (
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {c.exit_reason || "—"}
                        </TableCell>
                      ) : tab === "pausados" ? (
                        <TableCell>
                          <span className="text-foreground">{c.paused_days_remaining ?? 0} dias</span>
                        </TableCell>
                      ) : (
                        <TableCell>
                          <span
                            className={cn(
                              "font-semibold",
                              alert === "danger"
                                ? "text-rose-400"
                                : alert === "warning"
                                  ? "text-amber-400"
                                  : "text-foreground"
                            )}
                          >
                            {d < 0 ? `${Math.abs(d)}d vencido` : `${d} dias`}
                          </span>
                        </TableCell>
                      )}

                      <TableCell className="text-foreground">{formatCurrency(c.monthly_value)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tab === "nao_renovados" ? `${c.completed_cycles} ciclos` : `Mês ${c.current_cycle}`}
                      </TableCell>

                      {tab === "ativos" && (
                        <>
                          <TableCell>
                            <Badge variant="outline" className={cn("font-medium", CONTRACT_BADGE[c.contract_status])}>
                              {CONTRACT_STATUS_LABEL[c.contract_status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("font-medium", PAYMENT_BADGE[c.payment_status])}>
                              {PAYMENT_STATUS_LABEL[c.payment_status]}
                            </Badge>
                          </TableCell>
                        </>
                      )}

                      <TableCell className="text-muted-foreground">{c.responsible}</TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          client={c}
                          tab={tab}
                          onRenew={() => doRenew(c)}
                          onPause={() => doPause(c)}
                          onReactivate={() => doReactivate(c)}
                          onNotRenew={() => setNotRenewTarget(c)}
                          onEdit={() => {
                            setEditing(c)
                            setFormOpen(true)
                          }}
                          onDelete={() => setDeleteTarget(c)}
                          onHistory={() => setHistoryClient(c)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal criar/editar */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        pending={isPending}
      />

      {/* Modal histórico */}
      <HistoryDialog client={historyClient} onClose={() => setHistoryClient(null)} />

      {/* Não renovar */}
      <NotRenewDialog
        client={notRenewTarget}
        onCancel={() => setNotRenewTarget(null)}
        onConfirm={confirmNotRenew}
      />

      {/* Excluir */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.brand_name}</strong>? Esta ação remove o
              cliente e todo o histórico de ciclos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: ReactNode
  tone: "emerald" | "amber" | "slate" | "primary"
}) {
  const tones = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    slate: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary",
  }
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function RowActions({
  client,
  tab,
  onRenew,
  onPause,
  onReactivate,
  onNotRenew,
  onEdit,
  onDelete,
  onHistory,
}: {
  client: GrowthClient
  tab: TabKey
  onRenew: () => void
  onPause: () => void
  onReactivate: () => void
  onNotRenew: () => void
  onEdit: () => void
  onDelete: () => void
  onHistory: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Ações para {client.brand_name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onHistory}>
          <History className="mr-2 h-4 w-4" /> Ver histórico
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {tab === "ativos" && (
          <>
            <DropdownMenuItem onClick={onRenew}>
              <RefreshCw className="mr-2 h-4 w-4" /> Renovar (+30 dias)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPause}>
              <Pause className="mr-2 h-4 w-4" /> Pausar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNotRenew}>
              <Ban className="mr-2 h-4 w-4" /> Não Renovar
            </DropdownMenuItem>
          </>
        )}
        {(tab === "pausados" || tab === "nao_renovados") && (
          <DropdownMenuItem onClick={onReactivate}>
            <Play className="mr-2 h-4 w-4" /> Reativar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-rose-400 focus:text-rose-400">
          <Trash2 className="mr-2 h-4 w-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ClientFormDialog({
  open,
  onOpenChange,
  editing,
  pending,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: GrowthClient | null
  pending: boolean
}) {
  const today = new Date().toISOString().slice(0, 10)
  const plus30 = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()

  const [brandName, setBrandName] = useState("")
  const [cycleStart, setCycleStart] = useState(today)
  const [cycleEnd, setCycleEnd] = useState(plus30)
  const [monthlyValue, setMonthlyValue] = useState("")
  const [currentCycle, setCurrentCycle] = useState("1")
  const [contractStatus, setContractStatus] = useState<ContractStatus>("ativo")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("aguardando")
  const [responsible, setResponsible] = useState(DEFAULT_RESPONSIBLE)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Sincroniza campos quando abre para edição/criação
  const initKey = editing ? `edit-${editing.id}` : open ? "new" : "closed"
  const [lastKey, setLastKey] = useState("")
  if (open && initKey !== lastKey) {
    setLastKey(initKey)
    if (editing) {
      setBrandName(editing.brand_name)
      setCycleStart(toDateInput(editing.cycle_start))
      setCycleEnd(toDateInput(editing.cycle_end))
      setMonthlyValue(String(editing.monthly_value))
      setCurrentCycle(String(editing.current_cycle))
      setContractStatus(editing.contract_status)
      setPaymentStatus(editing.payment_status)
      setResponsible(editing.responsible)
    } else {
      setBrandName("")
      setCycleStart(today)
      setCycleEnd(plus30)
      setMonthlyValue("")
      setCurrentCycle("1")
      setContractStatus("ativo")
      setPaymentStatus("aguardando")
      setResponsible(DEFAULT_RESPONSIBLE)
    }
    setError("")
  }

  const handleSubmit = () => {
    setError("")
    if (!brandName.trim()) return setError("Informe o nome da marca")
    if (!cycleStart || !cycleEnd) return setError("Informe as datas do ciclo")
    setSaving(true)
    const payload = {
      brandName,
      cycleStart,
      cycleEnd,
      monthlyValue: Number.parseFloat(monthlyValue) || 0,
      currentCycle: Number.parseInt(currentCycle) || 1,
      contractStatus,
      paymentStatus,
      responsible,
    }
    ;(async () => {
      const res = editing ? await updateGrowthClient(editing.id, payload) : await createGrowthClient(payload)
      if (res.success) {
        window.location.reload()
      } else {
        setError(res.error || "Erro ao salvar")
        setSaving(false)
      }
    })()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {editing ? "Atualize os dados do contrato." : "Preencha os dados do contrato de tráfego."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Marca (nome do cliente) *</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ex: Loja XPTO" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início do ciclo *</Label>
              <Input type="date" value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Término do ciclo *</Label>
              <Input type="date" value={cycleEnd} onChange={(e) => setCycleEnd(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor da mensalidade (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Ciclo atual (mês)</Label>
              <Input
                type="number"
                min="1"
                value={currentCycle}
                onChange={(e) => setCurrentCycle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status do contrato</Label>
              <Select value={contractStatus} onValueChange={(v) => setContractStatus(v as ContractStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CONTRACT_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status do pagamento</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PAYMENT_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || pending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || pending}>
            {saving ? "Salvando..." : editing ? "Salvar" : "Criar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NotRenewDialog({
  client,
  onCancel,
  onConfirm,
}: {
  client: GrowthClient | null
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const key = client?.id ?? "none"
  const [lastKey, setLastKey] = useState<string | number>("none")
  if (client && key !== lastKey) {
    setLastKey(key)
    setReason("")
  }

  return (
    <Dialog open={!!client} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Não Renovar contrato</DialogTitle>
          <DialogDescription>
            <strong>{client?.brand_name}</strong> será movido para a aba Não Renovados. O histórico é preservado
            e você pode reativar caso o cliente volte.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Motivo (opcional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: cliente optou por pausar investimento..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(reason)} className="bg-orange-600 text-white hover:bg-orange-700">
            Confirmar Não Renovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HistoryDialog({ client, onClose }: { client: GrowthClient | null; onClose: () => void }) {
  const [cycles, setCycles] = useState<ClientCycle[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedFor, setLoadedFor] = useState<number | null>(null)

  if (client && loadedFor !== client.id && !loading) {
    setLoading(true)
    setLoadedFor(client.id)
    getClientHistory(client.id).then((rows) => {
      setCycles(rows)
      setLoading(false)
    })
  }

  return (
    <Dialog
      open={!!client}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
          setLoadedFor(null)
          setCycles([])
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico — {client?.brand_name}</DialogTitle>
          <DialogDescription>Ciclos anteriores com datas, valores e status de pagamento.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {/* Ciclo atual */}
          {client && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Ciclo atual — Mês {client.current_cycle}</span>
                <Badge variant="outline" className={cn(PAYMENT_BADGE[client.payment_status])}>
                  {PAYMENT_STATUS_LABEL[client.payment_status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateBR(client.cycle_start)} → {formatDateBR(client.cycle_end)} ·{" "}
                {formatCurrency(client.monthly_value)}
              </p>
            </div>
          )}

          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando histórico...</p>
          ) : cycles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum ciclo anterior registrado.</p>
          ) : (
            [...cycles].reverse().map((cy) => (
              <div key={cy.id} className="rounded-lg border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Mês {cy.cycle_number}</span>
                  <Badge variant="outline" className={cn(PAYMENT_BADGE[cy.payment_status])}>
                    {PAYMENT_STATUS_LABEL[cy.payment_status]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateBR(cy.cycle_start)} → {formatDateBR(cy.cycle_end)} · {formatCurrency(cy.monthly_value)}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
