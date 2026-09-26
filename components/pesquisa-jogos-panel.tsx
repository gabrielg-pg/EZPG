"use client"

import { Fragment, useState, useEffect, useCallback, useMemo } from "react"
import useSWR from "swr"
import {
  Loader2,
  Search,
  Trophy,
  Users,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Gamepad2,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { TODOS_OS_JOGOS, type PesquisaLead } from "@/lib/pesquisa-jogos"
import { cn } from "@/lib/utils"

type StatsResponse = {
  total_respostas: number
  top_jogos: { nome: string; votos: number }[]
}

type LeadsResponse = {
  total: number
  pagina: number
  por_pagina: number
  total_paginas: number
  leads: PesquisaLead[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PesquisaJogosPanel() {
  const [buscaInput, setBuscaInput] = useState("")
  const [busca, setBusca] = useState("")
  const [filtroJogo, setFiltroJogo] = useState("todos")
  const [ordenar, setOrdenar] = useState<"data" | "nome" | "email">("data")
  const [direcao, setDirecao] = useState<"asc" | "desc">("desc")
  const [pagina, setPagina] = useState(1)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [paraExcluir, setParaExcluir] = useState<PesquisaLead | null>(null)

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => {
      setBusca(buscaInput.trim().toLowerCase())
      setPagina(1)
    }, 400)
    return () => clearTimeout(t)
  }, [buscaInput])

  const { data: stats } = useSWR<StatsResponse>("/api/pesquisa-jogos/stats", fetcher, {
    refreshInterval: 30000,
  })

  const leadsUrl = useMemo(() => {
    const params = new URLSearchParams({
      pagina: String(pagina),
      ordenar,
      direcao,
    })
    if (busca) params.set("busca", busca)
    if (filtroJogo !== "todos") params.set("filtro_jogo", filtroJogo)
    return `/api/pesquisa-jogos/leads?${params.toString()}`
  }, [pagina, ordenar, direcao, busca, filtroJogo])

  const { data: leadsData, isLoading, mutate } = useSWR<LeadsResponse>(leadsUrl, fetcher)

  const toggleOrdenar = useCallback(
    (col: "data" | "nome" | "email") => {
      if (ordenar === col) {
        setDirecao((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setOrdenar(col)
        setDirecao("asc")
      }
      setPagina(1)
    },
    [ordenar],
  )

  const excluir = useCallback(async () => {
    if (!paraExcluir) return
    try {
      const res = await fetch(`/api/pesquisa-jogos/leads?id=${paraExcluir.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success("Resposta excluída")
      setParaExcluir(null)
      mutate()
    } catch {
      toast.error("Erro ao excluir resposta")
    }
  }, [paraExcluir, mutate])

  const total = leadsData?.total ?? 0
  const totalPaginas = leadsData?.total_paginas ?? 1
  const top5 = stats?.top_jogos.slice(0, 5) ?? []
  const jogoTop1 = stats?.top_jogos[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Pesquisa de Jogos 2026
        </h1>
        <p className="text-sm text-muted-foreground">
          Respostas da enquete pública sobre os jogos do campeonato municipal.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card flex flex-col gap-2 rounded-2xl p-5">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-4 w-4" /> Total de Respostas
          </span>
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {stats?.total_respostas ?? 0}
          </span>
        </div>

        <div className="glass-card flex flex-col gap-2 rounded-2xl p-5">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Trophy className="h-4 w-4 text-primary" /> Jogo Mais Votado
          </span>
          {jogoTop1 ? (
            <>
              <span className="text-lg font-bold text-foreground leading-tight text-balance">
                {jogoTop1.nome}
              </span>
              <span className="text-sm text-primary">{jogoTop1.votos} votos</span>
            </>
          ) : (
            <span className="text-lg font-bold text-muted-foreground">—</span>
          )}
        </div>

        <div className="glass-card flex flex-col gap-2 rounded-2xl p-5">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Gamepad2 className="h-4 w-4 text-primary" /> Top 5 Jogos
          </span>
          {top5.length > 0 ? (
            <div className="flex flex-col gap-1">
              {top5.map((j, i) => (
                <div key={j.nome} className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">
                    <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                    {j.nome}
                  </span>
                  <span className="ml-2 flex-shrink-0 font-semibold text-primary tabular-nums">
                    {j.votos}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-lg font-bold text-muted-foreground">—</span>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filtroJogo}
            onValueChange={(v) => {
              setFiltroJogo(v)
              setPagina(1)
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por jogo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os jogos</SelectItem>
              {TODOS_OS_JOGOS.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="whitespace-nowrap">
            {total} resposta{total === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleOrdenar("nome")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Nome <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleOrdenar("email")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    E-mail <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleOrdenar("data")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Data <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Jogos Votados</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : (leadsData?.leads.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma resposta encontrada.
                  </td>
                </tr>
              ) : (
                leadsData?.leads.map((lead) => {
                  const aberto = expandido === lead.id
                  return (
                    <Fragment key={lead.id}>
                      <tr
                        className="border-b border-border/60 transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandido(aberto ? null : lead.id)}
                            aria-label={aberto ? "Recolher" : "Expandir"}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                aberto && "rotate-180",
                              )}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{lead.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {lead.telefone || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatarData(lead.data_resposta)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-md flex-wrap gap-1">
                            {lead.jogos_selecionados.slice(0, 3).map((j) => (
                              <Badge
                                key={j}
                                variant="secondary"
                                className="bg-primary/12 text-primary"
                              >
                                {j}
                              </Badge>
                            ))}
                            {lead.jogos_selecionados.length > 3 && (
                              <Badge variant="secondary">
                                +{lead.jogos_selecionados.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setParaExcluir(lead)}
                            aria-label="Excluir resposta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      {aberto && (
                        <tr className="border-b border-border/60 bg-white/[0.02]">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Todos os jogos votados ({lead.jogos_selecionados.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {lead.jogos_selecionados.map((j) => (
                                  <Badge
                                    key={j}
                                    variant="secondary"
                                    className="bg-primary/12 text-primary"
                                  >
                                    {j}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!paraExcluir} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
            <AlertDialogDescription>
              A resposta de {paraExcluir?.nome} ({paraExcluir?.email}) será removida
              permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
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
