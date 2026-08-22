"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Trash2, Table2 } from "lucide-react"
import {
  createStoreReferenceRow,
  updateStoreReferenceField,
  deleteStoreReference,
  type StoreReferenceEntry,
  type StoreReferenceCountry,
  type StoreReferenceField,
} from "@/app/actions/store-reference-actions"

// Colunas da planilha, na ordem do print de referência
const COLUMNS: { key: StoreReferenceField; label: string; className: string }[] = [
  { key: "mercado", label: "Mercado", className: "min-w-[150px]" },
  { key: "loja_url", label: "Loja + URL", className: "min-w-[240px]" },
  { key: "fashion_apenas", label: "Fashion apenas?", className: "min-w-[120px]" },
  { key: "confianca_dropshipping", label: "Confiança dropshipping 1-5", className: "min-w-[170px]" },
  { key: "produtos_catalogo", label: "Produtos no catálogo", className: "min-w-[150px]" },
  { key: "monthly_visits", label: "Monthly Visits", className: "min-w-[140px]" },
  { key: "tendencia_3meses", label: "Tendência 3 meses", className: "min-w-[150px]" },
  { key: "canais_principais", label: "Canais principais", className: "min-w-[160px]" },
  { key: "ads_ativos", label: "Ads ativos", className: "min-w-[120px]" },
  { key: "anuncio_mais_antigo", label: "Anúncio mais antigo", className: "min-w-[160px]" },
  { key: "reach_melhores_ads", label: "Reach dos melhores ads", className: "min-w-[170px]" },
  { key: "variantes_produto", label: "Variantes por produto", className: "min-w-[160px]" },
  { key: "top5_bestsellers", label: "Top 5 bestsellers", className: "min-w-[180px]" },
  { key: "ppspy_estimado", label: "PPSPY vendas/revenue estimado", className: "min-w-[210px]" },
  { key: "google_trends", label: "Google Trends", className: "min-w-[140px]" },
  { key: "tiktok_ugc", label: "TikTok/UGC", className: "min-w-[130px]" },
  { key: "classe", label: "Classe", className: "min-w-[100px]" },
]

export function StoreReference({
  initialStores,
  // mantido por compatibilidade com as páginas; não é mais usado nesta visão de planilha
  initialCountries: _initialCountries = [],
}: {
  initialStores: StoreReferenceEntry[]
  initialCountries?: StoreReferenceCountry[]
}) {
  const [rows, setRows] = useState<StoreReferenceEntry[]>(initialStores)
  const [isPending, startTransition] = useTransition()

  const handleAddRow = () => {
    startTransition(async () => {
      const result = await createStoreReferenceRow()
      if (result.success && result.store) {
        setRows((prev) => [...prev, result.store as StoreReferenceEntry])
      }
    })
  }

  // Atualiza o estado local imediatamente (digitação fluida)
  const handleCellChange = (id: number, field: StoreReferenceField, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  // Persiste ao sair da célula (autosave)
  const handleCellSave = (id: number, field: StoreReferenceField, value: string) => {
    startTransition(async () => {
      await updateStoreReferenceField(id, field, value)
    })
  }

  const handleDelete = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    startTransition(async () => {
      await deleteStoreReference(id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Lojas Winners para Mineração</h1>
          <p className="text-muted-foreground text-sm">
            Insira lojas vencedoras que você encontrar aqui nesse banco de dados para não perder.
          </p>
        </div>
        <Button
          className="shrink-0 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
          onClick={handleAddRow}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
          Adicionar
        </Button>
      </div>

      <div className="rounded-xl border border-sidebar-border bg-sidebar overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white/[0.06] backdrop-blur">
                <th className="sticky left-0 z-20 bg-sidebar border border-sidebar-border px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">
                  #
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`border border-sidebar-border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${col.className}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="border border-sidebar-border px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-14">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 2}
                    className="border border-sidebar-border px-4 py-10 text-center text-sm text-muted-foreground/70"
                  >
                    <Table2 className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Nenhuma loja adicionada ainda. Clique em “Adicionar” para inserir a primeira linha.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="sticky left-0 z-10 bg-sidebar border border-sidebar-border px-3 py-0 text-center text-xs text-muted-foreground">
                      {index + 1}
                    </td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="border border-sidebar-border p-0">
                        <input
                          value={row[col.key] ?? ""}
                          onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                          onBlur={(e) => handleCellSave(row.id, col.key, e.target.value)}
                          className="w-full bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-muted-foreground/40 focus:bg-primary/10"
                          placeholder="—"
                        />
                      </td>
                    ))}
                    <td className="border border-sidebar-border p-0 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="mx-auto flex h-full w-full items-center justify-center py-2.5 text-muted-foreground/60 transition-colors hover:text-red-400"
                        title="Excluir linha"
                        aria-label="Excluir linha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/60">
        Dica: clique em qualquer célula para editar. As alterações são salvas automaticamente ao sair da célula.
      </p>
    </div>
  )
}
