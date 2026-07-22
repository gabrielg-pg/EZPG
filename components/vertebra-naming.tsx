"use client"

import { useState, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Copy, Check, Pencil, Save, X, Trash2, Sparkles, Loader2, ClipboardList, ExternalLink } from "lucide-react"
import {
  createNamingNiche,
  createNamingName,
  updateNamingName,
  deleteNamingName,
  deleteNamingNiche,
  type NamingNiche,
  type NamingName,
  type NamingStatus,
} from "@/app/actions/naming-actions"

const COUNTRIES = [
  { name: "Brasil", code: "br" },
  { name: "Estados Unidos", code: "us" },
  { name: "Portugal", code: "pt" },
  { name: "Espanha", code: "es" },
  { name: "Alemanha", code: "de" },
  { name: "Canadá", code: "ca" },
]

const NICHE_SUGGESTIONS = [
  "Moda Feminina",
  "Moda Masculina",
  "Moda Infantil",
  "Calçados",
  "Acessórios",
  "Beleza & Cosméticos",
  "Casa & Decoração",
  "Eletrônicos",
  "Esportes & Fitness",
  "Pet",
  "Saúde & Bem-estar",
  "Jóias & Relógios",
]

const STATUS_CONFIG: Record<NamingStatus, { label: string; className: string }> = {
  disponivel: { label: "Disponível", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  indisponivel: { label: "Indisponível", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  verificar: { label: "Verificar", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
}

function CountryFlag({ code, name, className = "" }: { code: string; name: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={`Bandeira ${name}`}
      className={`object-cover rounded-sm shadow-sm ${className}`}
      loading="lazy"
    />
  )
}

function StatusBadge({ status }: { status: NamingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.verificar
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>{cfg.label}</span>
  )
}

export function VertebraNaming({
  initialNiches,
  initialNames,
}: {
  initialNiches: NamingNiche[]
  initialNames: NamingName[]
}) {
  const [niches, setNiches] = useState<NamingNiche[]>(initialNiches)
  const [names, setNames] = useState<NamingName[]>(initialNames)
  const [isPending, startTransition] = useTransition()

  // Modal de adicionar nome
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [nameTarget, setNameTarget] = useState<{ country: string; niche: string } | null>(null)
  const [nameForm, setNameForm] = useState<{ name: string; domain: string; status: NamingStatus }>({
    name: "",
    domain: "",
    status: "verificar",
  })
  const [nameError, setNameError] = useState("")

  // Modal de adicionar nicho
  const [nicheModalOpen, setNicheModalOpen] = useState(false)
  const [nicheCountry, setNicheCountry] = useState<string | null>(null)
  const [nicheInput, setNicheInput] = useState("")
  const [nicheError, setNicheError] = useState("")

  // Edição inline de nome
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; domain: string; status: NamingStatus }>({
    name: "",
    domain: "",
    status: "verificar",
  })

  // Feedback de cópia
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const totalByCountry = useMemo(() => {
    const map: Record<string, number> = {}
    for (const n of names) map[n.country] = (map[n.country] ?? 0) + 1
    return map
  }, [names])

  // Retorna os nichos de um país (da tabela de nichos + qualquer um presente em nomes).
  const nichesForCountry = (country: string): string[] => {
    const set = new Set<string>()
    niches.filter((x) => x.country === country).forEach((x) => set.add(x.niche))
    names.filter((x) => x.country === country).forEach((x) => set.add(x.niche))
    return Array.from(set)
  }

  // ---- Cópia ----
  const formatEntry = (n: NamingName) => (n.domain ? `${n.name} — ${n.domain}` : n.name)

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const copyNicheList = (country: string, niche: string) => {
    const list = names
      .filter((n) => n.country === country && n.niche === niche)
      .map(formatEntry)
      .join("\n")
    copyText(list, `niche-${country}-${niche}`)
  }

  // ---- Adicionar nome ----
  const openNameModal = (country: string, niche: string) => {
    setNameTarget({ country, niche })
    setNameForm({ name: "", domain: "", status: "verificar" })
    setNameError("")
    setNameModalOpen(true)
  }

  const handleAddName = () => {
    if (!nameForm.name.trim()) {
      setNameError("Insira o nome da marca.")
      return
    }
    if (!nameTarget) return
    startTransition(async () => {
      const result = await createNamingName({
        country: nameTarget.country,
        niche: nameTarget.niche,
        name: nameForm.name,
        domain: nameForm.domain,
        status: nameForm.status,
      })
      if (result.success && result.name) {
        setNames((prev) => [...prev, result.name as NamingName])
        setNameModalOpen(false)
        setNameTarget(null)
      } else {
        setNameError(result.error || "Erro ao adicionar nome.")
      }
    })
  }

  // ---- Adicionar nicho ----
  const openNicheModal = (country: string) => {
    setNicheCountry(country)
    setNicheInput("")
    setNicheError("")
    setNicheModalOpen(true)
  }

  const handleAddNiche = () => {
    if (!nicheInput.trim()) {
      setNicheError("Insira o nome do nicho.")
      return
    }
    if (!nicheCountry) return
    startTransition(async () => {
      const result = await createNamingNiche(nicheCountry, nicheInput)
      if (result.success && result.niche) {
        setNiches((prev) => [...prev, result.niche as NamingNiche])
        setNicheModalOpen(false)
        setNicheCountry(null)
      } else {
        setNicheError(result.error || "Erro ao adicionar nicho.")
      }
    })
  }

  // ---- Edição inline ----
  const startEdit = (n: NamingName) => {
    setEditingId(n.id)
    setEditForm({ name: n.name, domain: n.domain ?? "", status: n.status })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = (id: number) => {
    startTransition(async () => {
      const result = await updateNamingName(id, editForm)
      if (result.success && result.name) {
        setNames((prev) => prev.map((n) => (n.id === id ? (result.name as NamingName) : n)))
        setEditingId(null)
      }
    })
  }

  const removeName = (id: number) => {
    setNames((prev) => prev.filter((n) => n.id !== id))
    startTransition(async () => {
      await deleteNamingName(id)
    })
  }

  const removeNiche = (country: string, niche: string) => {
    if (!confirm(`Excluir o nicho "${niche}" e todos os nomes dentro dele? Esta ação não pode ser desfeita.`)) return
    setNames((prev) => prev.filter((n) => !(n.country === country && n.niche === niche)))
    setNiches((prev) => prev.filter((x) => !(x.country === country && x.niche === niche)))
    startTransition(async () => {
      await deleteNamingNiche(country, niche)
    })
  }

  const nameTargetCountryData = COUNTRIES.find((c) => c.code === nameTarget?.country)
  const nicheCountryData = COUNTRIES.find((c) => c.code === nicheCountry)

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Vértebra Naming™
        </h1>
        <p className="text-muted-foreground text-sm">
          Banco de sugestões de nomes de marca, organizado por mercado e nicho.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {COUNTRIES.map((country) => {
          const countryNiches = nichesForCountry(country.code)
          const total = totalByCountry[country.code] ?? 0
          return (
            <Card key={country.code} className="bg-sidebar border-sidebar-border flex flex-col">
              <CardHeader className="pb-3 border-b border-sidebar-border">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <CountryFlag code={country.code} name={country.name} className="w-7 h-5" />
                  {country.name}
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                    {total} {total === 1 ? "nome" : "nomes"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-4 space-y-5">
                {countryNiches.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic">Nenhum nicho cadastrado ainda.</p>
                ) : (
                  countryNiches.map((niche) => {
                    const nicheNames = names.filter((n) => n.country === country.code && n.niche === niche)
                    const nicheKey = `niche-${country.code}-${niche}`
                    return (
                      <div key={niche} className="space-y-2">
                        {/* Cabeçalho do nicho */}
                        <div className="flex items-center gap-2">
                          <span className="h-px flex-1 bg-sidebar-border" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{niche}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyNicheList(country.code, niche)}
                              disabled={nicheNames.length === 0}
                              title="Copiar lista completa deste nicho"
                              className="flex items-center gap-1 rounded-md border border-sidebar-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-white hover:border-primary/40 transition-colors disabled:opacity-30"
                            >
                              {copiedKey === nicheKey ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <ClipboardList className="h-3 w-3" />
                              )}
                              Copiar lista
                            </button>
                            <button
                              onClick={() => removeNiche(country.code, niche)}
                              title="Excluir nicho"
                              className="rounded-md border border-sidebar-border p-1 text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="h-px flex-1 bg-sidebar-border" />
                        </div>

                        {/* Lista de nomes */}
                        {nicheNames.length === 0 ? (
                          <p className="text-xs text-muted-foreground/50 italic px-1">Nenhum nome cadastrado ainda.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {nicheNames.map((n) => {
                              const isEditing = editingId === n.id
                              const copyKey = `name-${n.id}`
                              if (isEditing) {
                                return (
                                  <li key={n.id} className="bg-white/5 rounded-lg px-3 py-2.5 space-y-2">
                                    <Input
                                      value={editForm.name}
                                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                      placeholder="Nome da marca"
                                      className="h-8 bg-background/60 border-sidebar-border text-white text-sm"
                                    />
                                    <Input
                                      value={editForm.domain}
                                      onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                                      placeholder="dominio.com.br"
                                      className="h-8 bg-background/60 border-sidebar-border text-white text-sm"
                                    />
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={editForm.status}
                                        onValueChange={(v) => setEditForm({ ...editForm, status: v as NamingStatus })}
                                      >
                                        <SelectTrigger className="h-8 flex-1 bg-background/60 border-sidebar-border text-white text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-sidebar border-sidebar-border text-white">
                                          <SelectItem value="disponivel">Disponível</SelectItem>
                                          <SelectItem value="indisponivel">Indisponível</SelectItem>
                                          <SelectItem value="verificar">Verificar</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="sm"
                                        onClick={() => saveEdit(n.id)}
                                        disabled={isPending}
                                        className="h-8 bg-primary text-white hover:bg-primary/90"
                                      >
                                        <Save className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEdit}
                                        disabled={isPending}
                                        className="h-8 border-sidebar-border text-muted-foreground hover:text-white bg-transparent"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </li>
                                )
                              }
                              return (
                                <li
                                  key={n.id}
                                  className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-white">{n.name}</span>
                                      <StatusBadge status={n.status} />
                                    </div>
                                    {n.domain && (
                                      <a
                                        href={n.domain.startsWith("http") ? n.domain : `https://${n.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                                      >
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        {n.domain.replace(/^https?:\/\//, "")}
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      onClick={() => copyText(formatEntry(n), copyKey)}
                                      title="Copiar nome"
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-primary/10 transition-colors"
                                    >
                                      {copiedKey === copyKey ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => startEdit(n)}
                                      title="Editar"
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-primary/10 transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeName(n.id)}
                                      title="Excluir"
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )}

                        {/* Adicionar nome neste nicho */}
                        <button
                          onClick={() => openNameModal(country.code, niche)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar nome
                        </button>
                      </div>
                    )
                  })
                )}

                {/* Adicionar nicho */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-dashed border-sidebar-border text-muted-foreground hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => openNicheModal(country.code)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar nicho
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal: adicionar nome */}
      <Dialog open={nameModalOpen} onOpenChange={(open) => !open && setNameModalOpen(false)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {nameTargetCountryData && (
                <CountryFlag code={nameTargetCountryData.code} name={nameTargetCountryData.name} className="w-6 h-4" />
              )}
              Adicionar Nome
              {nameTarget && (
                <span className="text-muted-foreground font-normal text-sm">— {nameTarget.niche}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name" className="text-sm text-muted-foreground">
                Nome da marca
              </Label>
              <Input
                id="brand-name"
                placeholder="Ex: Lumara"
                value={nameForm.name}
                onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-domain" className="text-sm text-muted-foreground">
                Domínio
              </Label>
              <Input
                id="brand-domain"
                placeholder="Ex: lumara.com.br"
                value={nameForm.domain}
                onChange={(e) => setNameForm({ ...nameForm, domain: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-status" className="text-sm text-muted-foreground">
                Status de disponibilidade
              </Label>
              <Select
                value={nameForm.status}
                onValueChange={(v) => setNameForm({ ...nameForm, status: v as NamingStatus })}
              >
                <SelectTrigger id="brand-status" className="bg-background/50 border-sidebar-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-sidebar border-sidebar-border text-white">
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                  <SelectItem value="verificar">Verificar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setNameModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
                onClick={handleAddName}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: adicionar nicho */}
      <Dialog open={nicheModalOpen} onOpenChange={(open) => !open && setNicheModalOpen(false)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {nicheCountryData && (
                <CountryFlag code={nicheCountryData.code} name={nicheCountryData.name} className="w-6 h-4" />
              )}
              Adicionar Nicho
              {nicheCountryData && (
                <span className="text-muted-foreground font-normal text-sm">— {nicheCountryData.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="niche-name" className="text-sm text-muted-foreground">
                Nome do nicho
              </Label>
              <Input
                id="niche-name"
                placeholder="Ex: Moda Feminina"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleAddNiche()
                }}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {NICHE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNicheInput(s)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-sidebar-border text-muted-foreground hover:text-white hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {nicheError && <p className="text-xs text-red-400">{nicheError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setNicheModalOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
                onClick={handleAddNiche}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
