"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, ExternalLink, X, Store, Loader2, Globe, Trash2 } from "lucide-react"
import {
  createStoreReference,
  deleteStoreReference,
  addStoreReferenceCountry,
  deleteStoreReferenceCountry,
  type StoreReferenceEntry,
  type StoreReferenceCountry,
} from "@/app/actions/store-reference-actions"

const NICHES = [
  "Moda Feminina",
  "Moda Masculina",
  "Moda Infantil",
  "Calçados",
  "Acessórios",
  "Beleza & Cosméticos",
  "Casa & Decoração",
  "Eletrônicos",
  "Esportes & Fitness",
  "Alimentos & Bebidas",
  "Saúde & Bem-estar",
  "Pet Shop",
  "Jóias & Relógios",
  "Brinquedos",
  "Livros & Papelaria",
  "Automotivo",
  "Viagem & Turismo",
  "Tecnologia",
  "Artesanato",
  "Outro",
]

// Lista mestre de países disponíveis para adicionar (código ISO para a bandeira)
const ALL_COUNTRIES = [
  { name: "Brasil", code: "br" },
  { name: "Estados Unidos", code: "us" },
  { name: "Portugal", code: "pt" },
  { name: "Espanha", code: "es" },
  { name: "Alemanha", code: "de" },
  { name: "Canadá", code: "ca" },
  { name: "Reino Unido", code: "gb" },
  { name: "Austrália", code: "au" },
  { name: "França", code: "fr" },
  { name: "Itália", code: "it" },
  { name: "Holanda", code: "nl" },
  { name: "Bélgica", code: "be" },
  { name: "Suíça", code: "ch" },
  { name: "Áustria", code: "at" },
  { name: "Irlanda", code: "ie" },
  { name: "Suécia", code: "se" },
  { name: "Noruega", code: "no" },
  { name: "Dinamarca", code: "dk" },
  { name: "Finlândia", code: "fi" },
  { name: "Polônia", code: "pl" },
  { name: "México", code: "mx" },
  { name: "Argentina", code: "ar" },
  { name: "Chile", code: "cl" },
  { name: "Colômbia", code: "co" },
  { name: "Japão", code: "jp" },
  { name: "China", code: "cn" },
  { name: "Coreia do Sul", code: "kr" },
  { name: "Índia", code: "in" },
  { name: "Emirados Árabes", code: "ae" },
  { name: "Nova Zelândia", code: "nz" },
  { name: "África do Sul", code: "za" },
]

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

interface AddStoreForm {
  name: string
  site: string
  niche: string
}

export function StoreReference({
  initialStores,
  initialCountries = [],
}: {
  initialStores: StoreReferenceEntry[]
  initialCountries?: StoreReferenceCountry[]
}) {
  const [stores, setStores] = useState<StoreReferenceEntry[]>(initialStores)
  const [countries, setCountries] = useState<StoreReferenceCountry[]>(initialCountries)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCountry, setActiveCountry] = useState<string | null>(null)
  const [form, setForm] = useState<AddStoreForm>({ name: "", site: "", niche: "" })
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Modal de adicionar país
  const [countryModalOpen, setCountryModalOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState("")
  const [countryError, setCountryError] = useState("")
  const [isCountryPending, startCountryTransition] = useTransition()

  const availableCountries = ALL_COUNTRIES.filter((ac) => !countries.some((c) => c.code === ac.code))

  const openCountryModal = () => {
    setSelectedCountry("")
    setCountryError("")
    setCountryModalOpen(true)
  }

  const handleAddCountry = () => {
    if (!selectedCountry) {
      setCountryError("Selecione um país.")
      return
    }
    const country = ALL_COUNTRIES.find((c) => c.code === selectedCountry)
    if (!country) return

    startCountryTransition(async () => {
      const result = await addStoreReferenceCountry({ code: country.code, name: country.name })
      if (result.success && result.country) {
        setCountries((prev) => [...prev, result.country as StoreReferenceCountry])
        setCountryModalOpen(false)
      } else {
        setCountryError(result.error || "Erro ao adicionar país.")
      }
    })
  }

  const handleRemoveCountry = (code: string) => {
    setCountries((prev) => prev.filter((c) => c.code !== code))
    setStores((prev) => prev.filter((s) => s.country !== code))
    startCountryTransition(async () => {
      await deleteStoreReferenceCountry(code)
    })
  }

  const openModal = (countryCode: string) => {
    setActiveCountry(countryCode)
    setForm({ name: "", site: "", niche: "" })
    setError("")
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setActiveCountry(null)
  }

  const handleAdd = () => {
    if (!form.name.trim()) {
      setError("Insira o nome da loja.")
      return
    }
    if (!form.site.trim()) {
      setError("Insira o site da loja.")
      return
    }
    if (!form.niche) {
      setError("Selecione um nicho.")
      return
    }
    if (!activeCountry) return

    startTransition(async () => {
      const result = await createStoreReference({
        name: form.name,
        site: form.site,
        niche: form.niche,
        country: activeCountry,
      })
      if (result.success && result.store) {
        setStores((prev) => [...prev, result.store as StoreReferenceEntry])
        closeModal()
      } else {
        setError(result.error || "Erro ao adicionar loja.")
      }
    })
  }

  const handleRemove = (storeId: number) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId))
    startTransition(async () => {
      await deleteStoreReference(storeId)
    })
  }

  const activeCountryData = countries.find((c) => c.code === activeCountry)

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
          onClick={openCountryModal}
          disabled={availableCountries.length === 0}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {countries.map((country) => {
          const countryStores = stores.filter((s) => s.country === country.code)
          return (
            <Card key={country.code} className="group/card bg-sidebar border-sidebar-border flex flex-col">
              <CardHeader className="pb-3 border-b border-sidebar-border">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <CountryFlag code={country.code} name={country.name} className="w-7 h-5" />
                  {country.name}
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                    {countryStores.length} {countryStores.length === 1 ? "loja" : "lojas"}
                  </span>
                  <button
                    onClick={() => handleRemoveCountry(country.code)}
                    className="opacity-0 group-hover/card:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1 rounded"
                    title="Remover país"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-3 space-y-2">
                {countryStores.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic py-2">Nenhuma loja adicionada ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {countryStores.map((store) => (
                      <li key={store.id} className="flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2 group">
                        <Store className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{store.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{store.niche}</p>
                          <a
                            href={store.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {store.site.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                        <button
                          onClick={() => handleRemove(store.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-0.5 rounded"
                          title="Remover"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 border-dashed border-sidebar-border text-muted-foreground hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => openModal(country.code)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar Loja
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Dialog open={countryModalOpen} onOpenChange={(open) => !open && setCountryModalOpen(false)}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-primary" />
              Adicionar País
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="country-select" className="text-sm text-muted-foreground">
                País
              </Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="country-select" className="bg-background/50 border-sidebar-border text-white">
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent className="bg-sidebar border-sidebar-border text-white max-h-72">
                  {availableCountries.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="focus:bg-white/10 focus:text-white">
                      <span className="flex items-center gap-2">
                        <CountryFlag code={c.code} name={c.name} className="w-5 h-3.5" />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {countryError && <p className="text-xs text-red-400">{countryError}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={() => setCountryModalOpen(false)}
                disabled={isCountryPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
                onClick={handleAddCountry}
                disabled={isCountryPending}
              >
                {isCountryPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-sidebar border-sidebar-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {activeCountryData && (
                <CountryFlag code={activeCountryData.code} name={activeCountryData.name} className="w-6 h-4" />
              )}
              Adicionar Loja
              {activeCountryData && (
                <span className="text-muted-foreground font-normal text-sm">— {activeCountryData.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="store-name" className="text-sm text-muted-foreground">
                Nome da loja
              </Label>
              <Input
                id="store-name"
                placeholder="Ex: Zara"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store-site" className="text-sm text-muted-foreground">
                Site da loja
              </Label>
              <Input
                id="store-site"
                placeholder="Ex: zara.com"
                value={form.site}
                onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="bg-background/50 border-sidebar-border text-white placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store-niche" className="text-sm text-muted-foreground">
                Nicho
              </Label>
              <Select value={form.niche} onValueChange={(val) => setForm({ ...form, niche: val })}>
                <SelectTrigger id="store-niche" className="bg-background/50 border-sidebar-border text-white">
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent className="bg-sidebar border-sidebar-border text-white">
                  {NICHES.map((n) => (
                    <SelectItem key={n} value={n} className="focus:bg-white/10 focus:text-white">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-sidebar-border text-muted-foreground hover:text-white hover:bg-white/5"
                onClick={closeModal}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25"
                onClick={handleAdd}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
