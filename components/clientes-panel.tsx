"use client"

import { useState, useMemo, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  DollarSign,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MessageCircle,
  Mail,
  Loader2,
  Filter,
  ShoppingCart,
  TrendingUp,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type Cliente,
  type Compra,
  type Plano,
  PLANOS,
  PLANO_LABEL,
  planoLabel,
  planoBadge,
  ESTADOS_BR,
  TIPOS_COMPRA,
  formatCurrency,
  formatDateBR,
  maskCPF,
  maskCEP,
  maskPhone,
  isValidCPF,
  isValidEmail,
  whatsappLink,
} from "@/lib/clientes"
import {
  createCliente,
  updateCliente,
  deleteCliente,
  addCompra,
  updateCompra,
  deleteCompra,
  ajustarLtvCliente,
  getClienteCompras,
} from "@/app/actions/clientes-actions"

const PAGE_SIZE = 50

type SortKey = "nome_completo" | "cidade" | "cep" | "primeira_compra" | "ltv"
type SortDir = "asc" | "desc"

const num = (v: string | number) => (typeof v === "string" ? Number.parseFloat(v) || 0 : v || 0)

export function ClientesPanel({ initialClientes }: { initialClientes: Cliente[] }) {
  const [clientes] = useState<Cliente[]>(initialClientes)
  const [search, setSearch] = useState("")
  const [planoFilter, setPlanoFilter] = useState<Plano[]>([])
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [ltvMin, setLtvMin] = useState("")
  const [ltvMax, setLtvMax] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("nome_completo")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<number | null>(null)

  // Modais
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [compraTarget, setCompraTarget] = useState<Cliente | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null)
  const [isPending, startTransition] = useTransition()

  const estados = useMemo(() => {
    const set = new Set(clientes.map((c) => c.estado).filter(Boolean))
    return Array.from(set).sort()
  }, [clientes])

  // Métricas de resumo
  const totalLtv = useMemo(() => clientes.reduce((s, c) => s + num(c.ltv), 0), [clientes])
  const ativos = useMemo(() => clientes.filter((c) => c.ativo).length, [clientes])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const min = ltvMin ? Number.parseFloat(ltvMin) : null
    const max = ltvMax ? Number.parseFloat(ltvMax) : null
    const rows = clientes.filter((c) => {
      if (s) {
        const hay = `${c.nome_completo} ${c.email} ${c.whatsapp}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      if (planoFilter.length > 0 && !planoFilter.includes(c.plano)) return false
      if (estadoFilter !== "all" && c.estado !== estadoFilter) return false
      const ltv = num(c.ltv)
      if (min !== null && ltv < min) return false
      if (max !== null && ltv > max) return false
      return true
    })
    rows.sort((a, b) => {
      let cmp = 0
      if (sortKey === "ltv" || sortKey === "primeira_compra") {
        cmp = num(a[sortKey]) - num(b[sortKey])
      } else {
        cmp = String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""), "pt-BR")
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return rows
  }, [clientes, search, planoFilter, estadoFilter, ltvMin, ltvMax, sortKey, sortDir])

  // Reset de página quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [search, planoFilter, estadoFilter, ltvMin, ltvMax])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "ltv" ? "desc" : "asc")
    }
  }

  const togglePlano = (p: Plano) => {
    setPlanoFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    startTransition(async () => {
      await deleteCliente(id)
      window.location.reload()
    })
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Base de clientes com LTV acumulado por todas as compras.
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

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total de Clientes" value={String(clientes.length)} icon={<Users className="h-5 w-5" />} tone="primary" />
        <SummaryCard label="Clientes Ativos" value={String(ativos)} icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
        <SummaryCard label="LTV Total da Base" value={formatCurrency(totalLtv)} icon={<DollarSign className="h-5 w-5" />} tone="primary" />
      </div>

      {/* Filtros + busca */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {estados.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={ltvMin}
                onChange={(e) => setLtvMin(e.target.value)}
                placeholder="LTV mín."
                className="w-[110px]"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="number"
                value={ltvMax}
                onChange={(e) => setLtvMax(e.target.value)}
                placeholder="LTV máx."
                className="w-[110px]"
              />
            </div>
          </div>
        </div>
        {/* Checkboxes de plano */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Planos:
          </span>
          {PLANOS.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox checked={planoFilter.includes(p)} onCheckedChange={() => togglePlano(p)} />
              {PLANO_LABEL[p]}
            </label>
          ))}
        </div>
      </div>

      {/* Contagem */}
      <p className="text-sm text-muted-foreground">
        Mostrando {rangeStart}-{rangeEnd} de {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Tabela (desktop) */}
      <div className="hidden rounded-xl border border-border bg-card/40 md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-8" />
                <SortHead label="Nome Completo" k="nome_completo" sortKey={sortKey} onClick={toggleSort} icon={<SortIcon k="nome_completo" />} />
                <TableHead className="text-muted-foreground">Endereço</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <SortHead label="Cidade" k="cidade" sortKey={sortKey} onClick={toggleSort} icon={<SortIcon k="cidade" />} />
                <SortHead label="CEP" k="cep" sortKey={sortKey} onClick={toggleSort} icon={<SortIcon k="cep" />} />
                <TableHead className="text-muted-foreground">CPF</TableHead>
                <TableHead className="text-muted-foreground">Plano</TableHead>
                <SortHead label="1ª Compra" k="primeira_compra" sortKey={sortKey} onClick={toggleSort} icon={<SortIcon k="primeira_compra" />} />
                <SortHead label="LTV" k="ltv" sortKey={sortKey} onClick={toggleSort} icon={<SortIcon k="ltv" />} />
                <TableHead className="text-muted-foreground">WhatsApp</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-right text-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={13} className="py-12 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c) => (
                  <ClienteRow
                    key={c.id}
                    cliente={c}
                    expanded={expanded === c.id}
                    onToggleExpand={() => setExpanded((prev) => (prev === c.id ? null : c.id))}
                    onEdit={() => {
                      setEditing(c)
                      setFormOpen(true)
                    }}
                    onAddCompra={() => setCompraTarget(c)}
                    onDelete={() => setDeleteTarget(c)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          paginated.map((c) => (
            <ClienteCardMobile
              key={c.id}
              cliente={c}
              onEdit={() => {
                setEditing(c)
                setFormOpen(true)
              }}
              onAddCompra={() => setCompraTarget(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próximo
          </Button>
        </div>
      )}

      {/* Modal criar/editar */}
      <ClienteFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} pending={isPending} />

      {/* Modal adicionar compra */}
      <AddCompraDialog cliente={compraTarget} onClose={() => setCompraTarget(null)} />

      {/* Excluir */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome_completo}</strong>? Esta ação remove o
              cliente e todo o histórico de compras permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 text-white hover:bg-rose-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SortHead({
  label,
  k,
  sortKey,
  onClick,
  icon,
}: {
  label: string
  k: SortKey
  sortKey: SortKey
  onClick: (k: SortKey) => void
  icon: React.ReactNode
}) {
  return (
    <TableHead className="text-muted-foreground">
      <button
        onClick={() => onClick(k)}
        className={cn(
          "flex items-center gap-1.5 transition-colors hover:text-foreground",
          sortKey === k && "text-foreground",
        )}
      >
        {label}
        {icon}
      </button>
    </TableHead>
  )
}

function ClienteRow({
  cliente,
  expanded,
  onToggleExpand,
  onEdit,
  onAddCompra,
  onDelete,
}: {
  cliente: Cliente
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onAddCompra: () => void
  onDelete: () => void
}) {
  return (
    <>
      <TableRow className="border-border">
        <TableCell className="pr-0">
          <button
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </TableCell>
        <TableCell className="max-w-[220px] truncate font-medium text-foreground" title={cliente.nome_completo}>
          {cliente.nome_completo}
        </TableCell>
        <TableCell className="max-w-[200px] truncate text-muted-foreground" title={cliente.endereco}>
          {cliente.endereco || "—"}
        </TableCell>
        <TableCell className="text-muted-foreground">{cliente.estado || "—"}</TableCell>
        <TableCell className="text-muted-foreground">{cliente.cidade || "—"}</TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">{cliente.cep || "—"}</TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">{cliente.cpf}</TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("font-medium", planoBadge(cliente.plano))}>
            {planoLabel(cliente.plano)}
          </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatCurrency(cliente.primeira_compra)}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <span className="flex items-center gap-1 font-bold text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            {formatCurrency(cliente.ltv)}
          </span>
        </TableCell>
        <TableCell>
          {cliente.whatsapp ? (
            <a
              href={whatsappLink(cliente.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 whitespace-nowrap text-emerald-400 hover:text-emerald-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {cliente.whatsapp}
            </a>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell>
          {cliente.email ? (
            <a
              href={`mailto:${cliente.email}`}
              className="flex max-w-[180px] items-center gap-1 truncate text-primary hover:text-primary/80"
              title={cliente.email}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{cliente.email}</span>
            </a>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={onAddCompra}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              title="Adicionar compra"
              aria-label="Adicionar compra"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              title="Editar cliente"
              aria-label="Editar cliente"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              title="Excluir cliente"
              aria-label="Excluir cliente"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent border-border">
          <TableCell colSpan={13} className="bg-background/40 p-0">
            <ClienteHistory cliente={cliente} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function ClienteHistory({ cliente }: { cliente: Cliente }) {
  const [compras, setCompras] = useState<Compra[] | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rowError, setRowError] = useState<string>("")
  const [draft, setDraft] = useState({ valor: "", dataCompra: "", tipo: "Plano", descricao: "" })

  const reload = () => getClienteCompras(cliente.id).then(setCompras)

  useEffect(() => {
    let active = true
    getClienteCompras(cliente.id).then((rows) => {
      if (active) setCompras(rows)
    })
    return () => {
      active = false
    }
  }, [cliente.id])

  const startEdit = (co: Compra) => {
    setRowError("")
    setEditingId(co.id)
    setDraft({
      valor: String(num(co.valor)),
      dataCompra: (co.data_compra || "").slice(0, 10),
      tipo: co.tipo || "Plano",
      descricao: co.descricao || "",
    })
  }

  const saveEdit = async (id: number) => {
    const v = Number.parseFloat(draft.valor)
    if (!(v > 0)) {
      setRowError("Informe um valor válido.")
      return
    }
    setBusyId(id)
    const result = await updateCompra(id, {
      valor: v,
      dataCompra: draft.dataCompra,
      tipo: draft.tipo,
      descricao: draft.descricao,
    })
    setBusyId(null)
    if (result.success) {
      setEditingId(null)
      setRowError("")
      await reload()
    } else {
      setRowError(result.error || "Erro ao salvar.")
    }
  }

  const removeCompra = async (id: number) => {
    if (!confirm("Excluir este lançamento? O LTV será recalculado.")) return
    setBusyId(id)
    const result = await deleteCompra(id)
    setBusyId(null)
    if (result.success) await reload()
    else setRowError(result.error || "Erro ao excluir.")
  }

  const total = (compras ?? []).reduce((acc, co) => acc + num(co.valor), 0)

  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Cadastro: <span className="text-foreground">{formatDateBR(cliente.created_at)}</span>
        </span>
        <span className="text-muted-foreground">
          Última compra: <span className="text-foreground">{formatDateBR(cliente.ultima_compra)}</span>
        </span>
        <span className="text-muted-foreground">
          Status:{" "}
          <span className={cliente.ativo ? "text-emerald-400" : "text-muted-foreground"}>
            {cliente.ativo ? "Ativo" : "Inativo"}
          </span>
        </span>
        <span className="text-muted-foreground">
          Total de compras: <span className="text-foreground">{compras?.length ?? cliente.total_compras}</span>
        </span>
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Histórico de compras
      </p>
      {rowError && <p className="mb-2 text-xs text-rose-400">{rowError}</p>}
      {compras === null ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : compras.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">Nenhuma compra registrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Descrição</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((co) =>
                editingId === co.id ? (
                  <tr key={co.id} className="border-b border-border/50 bg-background/40 last:border-0">
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={draft.dataCompra}
                        onChange={(e) => setDraft((d) => ({ ...d, dataCompra: e.target.value }))}
                        className="h-8 bg-background/50 border-sidebar-border text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select value={draft.tipo} onValueChange={(v) => setDraft((d) => ({ ...d, tipo: v }))}>
                        <SelectTrigger className="h-8 bg-background/50 border-sidebar-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-sidebar border-sidebar-border text-white">
                          {TIPOS_COMPRA.map((t) => (
                            <SelectItem key={t} value={t} className="focus:bg-white/10 focus:text-white">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={draft.descricao}
                        onChange={(e) => setDraft((d) => ({ ...d, descricao: e.target.value }))}
                        placeholder="Opcional"
                        className="h-8 bg-background/50 border-sidebar-border text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.valor}
                        onChange={(e) => setDraft((d) => ({ ...d, valor: e.target.value }))}
                        className="h-8 bg-background/50 border-sidebar-border text-right text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEdit(co.id)}
                          disabled={busyId === co.id}
                          className="rounded-md p-1.5 text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                          title="Salvar"
                          aria-label="Salvar alteração"
                        >
                          {busyId === co.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setRowError("")
                          }}
                          disabled={busyId === co.id}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
                          title="Cancelar"
                          aria-label="Cancelar edição"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={co.id} className="border-b border-border/50 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDateBR(co.data_compra)}</td>
                    <td className="px-3 py-2 text-foreground">{co.tipo}</td>
                    <td className="px-3 py-2 text-muted-foreground">{co.descricao || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-foreground">
                      {formatCurrency(co.valor)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(co)}
                          disabled={busyId !== null}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
                          title="Editar lançamento"
                          aria-label="Editar lançamento"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeCompra(co.id)}
                          disabled={busyId !== null}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                          title="Excluir lançamento"
                          aria-label="Excluir lançamento"
                        >
                          {busyId === co.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              <tr className="bg-primary/5">
                <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold uppercase text-muted-foreground">
                  LTV total
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-primary">
                  {formatCurrency(total)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ClienteCardMobile({
  cliente,
  onEdit,
  onAddCompra,
  onDelete,
}: {
  cliente: Cliente
  onEdit: () => void
  onAddCompra: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{cliente.nome_completo}</p>
          <p className="text-xs text-muted-foreground">
            {cliente.cidade || "—"}
            {cliente.estado ? ` · ${cliente.estado}` : ""}
          </p>
        </div>
          <Badge variant="outline" className={cn("shrink-0 font-medium", planoBadge(cliente.plano))}>
            {planoLabel(cliente.plano)}
          </Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">LTV</p>
          <p className="flex items-center gap-1 font-bold text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            {formatCurrency(cliente.ltv)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">1ª compra</p>
          <p className="text-sm text-foreground">{formatCurrency(cliente.primeira_compra)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {cliente.whatsapp && (
          <a
            href={whatsappLink(cliente.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {cliente.whatsapp}
          </a>
        )}
        {cliente.email && (
          <a href={`mailto:${cliente.email}`} className="flex items-center gap-1 truncate text-primary">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{cliente.email}</span>
          </a>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onAddCompra}>
          <ShoppingCart className="h-3.5 w-3.5" /> Compra
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-rose-400 hover:text-rose-300"
          onClick={onDelete}
          aria-label="Excluir cliente"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
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
  icon: React.ReactNode
  tone: "emerald" | "primary"
}) {
  const tones = {
    emerald: "bg-emerald-500/15 text-emerald-400",
    primary: "bg-primary/15 text-primary",
  }
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// ---------- Modal criar/editar cliente ----------

type FormState = {
  nomeCompleto: string
  cpf: string
  email: string
  whatsapp: string
  endereco: string
  estado: string
  cidade: string
  cep: string
  plano: Plano
  ativo: boolean
  valorPrimeiraCompra: string
  ltvTotal: string
}

const emptyForm: FormState = {
  nomeCompleto: "",
  cpf: "",
  email: "",
  whatsapp: "",
  endereco: "",
  estado: "",
  cidade: "",
  cep: "",
  plano: "start_growth",
  ativo: true,
  valorPrimeiraCompra: "",
  ltvTotal: "",
}

function ClienteFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Cliente | null
  pending: boolean
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState("")
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        nomeCompleto: editing.nome_completo,
        cpf: editing.cpf,
        email: editing.email,
        whatsapp: editing.whatsapp,
        endereco: editing.endereco,
        estado: editing.estado,
        cidade: editing.cidade,
        cep: editing.cep,
        plano: editing.plano,
        ativo: editing.ativo,
        valorPrimeiraCompra: "",
        ltvTotal: String(num(editing.ltv)),
      })
    } else {
      setForm(emptyForm)
    }
    setError("")
  }, [open, editing])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.nomeCompleto.trim()) return setError("Informe o nome completo.")
    if (!isValidCPF(form.cpf)) return setError("CPF inválido.")
    if (form.email && !isValidEmail(form.email)) return setError("Email inválido.")
    if (!editing) {
      const v = Number.parseFloat(form.valorPrimeiraCompra)
      if (!(v > 0)) return setError("Informe o valor da 1ª compra.")
    }
    let novoLtv: number | null = null
    if (editing && form.ltvTotal.trim() !== "") {
      const parsed = Number.parseFloat(form.ltvTotal)
      if (!(parsed >= 0)) return setError("Informe um LTV válido.")
      novoLtv = Math.round(parsed * 100) / 100
    }
    setError("")
    startSaving(async () => {
      const base = {
        nomeCompleto: form.nomeCompleto,
        cpf: form.cpf,
        email: form.email,
        whatsapp: form.whatsapp,
        endereco: form.endereco,
        estado: form.estado,
        cidade: form.cidade,
        cep: form.cep,
        plano: form.plano,
        ativo: form.ativo,
      }
      const result = editing
        ? await updateCliente(editing.id, base)
        : await createCliente({ ...base, valorPrimeiraCompra: Number.parseFloat(form.valorPrimeiraCompra) })
      if (!result.success) {
        setError(result.error || "Erro ao salvar.")
        return
      }
      // Ajusta o LTV se o valor foi alterado durante a edição
      if (editing && novoLtv !== null && novoLtv !== Math.round(num(editing.ltv) * 100) / 100) {
        const ltvResult = await ajustarLtvCliente(editing.id, novoLtv)
        if (!ltvResult.success) {
          setError(ltvResult.error || "Cliente salvo, mas houve erro ao ajustar o LTV.")
          return
        }
      }
      onOpenChange(false)
      window.location.reload()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-sidebar border-sidebar-border text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {editing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {editing ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <Field label="Nome completo *" className="sm:col-span-2">
            <Input
              value={form.nomeCompleto}
              maxLength={50}
              onChange={(e) => set("nomeCompleto", e.target.value)}
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          <Field label="CPF *">
            <Input
              value={form.cpf}
              onChange={(e) => set("cpf", maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <Input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@dominio.com"
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input
              value={form.endereco}
              maxLength={60}
              onChange={(e) => set("endereco", e.target.value)}
              placeholder="Rua e número"
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado">
              <Select value={form.estado || "none"} onValueChange={(v) => set("estado", v === "none" ? "" : v)}>
                <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent className="bg-sidebar border-sidebar-border text-white max-h-64">
                  <SelectItem value="none" className="focus:bg-white/10 focus:text-white">
                    —
                  </SelectItem>
                  {ESTADOS_BR.map((uf) => (
                    <SelectItem key={uf} value={uf} className="focus:bg-white/10 focus:text-white">
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="CEP">
              <Input
                value={form.cep}
                onChange={(e) => set("cep", maskCEP(e.target.value))}
                placeholder="00.000-000"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </Field>
          </div>
          <Field label="Plano">
            <Select value={form.plano} onValueChange={(v) => set("plano", v as Plano)}>
              <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-sidebar border-sidebar-border text-white">
                {PLANOS.map((p) => (
                  <SelectItem key={p} value={p} className="focus:bg-white/10 focus:text-white">
                    {PLANO_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {!editing && (
            <Field label="Valor da 1ª compra (R$) *">
              <Input
                type="number"
                value={form.valorPrimeiraCompra}
                onChange={(e) => set("valorPrimeiraCompra", e.target.value)}
                placeholder="0,00"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </Field>
          )}
          {editing && (
            <Field label="LTV total (R$)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.ltvTotal}
                onChange={(e) => set("ltvTotal", e.target.value)}
                placeholder="0,00"
                className="bg-background/50 border-sidebar-border text-white"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Ajusta o LTV acumulado do cliente. A diferença é registrada como um ajuste no histórico de compras.
              </p>
            </Field>
          )}
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} id="cliente-ativo" />
            <Label htmlFor="cliente-ativo" className="text-sm text-muted-foreground">
              Cliente ativo
            </Label>
          </div>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            className="border-sidebar-border text-muted-foreground hover:bg-white/5 hover:text-white"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? "Salvar" : "Criar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Modal adicionar compra ----------

function AddCompraDialog({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const [valor, setValor] = useState("")
  const [dataCompra, setDataCompra] = useState(() => new Date().toISOString().slice(0, 10))
  const [tipo, setTipo] = useState("Plano")
  const [descricao, setDescricao] = useState("")
  const [error, setError] = useState("")
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (cliente) {
      setValor("")
      setDataCompra(new Date().toISOString().slice(0, 10))
      setTipo("Plano")
      setDescricao("")
      setError("")
    }
  }, [cliente])

  const handleSubmit = () => {
    if (!cliente) return
    const v = Number.parseFloat(valor)
    if (!(v > 0)) return setError("Informe um valor válido.")
    setError("")
    startSaving(async () => {
      const result = await addCompra(cliente.id, { valor: v, dataCompra, tipo, descricao })
      if (result.success) {
        onClose()
        window.location.reload()
      } else {
        setError(result.error || "Erro ao registrar compra.")
      }
    })
  }

  return (
    <Dialog open={!!cliente} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Adicionar compra
          </DialogTitle>
        </DialogHeader>
        {cliente && (
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="text-foreground">{cliente.nome_completo}</span> · LTV atual:{" "}
            <span className="font-semibold text-primary">{formatCurrency(cliente.ltv)}</span>
          </p>
        )}
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$) *">
              <Input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="bg-background/50 border-sidebar-border text-white"
              />
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
                className="bg-background/50 border-sidebar-border text-white"
              />
            </Field>
          </div>
          <Field label="Tipo">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-sidebar border-sidebar-border text-white">
                {TIPOS_COMPRA.map((t) => (
                  <SelectItem key={t} value={t} className="focus:bg-white/10 focus:text-white">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Descrição">
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
              className="bg-background/50 border-sidebar-border text-white"
            />
          </Field>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-sidebar-border text-muted-foreground hover:bg-white/5 hover:text-white"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Registrar compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
