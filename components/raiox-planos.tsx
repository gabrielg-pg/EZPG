"use client"

import { useState, useTransition, useCallback } from "react"
import {
  BarChart3,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { saveRaioxState } from "@/app/actions/raiox-actions"
import {
  type RaioxState,
  type RaioxColumn,
  type ColumnType,
  type Operator,
  COLUMN_TYPE_LABELS,
  OPERATOR_LABELS,
  evaluateCell,
  isSummable,
  formatValue,
  formatCurrency,
  newId,
} from "@/lib/raiox"

const OPERATORS: Operator[] = ["+", "-", "*", "/"]

export function RaioxPlanos({ initialState }: { initialState: RaioxState }) {
  const [state, setState] = useState<RaioxState>(initialState)
  const [isPending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // edição de célula ativa: `${rowId}:${colId}`
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [cellDraft, setCellDraft] = useState("")

  // edição de nome de coluna
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [colNameDraft, setColNameDraft] = useState("")

  // modal de nova coluna
  const [colModalOpen, setColModalOpen] = useState(false)
  const [newCol, setNewCol] = useState<{
    name: string
    type: ColumnType
    operands: string[]
    operators: Operator[]
  }>({ name: "", type: "currency", operands: [], operators: [] })

  // confirmação de exclusão de coluna
  const [colToDelete, setColToDelete] = useState<RaioxColumn | null>(null)

  const persist = useCallback((next: RaioxState) => {
    setState(next)
    startTransition(async () => {
      await saveRaioxState(next)
      setSavedAt(Date.now())
    })
  }, [])

  // ---------- CÉLULAS ----------
  const startCellEdit = (rowId: string, col: RaioxColumn, current: string | number) => {
    if (col.type === "formula") return
    setEditingCell(`${rowId}:${col.id}`)
    setCellDraft(current === undefined || current === null ? "" : String(current))
  }

  const commitCellEdit = (rowId: string, col: RaioxColumn) => {
    const raw = cellDraft.trim()
    const value: string | number =
      col.type === "text" ? raw : raw === "" ? 0 : Number.parseFloat(raw.replace(",", ".")) || 0
    const next: RaioxState = {
      ...state,
      rows: state.rows.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, [col.id]: value } } : r,
      ),
    }
    setEditingCell(null)
    setCellDraft("")
    persist(next)
  }

  // ---------- NOME DO PLANO (primeira coluna fixa) ----------
  const commitPlanoEdit = (rowId: string, value: string) => {
    const next: RaioxState = {
      ...state,
      rows: state.rows.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, __plano: value } } : r,
      ),
    }
    persist(next)
  }

  // ---------- COLUNAS ----------
  const startColRename = (col: RaioxColumn) => {
    setEditingColId(col.id)
    setColNameDraft(col.name)
  }
  const commitColRename = (colId: string) => {
    const name = colNameDraft.trim()
    if (!name) {
      setEditingColId(null)
      return
    }
    persist({
      ...state,
      columns: state.columns.map((c) => (c.id === colId ? { ...c, name } : c)),
    })
    setEditingColId(null)
    setColNameDraft("")
  }

  const moveColumn = (colId: string, dir: "left" | "right") => {
    const idx = state.columns.findIndex((c) => c.id === colId)
    const target = dir === "left" ? idx - 1 : idx + 1
    if (target < 0 || target >= state.columns.length) return
    const cols = [...state.columns]
    ;[cols[idx], cols[target]] = [cols[target], cols[idx]]
    persist({ ...state, columns: cols })
  }

  const deleteColumn = (col: RaioxColumn) => {
    const next: RaioxState = {
      columns: state.columns.filter((c) => c.id !== col.id),
      rows: state.rows.map((r) => {
        const { [col.id]: _drop, ...rest } = r.values
        return { ...r, values: rest }
      }),
    }
    setColToDelete(null)
    persist(next)
  }

  const openNewColModal = () => {
    setNewCol({ name: "", type: "currency", operands: [], operators: [] })
    setColModalOpen(true)
  }

  const addColumn = () => {
    const name = newCol.name.trim()
    if (!name) return
    const col: RaioxColumn = {
      id: newId(),
      name,
      type: newCol.type,
    }
    if (newCol.type === "formula") {
      if (newCol.operands.length < 1) return
      col.formula = { operands: newCol.operands, operators: newCol.operators }
    }
    const defaultVal: string | number = newCol.type === "text" ? "" : 0
    const next: RaioxState = {
      columns: [...state.columns, col],
      rows: state.rows.map((r) => ({
        ...r,
        values: col.type === "formula" ? r.values : { ...r.values, [col.id]: defaultVal },
      })),
    }
    setColModalOpen(false)
    persist(next)
  }

  // ---------- LINHAS ----------
  const addRow = () => {
    const values: Record<string, string | number> = { __plano: "Novo Plano" }
    for (const c of state.columns) {
      if (c.type !== "formula") values[c.id] = c.type === "text" ? "" : 0
    }
    persist({ ...state, rows: [...state.rows, { id: newId("row"), values }] })
  }

  const deleteRow = (rowId: string) => {
    persist({ ...state, rows: state.rows.filter((r) => r.id !== rowId) })
  }

  // ---------- FÓRMULA (builder) ----------
  const formulaColumnsAvailable = state.columns.filter((c) => c.type !== "text")

  const addFormulaOperand = (colId: string) => {
    setNewCol((prev) => {
      if (prev.operands.length === 0) return { ...prev, operands: [colId] }
      return { ...prev, operands: [...prev.operands, colId], operators: [...prev.operators, "+"] }
    })
  }
  const setFormulaOperator = (index: number, op: Operator) => {
    setNewCol((prev) => {
      const operators = [...prev.operators]
      operators[index] = op
      return { ...prev, operators }
    })
  }
  const removeLastOperand = () => {
    setNewCol((prev) => {
      if (prev.operands.length === 0) return prev
      const operands = prev.operands.slice(0, -1)
      const operators = prev.operators.slice(0, Math.max(0, operands.length - 1))
      return { ...prev, operands, operators }
    })
  }

  const colName = (id: string) => state.columns.find((c) => c.id === id)?.name ?? "?"

  // ---------- TOTAIS ----------
  const columnTotal = (col: RaioxColumn): number => {
    return state.rows.reduce((sum, row) => {
      if (col.type === "formula") return sum + evaluateCell(state, row, col.id)
      const raw = row.values[col.id]
      const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? "").replace(",", "."))
      return sum + (Number.isNaN(n) ? 0 : n)
    }, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Raio-X dos Planos</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">
            Análise de margem e lucratividade de cada plano da Pro Growth Global.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPending ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
            </span>
          ) : savedAt ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <Check className="h-3.5 w-3.5" /> Salvo automaticamente
            </span>
          ) : null}
          <Button
            onClick={openNewColModal}
            className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:from-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar coluna
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-sidebar-border bg-sidebar">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sidebar-border">
              <th className="sticky left-0 z-10 bg-sidebar px-4 py-3 text-left font-semibold text-white min-w-[180px]">
                Plano
              </th>
              {state.columns.map((col, colIdx) => (
                <th
                  key={col.id}
                  className="px-3 py-3 text-left font-semibold text-white min-w-[150px] group"
                >
                  {editingColId === col.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        autoFocus
                        value={colNameDraft}
                        onChange={(e) => setColNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.nativeEvent.isComposing) commitColRename(col.id)
                          if (e.key === "Escape") setEditingColId(null)
                        }}
                        className="h-7 bg-background/60 border-primary/40 text-white text-xs"
                      />
                      <button
                        onClick={() => commitColRename(col.id)}
                        className="text-primary hover:text-primary/80"
                        aria-label="Salvar nome"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startColRename(col)}
                        className="flex items-center gap-1 hover:text-primary transition-colors text-left"
                        title="Renomear coluna"
                      >
                        <span className="truncate">{col.name}</span>
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
                      </button>
                      {col.type === "formula" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                          ƒ
                        </span>
                      )}
                      <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveColumn(col.id, "left")}
                          disabled={colIdx === 0}
                          className="text-muted-foreground hover:text-white disabled:opacity-20"
                          aria-label="Mover coluna para esquerda"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveColumn(col.id, "right")}
                          disabled={colIdx === state.columns.length - 1}
                          className="text-muted-foreground hover:text-white disabled:opacity-20"
                          aria-label="Mover coluna para direita"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        {!col.locked && (
                          <button
                            onClick={() => setColToDelete(col)}
                            className="text-muted-foreground hover:text-red-400 ml-0.5"
                            aria-label="Remover coluna"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row) => (
              <tr key={row.id} className="border-b border-sidebar-border/50 hover:bg-white/[0.02] group">
                {/* Nome do plano */}
                <td className="sticky left-0 z-10 bg-sidebar px-4 py-2 font-medium text-white">
                  <input
                    defaultValue={String(row.values.__plano ?? "")}
                    onBlur={(e) => {
                      if (e.target.value !== row.values.__plano) commitPlanoEdit(row.id, e.target.value)
                    }}
                    className="w-full bg-transparent outline-none focus:bg-background/50 rounded px-1 py-0.5"
                  />
                </td>

                {/* Células */}
                {state.columns.map((col) => {
                  const cellKey = `${row.id}:${col.id}`
                  const isFormula = col.type === "formula"
                  const computed = isFormula ? evaluateCell(state, row, col.id) : null
                  const isLucroLiquido = col.id === "lucro_liquido"
                  const displayVal = isFormula
                    ? formatValue(col, computed as number)
                    : formatValue(col, row.values[col.id] ?? (col.type === "text" ? "" : 0))

                  return (
                    <td key={col.id} className="px-3 py-2">
                      {editingCell === cellKey ? (
                        <Input
                          autoFocus
                          value={cellDraft}
                          onChange={(e) => setCellDraft(e.target.value)}
                          onBlur={() => commitCellEdit(row.id, col)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) commitCellEdit(row.id, col)
                            if (e.key === "Escape") {
                              setEditingCell(null)
                              setCellDraft("")
                            }
                          }}
                          className="h-7 bg-background/60 border-primary/40 text-white text-xs"
                        />
                      ) : (
                        <button
                          onClick={() => startCellEdit(row.id, col, row.values[col.id])}
                          disabled={isFormula}
                          className={`w-full text-left rounded px-1.5 py-1 transition-colors ${
                            isFormula
                              ? "cursor-default font-medium"
                              : "hover:bg-background/50 cursor-text"
                          } ${
                            isLucroLiquido
                              ? (computed as number) >= 0
                                ? "text-green-400 font-semibold"
                                : "text-red-400 font-semibold"
                              : isFormula
                                ? "text-primary/90"
                                : "text-foreground"
                          }`}
                        >
                          {displayVal}
                        </button>
                      )}
                    </td>
                  )
                })}

                {/* Remover linha */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remover linha"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary/30 bg-background/40">
              <td className="sticky left-0 z-10 bg-background/60 px-4 py-3 font-bold text-white">
                Total
              </td>
              {state.columns.map((col) => {
                if (!isSummable(col)) return <td key={col.id} className="px-3 py-3 text-muted-foreground/40">—</td>
                const total = columnTotal(col)
                const isLucroLiquido = col.id === "lucro_liquido"
                return (
                  <td
                    key={col.id}
                    className={`px-3 py-3 font-bold ${
                      isLucroLiquido
                        ? total >= 0
                          ? "text-green-400"
                          : "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {col.type === "number" ? formatValue(col, total) : formatCurrency(total)}
                  </td>
                )
              })}
              <td className="px-3 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Adicionar linha */}
      <button
        onClick={addRow}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 hover:border-primary/60"
      >
        <Plus className="h-4 w-4" />
        Adicionar plano
      </button>

      {/* Modal nova coluna */}
      <Dialog open={colModalOpen} onOpenChange={setColModalOpen}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Nova coluna
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome da coluna *</Label>
              <Input
                autoFocus
                placeholder="Ex.: Custo de Tráfego"
                value={newCol.name}
                onChange={(e) => setNewCol({ ...newCol, name: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de dado</Label>
              <Select
                value={newCol.type}
                onValueChange={(v) => setNewCol({ ...newCol, type: v as ColumnType, operands: [], operators: [] })}
              >
                <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-sidebar-border text-white">
                  {(Object.keys(COLUMN_TYPE_LABELS) as ColumnType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {COLUMN_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Builder de fórmula */}
            {newCol.type === "formula" && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Label className="text-xs text-muted-foreground">
                  Monte a fórmula (× e ÷ são calculados antes de + e −)
                </Label>
                <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] rounded-md bg-background/40 p-2">
                  {newCol.operands.length === 0 && (
                    <span className="text-xs text-muted-foreground/50 italic">
                      Selecione a primeira coluna abaixo
                    </span>
                  )}
                  {newCol.operands.map((opId, i) => (
                    <div key={`${opId}-${i}`} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <Select
                          value={newCol.operators[i - 1]}
                          onValueChange={(v) => setFormulaOperator(i - 1, v as Operator)}
                        >
                          <SelectTrigger className="h-7 w-14 bg-background/60 border-primary/30 text-white px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-sidebar-border text-white min-w-0">
                            {OPERATORS.map((op) => (
                              <SelectItem key={op} value={op}>
                                {OPERATOR_LABELS[op]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                        {colName(opId)}
                      </span>
                    </div>
                  ))}
                  {newCol.operands.length > 0 && (
                    <button
                      onClick={removeLastOperand}
                      className="ml-1 text-muted-foreground hover:text-red-400"
                      aria-label="Remover último termo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formulaColumnsAvailable.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addFormulaOperand(c.id)}
                      className="text-xs px-2 py-1 rounded-md border border-sidebar-border text-muted-foreground hover:text-white hover:border-primary/40 transition-colors"
                    >
                      + {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5 bg-transparent"
              onClick={() => setColModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-primary/80 text-white"
              onClick={addColumn}
              disabled={!newCol.name.trim() || (newCol.type === "formula" && newCol.operands.length < 1)}
            >
              Adicionar coluna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão de coluna */}
      <Dialog open={!!colToDelete} onOpenChange={(o) => !o && setColToDelete(null)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-400" />
              Remover coluna
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja remover a coluna{" "}
            <span className="text-white font-semibold">{colToDelete?.name}</span>? Todos os dados
            dessa coluna serão perdidos. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5 bg-transparent"
              onClick={() => setColToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-500/90 text-white hover:bg-red-500"
              onClick={() => colToDelete && deleteColumn(colToDelete)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
