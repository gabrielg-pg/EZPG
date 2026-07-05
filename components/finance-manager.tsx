"use client"

import type React from "react"
import { useMemo, useState, useTransition } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
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
import { formatCurrency } from "@/lib/format"
import { formatDateBR } from "@/lib/date"
import {
  getFinanceData,
  createRevenue,
  deleteRevenue,
  createExpense,
  deleteExpense,
  createCollaborator,
  deleteCollaborator,
  createPayment,
  deletePayment,
  type FinanceData,
  type Collaborator,
} from "@/app/actions/finance-actions"

const MONTHS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
]

const MONTHS_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

interface FinanceManagerProps {
  initialData: FinanceData
  initialYear: number
  initialMonth: number
}

type Dialogs =
  | { kind: "revenue" }
  | { kind: "expense" }
  | { kind: "collaborator" }
  | { kind: "payment"; collaborator: Collaborator }
  | null

export function FinanceManager({ initialData, initialYear, initialMonth }: FinanceManagerProps) {
  const [data, setData] = useState<FinanceData>(initialData)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [dialog, setDialog] = useState<Dialogs>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoading, startLoading] = useTransition()

  // Form states
  const [revForm, setRevForm] = useState({
    method: "Pix",
    occurred_on: "",
    name: "",
    plan: "",
    operation: "",
    amount: "",
  })
  const [expForm, setExpForm] = useState({
    method: "Pix",
    occurred_on: "",
    description: "",
    category: "",
    amount: "",
  })
  const [collabForm, setCollabForm] = useState({ name: "", area: "", contact: "" })
  const [payForm, setPayForm] = useState({ description: "", amount: "", paid_on: "" })

  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "revenue" | "expense" | "payment" | "collaborator"; id: number; label: string }
    | null
  >(null)

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    const years: number[] = []
    for (let y = current + 1; y >= current - 4; y--) years.push(y)
    if (!years.includes(year)) years.push(year)
    return years.sort((a, b) => b - a)
  }, [year])

  const totals = useMemo(() => {
    const entradas = data.revenues.reduce((acc, r) => acc + r.amount, 0)
    const despesas = data.expenses.reduce((acc, e) => acc + e.amount, 0)
    const colaboradores = data.payments.reduce((acc, p) => acc + p.amount, 0)
    const saidas = despesas + colaboradores
    return { entradas, despesas, colaboradores, saidas, liquido: entradas - saidas }
  }, [data])

  function reload(nextYear: number, nextMonth: number) {
    startLoading(async () => {
      const fresh = await getFinanceData(nextYear, nextMonth)
      setData(fresh)
    })
  }

  function changeMonth(m: number) {
    setMonth(m)
    reload(year, m)
  }

  function changeYear(y: number) {
    setYear(y)
    reload(y, month)
  }

  function stepMonth(dir: -1 | 1) {
    let m = month + dir
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
    reload(y, m)
  }

  /* ---------- Handlers ---------- */

  function submitRevenue() {
    if (!revForm.name.trim()) return toast.error("Informe o nome")
    startTransition(async () => {
      const res = await createRevenue({
        year,
        month,
        method: revForm.method,
        occurred_on: revForm.occurred_on || undefined,
        name: revForm.name,
        plan: revForm.plan,
        operation: revForm.operation,
        amount: Number(revForm.amount) || 0,
      })
      if (!res.success) {
        toast.error(res.error ?? "Erro")
        return
      }
      setData((d) => ({ ...d, revenues: [...d.revenues, res.revenue] }))
      toast.success("Receita adicionada")
      setDialog(null)
      setRevForm({ method: "Pix", occurred_on: "", name: "", plan: "", operation: "", amount: "" })
    })
  }

  function submitExpense() {
    if (!expForm.description.trim()) return toast.error("Informe a descrição")
    startTransition(async () => {
      const res = await createExpense({
        year,
        month,
        method: expForm.method,
        occurred_on: expForm.occurred_on || undefined,
        description: expForm.description,
        category: expForm.category,
        amount: Number(expForm.amount) || 0,
      })
      if (!res.success) {
        toast.error(res.error ?? "Erro")
        return
      }
      setData((d) => ({ ...d, expenses: [...d.expenses, res.expense] }))
      toast.success("Despesa adicionada")
      setDialog(null)
      setExpForm({ method: "Pix", occurred_on: "", description: "", category: "", amount: "" })
    })
  }

  function submitCollaborator() {
    if (!collabForm.name.trim()) return toast.error("Informe o nome")
    startTransition(async () => {
      const res = await createCollaborator(collabForm)
      if (!res.success) {
        toast.error(res.error ?? "Erro")
        return
      }
      setData((d) => ({ ...d, collaborators: [...d.collaborators, res.collaborator] }))
      toast.success("Colaborador adicionado")
      setDialog(null)
      setCollabForm({ name: "", area: "", contact: "" })
    })
  }

  function submitPayment(collaboratorId: number) {
    if (!payForm.amount || Number(payForm.amount) <= 0) return toast.error("Informe um valor válido")
    startTransition(async () => {
      const res = await createPayment({
        collaborator_id: collaboratorId,
        year,
        month,
        description: payForm.description,
        amount: Number(payForm.amount),
        paid_on: payForm.paid_on || undefined,
      })
      if (!res.success) {
        toast.error(res.error ?? "Erro")
        return
      }
      setData((d) => ({ ...d, payments: [...d.payments, res.payment] }))
      toast.success("Pagamento registrado")
      setDialog(null)
      setPayForm({ description: "", amount: "", paid_on: "" })
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    startTransition(async () => {
      let res
      if (type === "revenue") res = await deleteRevenue(id)
      else if (type === "expense") res = await deleteExpense(id)
      else if (type === "payment") res = await deletePayment(id)
      else res = await deleteCollaborator(id)

      if (!res.success) {
        toast.error(res.error ?? "Erro")
        return
      }

      setData((d) => {
        if (type === "revenue") return { ...d, revenues: d.revenues.filter((x) => x.id !== id) }
        if (type === "expense") return { ...d, expenses: d.expenses.filter((x) => x.id !== id) }
        if (type === "payment") return { ...d, payments: d.payments.filter((x) => x.id !== id) }
        return {
          ...d,
          collaborators: d.collaborators.filter((x) => x.id !== id),
          payments: d.payments.filter((x) => x.collaborator_id !== id),
        }
      })
      toast.success("Excluído")
      setDeleteTarget(null)
    })
  }

  const monthPayments = (collaboratorId: number) =>
    data.payments.filter((p) => p.collaborator_id === collaboratorId)

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Controlo financeiro interno da AEESJB — {year}
        </p>
      </div>

      {/* Seletor de ano + meses */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-transparent"
            onClick={() => stepMonth(-1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(year)} onValueChange={(v) => changeYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-transparent"
            onClick={() => stepMonth(1)}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex flex-wrap gap-2">
          {MONTHS.map((label, i) => {
            const m = i + 1
            const active = m === month
            const monthTotal = data.yearTotals.find((t) => t.month === m)?.total ?? 0
            return (
              <button
                key={label}
                type="button"
                onClick={() => changeMonth(m)}
                className={`flex min-w-[68px] flex-col items-center rounded-lg border px-3 py-2 text-center transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="text-xs font-bold">{label}</span>
                <span
                  className={`text-[10px] font-medium ${
                    active
                      ? "text-primary-foreground/80"
                      : monthTotal >= 0
                        ? "text-[#22C55E]"
                        : "text-destructive"
                  }`}
                >
                  {monthTotal >= 0 ? "+" : ""}
                  {formatCurrency(monthTotal)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Entradas" value={formatCurrency(totals.entradas)} icon={TrendingUp} accent="text-[#22C55E]" />
        <KpiCard label="Saídas" value={formatCurrency(totals.saidas)} icon={TrendingDown} accent="text-destructive" />
        <KpiCard label="Colaboradores" value={formatCurrency(totals.colaboradores)} icon={Users} accent="text-foreground" />
        <KpiCard
          label="Líquido"
          value={formatCurrency(totals.liquido)}
          icon={DollarSign}
          accent={totals.liquido >= 0 ? "text-[#22C55E]" : "text-destructive"}
          highlight
        />
      </div>

      {/* RECEITAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Receitas</h2>
            <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-xs font-medium text-[#22C55E]">
              {data.revenues.length} {data.revenues.length === 1 ? "registo" : "registos"}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setDialog({ kind: "revenue" })}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Plano / Serviço</th>
                  <th className="px-4 py-3 font-medium">Operação</th>
                  <th className="px-4 py-3 text-right font-medium">Entrada</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.revenues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma receita registada.
                    </td>
                  </tr>
                ) : (
                  data.revenues.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 text-foreground">{r.method || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.occurred_on ? formatDateBR(r.occurred_on) : "—"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.plan || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.operation || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#22C55E]">{formatCurrency(r.amount)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget({ type: "revenue", id: r.id, label: r.name })}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Excluir receita"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.revenues.length > 0 && (
                <tfoot>
                  <tr className="bg-[#22C55E]/10">
                    <td colSpan={5} className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#22C55E]">{formatCurrency(totals.entradas)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </section>

      {/* DESPESAS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Despesas Operacionais</h2>
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
              {data.expenses.length} {data.expenses.length === 1 ? "registo" : "registos"}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setDialog({ kind: "expense" })}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Saída</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma despesa registada.
                    </td>
                  </tr>
                ) : (
                  data.expenses.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 text-foreground">{e.method || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.occurred_on ? formatDateBR(e.occurred_on) : "—"}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{e.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.category || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-destructive">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget({ type: "expense", id: e.id, label: e.description })}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Excluir despesa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {data.expenses.length > 0 && (
                <tfoot>
                  <tr className="bg-destructive/10">
                    <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-destructive">{formatCurrency(totals.despesas)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </section>

      {/* PAGAMENTOS COLABORADORES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Pagamentos Colaboradores</h2>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              {formatCurrency(totals.colaboradores)}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setDialog({ kind: "collaborator" })}>
            <UserPlus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        </div>

        {data.collaborators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 py-12 text-center text-sm text-muted-foreground">
            Nenhum colaborador cadastrado. Clique em &quot;Novo Colaborador&quot; para começar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.collaborators.map((c) => {
              const payments = monthPayments(c.id)
              const total = payments.reduce((acc, p) => acc + p.amount, 0)
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{c.name}</p>
                      {c.area && <p className="truncate text-xs text-primary">{c.area}</p>}
                      {c.contact && (
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{c.contact}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ type: "collaborator", id: c.id, label: c.name })}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Excluir colaborador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {payments.length === 0 ? (
                    <p className="py-3 text-center text-xs italic text-muted-foreground">
                      Sem pagamentos em {MONTHS_FULL[month - 1]}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs text-foreground">{p.description || "Pagamento"}</p>
                            {p.paid_on && <p className="text-[10px] text-muted-foreground">{formatDateBR(p.paid_on)}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                            <button
                              onClick={() => setDeleteTarget({ type: "payment", id: p.id, label: p.description || "pagamento" })}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Excluir pagamento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-border/60 pt-2">
                        <span className="text-xs font-medium uppercase text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-1.5 bg-transparent"
                    onClick={() => setDialog({ kind: "payment", collaborator: c })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Pagamento
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* RESUMO */}
      <section className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Resumo — {MONTHS_FULL[month - 1]} {year}
        </p>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Entradas</p>
            <p className="text-2xl font-bold text-[#22C55E]">{formatCurrency(totals.entradas)}</p>
          </div>
          <span className="pb-1 text-2xl font-bold text-muted-foreground">−</span>
          <div>
            <p className="text-xs text-muted-foreground">Total Saídas</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.saidas)}</p>
          </div>
          <span className="pb-1 text-2xl font-bold text-muted-foreground">=</span>
          <div>
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className={`text-3xl font-bold ${totals.liquido >= 0 ? "text-[#22C55E]" : "text-destructive"}`}>
              {formatCurrency(totals.liquido)}
            </p>
          </div>
        </div>
      </section>

      {/* -------- Dialogs -------- */}

      {/* Receita */}
      <Dialog open={dialog?.kind === "revenue"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova receita — {MONTHS_FULL[month - 1]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método</Label>
                <Input value={revForm.method} onChange={(e) => setRevForm({ ...revForm, method: e.target.value })} placeholder="Pix, Cartão..." />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={revForm.occurred_on} onChange={(e) => setRevForm({ ...revForm, occurred_on: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={revForm.name} onChange={(e) => setRevForm({ ...revForm, name: e.target.value })} placeholder="Ex: Cliente / Aluno" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plano / Serviço</Label>
                <Input value={revForm.plan} onChange={(e) => setRevForm({ ...revForm, plan: e.target.value })} placeholder="Personalizado" />
              </div>
              <div className="space-y-2">
                <Label>Operação</Label>
                <Input value={revForm.operation} onChange={(e) => setRevForm({ ...revForm, operation: e.target.value })} placeholder="Pix, Cartão..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={revForm.amount} onChange={(e) => setRevForm({ ...revForm, amount: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isPending}>Cancelar</Button>
            <Button onClick={submitRevenue} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Despesa */}
      <Dialog open={dialog?.kind === "expense"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova despesa — {MONTHS_FULL[month - 1]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método</Label>
                <Input value={expForm.method} onChange={(e) => setExpForm({ ...expForm, method: e.target.value })} placeholder="Pix, Cartão..." />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={expForm.occurred_on} onChange={(e) => setExpForm({ ...expForm, occurred_on: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Ex: Assinatura de ferramenta" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} placeholder="Ex: Software" />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isPending}>Cancelar</Button>
            <Button onClick={submitExpense} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Colaborador */}
      <Dialog open={dialog?.kind === "collaborator"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={collabForm.name} onChange={(e) => setCollabForm({ ...collabForm, name: e.target.value })} placeholder="Ex: João Silva" />
            </div>
            <div className="space-y-2">
              <Label>Área / Função</Label>
              <Input value={collabForm.area} onChange={(e) => setCollabForm({ ...collabForm, area: e.target.value })} placeholder="Ex: Design" />
            </div>
            <div className="space-y-2">
              <Label>Contato (CPF / e-mail)</Label>
              <Input value={collabForm.contact} onChange={(e) => setCollabForm({ ...collabForm, contact: e.target.value })} placeholder="email@exemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isPending}>Cancelar</Button>
            <Button onClick={submitCollaborator} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagamento */}
      <Dialog open={dialog?.kind === "payment"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Pagamento — {dialog?.kind === "payment" ? dialog.collaborator.name : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={payForm.description} onChange={(e) => setPayForm({ ...payForm, description: e.target.value })} placeholder="Ex: Serviço de edição" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={payForm.paid_on} onChange={(e) => setPayForm({ ...payForm, paid_on: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isPending}>Cancelar</Button>
            <Button
              onClick={() => dialog?.kind === "payment" && submitPayment(dialog.collaborator.id)}
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.label}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-[#22C55E]/40 bg-[#22C55E]/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}
