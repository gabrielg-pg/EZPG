"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  PiggyBank as VaultIcon,
  Plus,
  Target,
  Wallet,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { formatCurrency } from "@/lib/format"
import {
  type Vault,
  type VaultMovement,
  type CofreSummary,
  createVault,
  updateVault,
  deleteVault,
  createMovement,
  deleteMovement,
  getVaultMovements,
} from "@/app/actions/cofre-actions"

const COLORS = ["#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0891B2", "#2563EB", "#7C3AED", "#DB2777"]

interface CofreManagerProps {
  initialVaults: Vault[]
  summary: CofreSummary
}

export function CofreManager({ initialVaults, summary: initialSummary }: CofreManagerProps) {
  const [vaults, setVaults] = useState<Vault[]>(initialVaults)
  const [summary, setSummary] = useState<CofreSummary>(initialSummary)
  const [isPending, startTransition] = useTransition()

  // Vault dialog
  const [vaultDialogOpen, setVaultDialogOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<Vault | null>(null)
  const [vName, setVName] = useState("")
  const [vDescription, setVDescription] = useState("")
  const [vGoal, setVGoal] = useState("")
  const [vColor, setVColor] = useState(COLORS[0])

  // Movement dialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [activeVault, setActiveVault] = useState<Vault | null>(null)
  const [movements, setMovements] = useState<VaultMovement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [mType, setMType] = useState<"deposito" | "retirada">("deposito")
  const [mAmount, setMAmount] = useState("")
  const [mDescription, setMDescription] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<Vault | null>(null)

  function recalcSummary(list: Vault[]) {
    setSummary({
      totalBalance: list.reduce((acc, v) => acc + v.balance, 0),
      totalGoal: list.reduce((acc, v) => acc + v.goal_amount, 0),
      vaultCount: list.length,
    })
  }

  function openCreateVault() {
    setEditingVault(null)
    setVName("")
    setVDescription("")
    setVGoal("")
    setVColor(COLORS[0])
    setVaultDialogOpen(true)
  }

  function openEditVault(vault: Vault) {
    setEditingVault(vault)
    setVName(vault.name)
    setVDescription(vault.description ?? "")
    setVGoal(vault.goal_amount ? String(vault.goal_amount) : "")
    setVColor(vault.color || COLORS[0])
    setVaultDialogOpen(true)
  }

  function handleSaveVault(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const payload = {
        name: vName,
        description: vDescription,
        goal_amount: Number(vGoal) || 0,
        color: vColor,
      }

      if (editingVault) {
        const result = await updateVault(editingVault.id, payload)
        if (!result.success) {
          toast.error(result.error ?? "Erro ao salvar")
          return
        }
        const updated = vaults.map((v) =>
          v.id === editingVault.id ? { ...v, ...payload, goal_amount: payload.goal_amount } : v,
        )
        setVaults(updated)
        recalcSummary(updated)
        toast.success("Cofre atualizado")
      } else {
        const result = await createVault(payload)
        if (!result.success || !result.id) {
          toast.error(result.error ?? "Erro ao criar")
          return
        }
        const newVault: Vault = {
          id: result.id,
          name: payload.name,
          description: payload.description || null,
          goal_amount: payload.goal_amount,
          color: payload.color,
          balance: 0,
          created_at: new Date().toISOString(),
        }
        const updated = [...vaults, newVault]
        setVaults(updated)
        recalcSummary(updated)
        toast.success("Cofre criado")
      }
      setVaultDialogOpen(false)
    })
  }

  function handleDeleteVault(vault: Vault) {
    startTransition(async () => {
      const result = await deleteVault(vault.id)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir")
        return
      }
      const updated = vaults.filter((v) => v.id !== vault.id)
      setVaults(updated)
      recalcSummary(updated)
      toast.success("Cofre excluído")
      setDeleteTarget(null)
    })
  }

  async function openMovements(vault: Vault) {
    setActiveVault(vault)
    setMType("deposito")
    setMAmount("")
    setMDescription("")
    setMoveDialogOpen(true)
    setLoadingMovements(true)
    const data = await getVaultMovements(vault.id)
    setMovements(data)
    setLoadingMovements(false)
  }

  function handleSaveMovement(e: React.FormEvent) {
    e.preventDefault()
    if (!activeVault) return
    startTransition(async () => {
      const amount = Number(mAmount) || 0
      const result = await createMovement({
        vault_id: activeVault.id,
        type: mType,
        amount,
        description: mDescription,
      })
      if (!result.success) {
        toast.error(result.error ?? "Erro ao registrar")
        return
      }
      const data = await getVaultMovements(activeVault.id)
      setMovements(data)

      const delta = mType === "deposito" ? amount : -amount
      const updated = vaults.map((v) =>
        v.id === activeVault.id ? { ...v, balance: v.balance + delta } : v,
      )
      setVaults(updated)
      recalcSummary(updated)
      setActiveVault((prev) => (prev ? { ...prev, balance: prev.balance + delta } : prev))
      setMAmount("")
      setMDescription("")
      toast.success(mType === "deposito" ? "Depósito registrado" : "Retirada registrada")
    })
  }

  function handleDeleteMovement(mov: VaultMovement) {
    if (!activeVault) return
    startTransition(async () => {
      const result = await deleteMovement(mov.id)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao excluir")
        return
      }
      setMovements((prev) => prev.filter((m) => m.id !== mov.id))
      const delta = mov.type === "deposito" ? -mov.amount : mov.amount
      const updated = vaults.map((v) =>
        v.id === activeVault.id ? { ...v, balance: v.balance + delta } : v,
      )
      setVaults(updated)
      recalcSummary(updated)
      setActiveVault((prev) => (prev ? { ...prev, balance: prev.balance + delta } : prev))
      toast.success("Movimento excluído")
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cofre</h2>
          <p className="text-sm text-muted-foreground">Gerencie as reservas e metas de caixa da AEESJB</p>
        </div>
        <Button onClick={openCreateVault} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo cofre
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo guardado</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meta total</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalGoal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cofres ativos</CardTitle>
            <VaultIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{summary.vaultCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Vault list */}
      {vaults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <VaultIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Nenhum cofre criado</p>
              <p className="text-sm text-muted-foreground">Crie um cofre para começar a guardar suas reservas.</p>
            </div>
            <Button onClick={openCreateVault} variant="outline" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Novo cofre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vaults.map((vault) => {
            const pct = vault.goal_amount > 0 ? Math.min(100, (vault.balance / vault.goal_amount) * 100) : 0
            return (
              <Card key={vault.id} className="overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: vault.color }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${vault.color}22` }}
                      >
                        <VaultIcon className="h-5 w-5" style={{ color: vault.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">{vault.name}</CardTitle>
                        {vault.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{vault.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditVault(vault)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(vault)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(vault.balance)}</p>
                    {vault.goal_amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        de {formatCurrency(vault.goal_amount)} · {pct.toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {vault.goal_amount > 0 && <Progress value={pct} className="h-2" />}
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => openMovements(vault)}>
                    Ver movimentos
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Vault dialog */}
      <Dialog open={vaultDialogOpen} onOpenChange={setVaultDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveVault}>
            <DialogHeader>
              <DialogTitle>{editingVault ? "Editar cofre" : "Novo cofre"}</DialogTitle>
              <DialogDescription>
                {editingVault ? "Atualize os dados do cofre." : "Crie um cofre para guardar suas reservas."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="v-name">Nome</Label>
                <Input
                  id="v-name"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="Ex: Reserva de emergência"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-desc">Descrição (opcional)</Label>
                <Textarea
                  id="v-desc"
                  value={vDescription}
                  onChange={(e) => setVDescription(e.target.value)}
                  placeholder="Para que serve este cofre?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-goal">Meta (R$)</Label>
                <Input
                  id="v-goal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={vGoal}
                  onChange={(e) => setVGoal(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setVColor(c)}
                      className="h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition-all"
                      style={{
                        backgroundColor: c,
                        boxShadow: vColor === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                      }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setVaultDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingVault ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movements dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeVault?.name}
              {activeVault && (
                <Badge variant="secondary" className="ml-1">
                  {formatCurrency(activeVault.balance)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Registre depósitos e retiradas deste cofre.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMovement} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mType === "deposito" ? "default" : "outline"}
                className={mType === "deposito" ? "" : "bg-transparent"}
                onClick={() => setMType("deposito")}
              >
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Depósito
              </Button>
              <Button
                type="button"
                variant={mType === "retirada" ? "default" : "outline"}
                className={mType === "retirada" ? "" : "bg-transparent"}
                onClick={() => setMType("retirada")}
              >
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Retirada
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="m-amount">Valor (R$)</Label>
                <Input
                  id="m-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="m-desc">Descrição</Label>
                <Input
                  id="m-desc"
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar {mType === "deposito" ? "depósito" : "retirada"}
            </Button>
          </form>

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-sm font-medium text-foreground">Histórico</p>
            <ScrollArea className="h-56 pr-3">
              {loadingMovements ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : movements.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum movimento ainda.</p>
              ) : (
                <div className="space-y-2">
                  {movements.map((mov) => (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {mov.type === "deposito" ? (
                          <ArrowDownCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {mov.description || (mov.type === "deposito" ? "Depósito" : "Retirada")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(mov.occurred_on).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            mov.type === "deposito"
                              ? "text-sm font-semibold text-green-500"
                              : "text-sm font-semibold text-destructive"
                          }
                        >
                          {mov.type === "deposito" ? "+" : "-"}
                          {formatCurrency(mov.amount)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteMovement(mov)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Excluir movimento</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cofre?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o cofre "{deleteTarget?.name}" e todos os seus movimentos. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteVault(deleteTarget)}
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
