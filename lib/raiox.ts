// ---------- Raio-X dos Planos: modelo de dados e motor de cálculo ----------

export type ColumnType = "text" | "number" | "currency" | "percent" | "formula"

export type Operator = "+" | "-" | "*" | "/"

export interface RaioxColumn {
  id: string
  name: string
  type: ColumnType
  // Presente apenas quando type === "formula"
  formula?: {
    operands: string[] // ids de colunas
    operators: Operator[] // length === operands.length - 1
  }
  // Formato de exibição do resultado de uma coluna de fórmula.
  // Se ausente, usa "number".
  displayAs?: "currency" | "number" | "percent"
  // Colunas base do sistema não podem ser removidas (mas podem ser editadas)
  locked?: boolean
}

export interface RaioxRow {
  id: string
  // valores por columnId. Fórmulas não guardam valor (são calculadas).
  values: Record<string, string | number>
}

export interface RaioxState {
  columns: RaioxColumn[]
  rows: RaioxRow[]
}

export const OPERATOR_LABELS: Record<Operator, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Texto",
  number: "Número",
  currency: "Moeda (R$)",
  percent: "Percentual (%)",
  formula: "Fórmula calculada",
}

export function newId(prefix = "col") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// Estado inicial: 4 planos e as colunas pedidas.
export function defaultRaioxState(): RaioxState {
  const columns: RaioxColumn[] = [
    { id: "valor_plano", name: "Valor do Plano", type: "currency", locked: true },
    { id: "valor_gestor", name: "Valor Gestor", type: "percent", locked: true },
    { id: "valor_design", name: "Valor Design", type: "currency", locked: true },
    { id: "valor_estrutura", name: "Valor Estrutura", type: "currency", locked: true },
    { id: "valor_ads", name: "Valor Gestão de ADS", type: "currency", locked: true },
    {
      id: "lucro_bruto",
      name: "Lucro Bruto",
      type: "formula",
      locked: true,
      displayAs: "currency",
      formula: {
        operands: ["valor_plano", "valor_design", "valor_estrutura", "valor_ads"],
        operators: ["-", "-", "-"],
      },
    },
    {
      id: "lucro_liquido",
      name: "Lucro Líquido",
      type: "formula",
      locked: true,
      displayAs: "currency",
      // Lucro Bruto − (Valor do Plano × Valor Gestor%). Com precedência, o × resolve antes.
      formula: {
        operands: ["lucro_bruto", "valor_plano", "valor_gestor"],
        operators: ["-", "*"],
      },
    },
    {
      id: "roas",
      name: "ROAS",
      type: "formula",
      locked: true,
      displayAs: "number",
      // ROAS = Valor do Plano ÷ Valor Gestão de ADS (0 quando ADS = 0).
      formula: {
        operands: ["valor_plano", "valor_ads"],
        operators: ["/"],
      },
    },
  ]

  const planos = [
    { nome: "Start Growth™", valor: 2497 },
    { nome: "Pro Vértebra™", valor: 4297 },
    { nome: "Scale Vértebra™", valor: 6997 },
    { nome: "Scale Global™", valor: 9997 },
  ]

  const rows: RaioxRow[] = planos.map((p) => ({
    id: newId("row"),
    values: {
      __plano: p.nome,
      valor_plano: p.valor,
      valor_gestor: 20,
      valor_design: 0,
      valor_estrutura: 0,
      valor_ads: 0,
      roas: 0,
    },
  }))

  return { columns, rows }
}

// Reaplica as definições canônicas das colunas travadas (tipo, fórmula, displayAs)
// a um estado carregado do banco, preservando a ordem, os valores das linhas e
// quaisquer colunas personalizadas criadas pelo usuário. Isso corrige estados
// salvos por versões antigas (ex.: Lucro sem "R$" e ROAS sem cálculo).
export function normalizeState(state: RaioxState): RaioxState {
  const canonical = new Map(defaultRaioxState().columns.map((c) => [c.id, c]))
  const columns = state.columns.map((col) => {
    const base = canonical.get(col.id)
    return base ? { ...base } : col
  })
  return { columns, rows: state.rows }
}

// Converte o valor bruto de uma coluna para o número usado nos cálculos.
// Percentuais entram como fração (20 -> 0.20).
function numericValue(col: RaioxColumn, raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? "").replace(",", "."))
  if (Number.isNaN(n)) return 0
  return col.type === "percent" ? n / 100 : n
}

// Avalia uma coluna de fórmula para uma linha, com precedência (× e ÷ antes de + e −)
// e proteção contra ciclos.
export function evaluateCell(
  state: RaioxState,
  row: RaioxRow,
  columnId: string,
  seen: Set<string> = new Set(),
): number {
  const col = state.columns.find((c) => c.id === columnId)
  if (!col) return 0

  if (col.type !== "formula") {
    return numericValue(col, row.values[columnId])
  }

  if (seen.has(columnId) || !col.formula || col.formula.operands.length === 0) return 0
  seen.add(columnId)

  const { operands, operators } = col.formula
  // Resolve cada operando (que pode ser outra fórmula).
  const values = operands.map((opId) => evaluateCell(state, row, opId, new Set(seen)))

  // Primeira passada: × e ÷.
  const nums: number[] = [values[0] ?? 0]
  const addSubOps: Operator[] = []
  for (let i = 0; i < operators.length; i++) {
    const op = operators[i]
    const next = values[i + 1] ?? 0
    if (op === "*") {
      nums[nums.length - 1] = nums[nums.length - 1] * next
    } else if (op === "/") {
      nums[nums.length - 1] = next === 0 ? 0 : nums[nums.length - 1] / next
    } else {
      addSubOps.push(op)
      nums.push(next)
    }
  }

  // Segunda passada: + e −.
  let result = nums[0] ?? 0
  for (let i = 0; i < addSubOps.length; i++) {
    result = addSubOps[i] === "+" ? result + nums[i + 1] : result - nums[i + 1]
  }
  return result
}

// Colunas que entram em somatório no rodapé.
export function isSummable(col: RaioxColumn): boolean {
  return col.type === "currency" || col.type === "number" || col.type === "formula"
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatValue(col: RaioxColumn, value: number | string): string {
  if (col.type === "text") return String(value ?? "")
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? "").replace(",", "."))
  const safe = Number.isNaN(n) ? 0 : n
  // Colunas de fórmula usam o formato de exibição escolhido (displayAs).
  const kind = col.type === "formula" ? (col.displayAs ?? "number") : col.type
  if (kind === "currency") return formatCurrency(safe)
  if (kind === "percent") return `${safe.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`
  return safe.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
}
