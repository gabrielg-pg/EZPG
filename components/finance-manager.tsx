"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"
import { formatDateBR } from "@/lib/date"
import {
  createTransaction,
  deleteTransaction,
  type FinanceTransaction,
  type FinanceSummary,
} from "@/app/actions/finance-actions"

interface FinanceManagerProps {
  initialTransactions: FinanceTransaction[]
  summary: FinanceSummary
}

const RECEITA_CATEGORIES = ["Mensalidade", "Doação", "Evento", "Patrocínio", "Outros"]
const DESPESA_CATEGORIES = [
  "Salários",
  "Aluguel",
  "Material",
  "Serviços",
  "Impostos",
  "Manutenção",
  "Outros",
]

type FormState = {
  type: "receita" | "despesa"
  description: string
  category: string
  amount: string
  status: string
  occurred_on: string
}

function emptyForm(): FormState {
  return {
    type: "receita",
    description: "",
    category: "",
    amount: "",
    status: "pago",
    occurred_on: new Date().toISOString().slice(0, 10),
  }
}

export function FinanceManager({ initialTransactions, summary }: FinanceManagerProps) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [deleteTarget, setDeleteTarget] = useState<FinanceTransaction | null>(null)
  const [filter, setFilter] = useState<"todos" | "receita" | "despesa">("todos")
  const [isPending, startTransition] = useTransition()

  const categories = form.type === "receita" ? RECEITA_CATEGORIES : DESPESA_CATEGORIES

  const filtered = transactions.filter((t) => filter === "todos" || t.type === filter)

  const openCreate = (type: "receita" | "despesa") => {
    setForm({ ...emptyForm(), type })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    const payload = {
      type: form.type,
      description: form.description,
      category: form.category,
      amount: Number(form.amount),
      status: form.status,
      occurred_on: form.occurred_on,
    }

    startTransition(async () => {
      const result = await createTransaction(payload)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao salvar")
        return
      }
      setTransactions((prev) => [
        {
          id: Math.max(0, ...prev.map((p) => p.id)) + 1,
          type: payload.type,
          description: payload.description,
          category: payload.category || null,
          amount: payload.amount,
          status: payload.status,
          due_date: null,
          occurred_on: payload.occurred_on,
          created_by: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      toast.success("Lançamento adicionado")
      setDialogOpen(false)
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    startTransition(async () => {
      const result = await deleteTransaction(id)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir")
        return
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toast.success("Lançamento excluído")
      setDeleteTarget(null)
    })
  }

  const kpis = [
    {
      label: "Receitas",
      value: formatCurrency(summary.totalReceitas),
      icon: TrendingUp,
      accent: "text-[#22C55E]",
    },
    {
      label: "Despesas",
      value: formatCurrency(summary.totalDespesas),
      icon: TrendingDown,
      accent: "text-destructive",
    },
    {
      label: "Saldo",
      value: formatCurrency(summary.saldo),
      icon: Wallet,
      accent: summary.saldo >= 0 ? "text-[#22C55E]" : "text-destructive",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
          <p className="text-muted-foreground mt-1">
            Controle de receitas e despesas da associação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openCreate("receita")} className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Receita
          </Button>
          <Button
            onClick={() => openCreate("despesa")}
            variant="outline"
            className="gap-2"
          >
            <ArrowDownCircle className="h-4 w-4" />
            Despesa
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-5 w-5 ${kpi.accent}`} />
              </div>
              <p className={`mt-3 text-2xl font-bold ${kpi.accent}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base font-semibold text-foreground">Lançamentos</CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Nenhum lançamento encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {t.type === "receita" ? (
                            <ArrowUpCircle className="h-4 w-4 text-[#22C55E] shrink-0" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          {t.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.category ? (
                          <Badge variant="secondary">{t.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateBR(t.occurred_on)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          t.type === "receita" ? "text-[#22C55E]" : "text-destructive"
                        }`}
                      >
                        {t.type === "receita" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label="Excluir lançamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog criar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Novo lançamento — {form.type === "receita" ? "Receita" : "Despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Mensalidade de janeiro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occurred_on">Data</Label>
                <Input
                  id="occurred_on"
                  type="date"
                  value={form.occurred_on}
                  onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lançamento &quot;{deleteTarget?.description}&quot;
              será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
