"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"
import {
  getReceitas,
  getDespesas,
  getPagamentosColaborador,
  createReceita,
  createDespesa,
  createPagamentoColaborador,
  deleteReceita,
  deleteDespesa,
  deletePagamentoColaborador,
} from "@/app/actions/financeiro-actions"

const MESES = [
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
const METODOS = ["Pix", "Transferência", "Cartão", "Boleto", "Outro"]
const CATEGORIAS_DESPESA = ["Ferramenta", "Colaborador", "Marketing", "Operacional", "Outro"]
const COLABORADORES = ["Luis", "Luiz Gabriel", "Alisson", "Outro"]

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function FinanceiroPanel({
  initialReceitas,
  initialDespesas,
  initialPagamentos,
  resumoAnual,
  currentMes,
  currentAno,
}: any) {
  const [mes, setMes] = useState(currentMes)
  const [ano] = useState(currentAno)
  const [receitas, setReceitas] = useState(initialReceitas)
  const [despesas, setDespesas] = useState(initialDespesas)
  const [pagamentos, setPagamentos] = useState(initialPagamentos)
  const [loading, setLoading] = useState(false)

  const [modalType, setModalType] = useState<"receita" | "despesa" | "colaborador" | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const changeMes = async (newMes: number) => {
    setLoading(true)
    setMes(newMes)
    const [r, d, p] = await Promise.all([
      getReceitas(newMes, ano),
      getDespesas(newMes, ano),
      getPagamentosColaborador(newMes, ano),
    ])
    setReceitas(r)
    setDespesas(d)
    setPagamentos(p)
    setLoading(false)
  }

  const totalEntradas = receitas.reduce((s: number, r: any) => s + Number.parseFloat(r.entrada || 0), 0)
  const totalDespesas = despesas.reduce((s: number, d: any) => s + Number.parseFloat(d.saida || 0), 0)
  const totalColabs = pagamentos.reduce((s: number, p: any) => s + Number.parseFloat(p.valor || 0), 0)
  const totalSaidas = totalDespesas + totalColabs
  const liquido = totalEntradas - totalSaidas

  // Group pagamentos by colaborador
  const colaboradoresGroup = pagamentos.reduce((acc: any, p: any) => {
    if (!acc[p.colaborador]) acc[p.colaborador] = []
    acc[p.colaborador].push(p)
    return acc
  }, {})

  // Resumo anual por mes
  const resumoMeses = MESES.map((_, i) => {
    const m = i + 1
    const entrada = resumoAnual.receitas.find((r: any) => Number(r.mes) === m)?.total || 0
    const saida = resumoAnual.despesas.find((d: any) => Number(d.mes) === m)?.total || 0
    const colab = resumoAnual.colaboradores.find((c: any) => Number(c.mes) === m)?.total || 0
    return { mes: m, entrada: Number.parseFloat(entrada), saida: Number.parseFloat(saida) + Number.parseFloat(colab) }
  })

  const openModal = (type: "receita" | "despesa" | "colaborador") => {
    setForm({
      metodo: "",
      data: new Date().toISOString().split("T")[0],
      nome: "",
      plano_servico: "",
      operacao: "",
      entrada: "",
      descricao: "",
      categoria: "",
      saida: "",
      colaborador: "",
      marca: "",
      plano: "",
      valor: "",
    })
    setModalType(type)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modalType === "receita") {
        const created = await createReceita({ ...form, entrada: Number.parseFloat(form.entrada) || 0, mes, ano })
        setReceitas([...receitas, created[0]])
      } else if (modalType === "despesa") {
        const created = await createDespesa({ ...form, saida: Number.parseFloat(form.saida) || 0, mes, ano })
        setDespesas([...despesas, created[0]])
      } else if (modalType === "colaborador") {
        const created = await createPagamentoColaborador({
          ...form,
          valor: Number.parseFloat(form.valor) || 0,
          mes,
          ano,
        })
        setPagamentos([...pagamentos, created[0]])
      }
      setModalType(null)
    } catch (err) {
      console.error("[v0] Error saving financeiro item:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReceita = async (id: number) => {
    await deleteReceita(id)
    setReceitas(receitas.filter((r: any) => r.id !== id))
  }
  const handleDeleteDespesa = async (id: number) => {
    await deleteDespesa(id)
    setDespesas(despesas.filter((d: any) => d.id !== id))
  }
  const handleDeletePagamento = async (id: number) => {
    await deletePagamentoColaborador(id)
    setPagamentos(pagamentos.filter((p: any) => p.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm">
          Controlo financeiro interno da PRO GROWTH GLOBAL — {ano}
        </p>
      </div>

      {/* Month selector */}
      <div className="flex flex-wrap gap-2">
        {MESES.map((m, i) => {
          const r = resumoMeses[i]
          const isActive = mes === i + 1
          const hasData = r.entrada > 0 || r.saida > 0
          return (
            <button
              key={m}
              onClick={() => changeMes(i + 1)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                  : hasData
                    ? "bg-white/5 text-white border-white/10 hover:border-primary/50 hover:bg-primary/10"
                    : "bg-transparent text-muted-foreground border-sidebar-border hover:text-white hover:border-white/20"
              }`}
            >
              {m.slice(0, 3).toUpperCase()}
              {hasData && (
                <span
                  className={`block text-center text-[10px] mt-0.5 ${r.entrada - r.saida >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {r.entrada - r.saida >= 0 ? "+" : ""}
                  {fmt(r.entrada - r.saida).replace("R$", "")}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Entradas</p>
          </div>
          <p className="text-xl font-bold text-emerald-400">{fmt(totalEntradas)}</p>
        </div>
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <p className="text-xs text-muted-foreground">Saídas</p>
          </div>
          <p className="text-xl font-bold text-red-400">{fmt(totalSaidas)}</p>
        </div>
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-muted-foreground">Colaboradores</p>
          </div>
          <p className="text-xl font-bold text-blue-400">{fmt(totalColabs)}</p>
        </div>
        <div
          className={`rounded-xl p-4 border ${liquido >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`h-4 w-4 ${liquido >= 0 ? "text-emerald-400" : "text-red-400"}`} />
            <p className="text-xs text-muted-foreground">Líquido</p>
          </div>
          <p className={`text-xl font-bold ${liquido >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(liquido)}</p>
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground animate-pulse">A carregar...</p>}

      {/* RECEITAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-white tracking-widest">RECEITAS</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              {receitas.length} registos
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openModal("receita")}
            className="text-xs text-muted-foreground hover:text-white hover:bg-white/5 h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-sidebar-border bg-white/5">
                {["Método", "Data", "Nome", "Plano / Serviço", "Operação", "Entrada", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receitas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground/50 italic">
                    Nenhuma receita registada.
                  </td>
                </tr>
              ) : (
                receitas.map((r: any) => (
                  <tr
                    key={r.id}
                    className="border-b border-sidebar-border/50 hover:bg-white/5 group transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{r.metodo}</td>
                    <td className="px-4 py-3 text-white">{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-white font-medium">{r.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.plano_servico}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.operacao}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(Number.parseFloat(r.entrada))}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteReceita(r.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {receitas.length > 0 && (
                <tr className="bg-emerald-500/10 border-t-2 border-emerald-500/30">
                  <td colSpan={5} className="px-4 py-3 text-emerald-300 font-bold text-right">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-bold text-lg">{fmt(totalEntradas)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DESPESAS OPERACIONAIS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-bold text-white tracking-widest">DESPESAS OPERACIONAIS</h2>
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
              {despesas.length} registos
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openModal("despesa")}
            className="text-xs text-muted-foreground hover:text-white hover:bg-white/5 h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-sidebar-border bg-white/5">
                {["Método", "Data", "Descrição", "Categoria", "Saída", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground/50 italic">
                    Nenhuma despesa registada.
                  </td>
                </tr>
              ) : (
                despesas.map((d: any) => (
                  <tr
                    key={d.id}
                    className="border-b border-sidebar-border/50 hover:bg-white/5 group transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{d.metodo}</td>
                    <td className="px-4 py-3 text-white">{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-white font-medium">{d.descricao}</td>
                    <td className="px-4 py-3">
                      <span className="bg-red-500/10 text-red-300 px-2 py-0.5 rounded-full text-[10px]">
                        {d.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-red-400 font-semibold">{fmt(Number.parseFloat(d.saida))}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteDespesa(d.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {despesas.length > 0 && (
                <tr className="bg-red-500/10 border-t-2 border-red-500/30">
                  <td colSpan={4} className="px-4 py-3 text-red-300 font-bold text-right">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-red-400 font-bold text-lg">{fmt(totalDespesas)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGAMENTOS COLABORADORES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold text-white tracking-widest">PAGAMENTOS COLABORADORES</h2>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{fmt(totalColabs)}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openModal("colaborador")}
            className="text-xs text-muted-foreground hover:text-white hover:bg-white/5 h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Object.keys(colaboradoresGroup).length === 0 ? (
            <div className="col-span-full border border-dashed border-sidebar-border rounded-xl p-6 text-center">
              <p className="text-xs text-muted-foreground/50 italic">Nenhum pagamento registado.</p>
            </div>
          ) : (
            Object.entries(colaboradoresGroup).map(([colab, items]: any) => {
              const total = items.reduce((s: number, i: any) => s + Number.parseFloat(i.valor), 0)
              return (
                <div key={colab} className="bg-sidebar border border-blue-500/20 rounded-xl overflow-hidden">
                  <div className="bg-blue-500/10 px-4 py-3 border-b border-blue-500/20 flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{colab}</p>
                    <span className="text-xs text-blue-300 font-semibold">{MESES[mes - 1]}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-sidebar-border/50">
                        <th className="text-left px-4 py-2 text-muted-foreground">Marca</th>
                        <th className="text-left px-4 py-2 text-muted-foreground">Plano</th>
                        <th className="text-right px-4 py-2 text-muted-foreground">Valor</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => (
                        <tr key={item.id} className="border-b border-sidebar-border/30 hover:bg-white/5 group">
                          <td className="px-4 py-2 text-white">{item.marca}</td>
                          <td className="px-4 py-2 text-muted-foreground">{item.plano}</td>
                          <td className="px-4 py-2 text-blue-400 font-medium text-right">
                            {fmt(Number.parseFloat(item.valor))}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              onClick={() => handleDeletePagamento(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-blue-500/10 border-t border-blue-500/20">
                        <td colSpan={2} className="px-4 py-2 text-blue-300 font-bold">
                          VALOR
                        </td>
                        <td className="px-4 py-2 text-blue-400 font-bold text-right">{fmt(total)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RESUMO FINAL */}
      {(receitas.length > 0 || despesas.length > 0 || pagamentos.length > 0) && (
        <div
          className={`rounded-xl p-6 border-2 ${liquido >= 0 ? "bg-emerald-500/10 border-emerald-500/40" : "bg-red-500/10 border-red-500/40"}`}
        >
          <p className="text-xs text-muted-foreground mb-3 font-semibold tracking-widest">
            RESUMO — {MESES[mes - 1].toUpperCase()} {ano}
          </p>
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Entradas</p>
              <p className="text-lg font-bold text-emerald-400">{fmt(totalEntradas)}</p>
            </div>
            <div className="text-2xl text-muted-foreground">−</div>
            <div>
              <p className="text-xs text-muted-foreground">Total Saídas</p>
              <p className="text-lg font-bold text-red-400">{fmt(totalSaidas)}</p>
            </div>
            <div className="text-2xl text-muted-foreground">=</div>
            <div>
              <p className="text-xs text-muted-foreground">Líquido</p>
              <p className={`text-2xl font-black ${liquido >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmt(liquido)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {modalType === "receita" ? "Nova Receita" : modalType === "despesa" ? "Nova Despesa" : "Novo Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {modalType === "receita" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Método</Label>
                    <Select value={form.metodo} onValueChange={(v) => setForm({ ...form, metodo: v })}>
                      <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-sidebar border-sidebar-border text-white">
                        {METODOS.map((m) => (
                          <SelectItem key={m} value={m} className="focus:bg-white/10">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <Input
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm({ ...form, data: e.target.value })}
                      className="bg-background/50 border-sidebar-border text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome do Cliente</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Plano / Serviço</Label>
                  <Input
                    placeholder="Ex: Scale Vértebra"
                    value={form.plano_servico}
                    onChange={(e) => setForm({ ...form, plano_servico: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Operação</Label>
                  <Input
                    placeholder="Ex: Pix"
                    value={form.operacao}
                    onChange={(e) => setForm({ ...form, operacao: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={form.entrada}
                    onChange={(e) => setForm({ ...form, entrada: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </>
            )}

            {modalType === "despesa" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Método</Label>
                    <Select value={form.metodo} onValueChange={(v) => setForm({ ...form, metodo: v })}>
                      <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-sidebar border-sidebar-border text-white">
                        {METODOS.map((m) => (
                          <SelectItem key={m} value={m} className="focus:bg-white/10">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Data</Label>
                    <Input
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm({ ...form, data: e.target.value })}
                      className="bg-background/50 border-sidebar-border text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <Input
                    placeholder="Ex: Vercel Pro"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar border-sidebar-border text-white">
                      {CATEGORIAS_DESPESA.map((c) => (
                        <SelectItem key={c} value={c} className="focus:bg-white/10">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={form.saida}
                    onChange={(e) => setForm({ ...form, saida: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </>
            )}

            {modalType === "colaborador" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Colaborador</Label>
                  <Select value={form.colaborador} onValueChange={(v) => setForm({ ...form, colaborador: v })}>
                    <SelectTrigger className="bg-background/50 border-sidebar-border text-white">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar border-sidebar-border text-white">
                      {COLABORADORES.map((c) => (
                        <SelectItem key={c} value={c} className="focus:bg-white/10">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Marca</Label>
                  <Input
                    placeholder="Ex: Divale"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Plano</Label>
                  <Input
                    placeholder="Ex: Scale"
                    value={form.plano}
                    onChange={(e) => setForm({ ...form, plano: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5 bg-transparent"
                onClick={() => setModalType(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
