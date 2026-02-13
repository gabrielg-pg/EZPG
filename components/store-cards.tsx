"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Store,
  MapPin,
  Globe,
  MoreVertical,
  Loader2,
  Eye,
  Copy,
  Edit,
  ExternalLink,
  ShoppingBag,
  Tag,
  Languages,
  Download,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { deleteStore, updateStoreProgress, getStoreDetails, updateStore } from "@/app/actions/store-actions"
import { cn } from "@/lib/utils"
import { formatDateBR as formatDateBRUtil, calculateDeliveryDate, getBusinessDaysByPlan } from "@/lib/date"

interface StoreData {
  id: number
  name: string
  store_number: string
  region: "brasil" | "global"
  plan: string
  progress: number
  status: "em_andamento" | "concluido" | "pendente"
  created_at: string | Date
  customer_name?: string
  drive_link?: string
  created_by_name?: string
  niche?: string
  num_products?: number
  country?: string
  language?: string
  logo_references_url?: string
  collections?: string
}

interface StoreDetails {
  store: StoreData
  customer: {
    name: string
    birth_date: string
    cpf: string
    address: string
    address_number: string
    cep: string
  }
  accounts: Array<{
    account_type: string
    login: string
    password: string
    enabled: boolean
  }>
}

const statusConfig = {
  em_andamento: { label: "Em andamento", variant: "default" as const },
  concluido: { label: "Concluído", variant: "secondary" as const },
  pendente: { label: "Pendente", variant: "outline" as const },
}

const userColors: Record<string, string> = {
  GabrielPG: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  comercial: "bg-green-500/20 text-green-400 border-green-500/30",
  default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

const planOptions = [
  { id: "Start Growth", name: "Start Growth" },
  { id: "Pro Vértebra", name: "Pro Vértebra" },
  { id: "Scale Vértebra", name: "Scale Vértebra" },
  { id: "Scale Global", name: "Scale Global" },
  // Legacy plans for backwards compatibility
  { id: "Start PRO GROWTH", name: "Start PRO GROWTH" },
  { id: "Pro VÉRTEBRA", name: "Pro VÉRTEBRA" },
  { id: "Scale VÉRTEBRA+ BR", name: "Scale VÉRTEBRA+ BR" },
  { id: "Scale VÉRTEBRA+ GLOBAL", name: "Scale VÉRTEBRA+ GLOBAL" },
]

const accountsBRPlans = [
  { id: "gmail", name: "Gmail" },
  { id: "shopify", name: "Shopify" },
  { id: "hostinger", name: "Hostinger" },
  { id: "yampi", name: "Yampi" },
  { id: "appmax", name: "Appmax" },
  { id: "aliexpress", name: "Aliexpress" },
  { id: "dsers", name: "DSers" },
]

const accountsGlobalPlan = [
  { id: "gmail", name: "Gmail" },
  { id: "shopify", name: "Shopify" },
  { id: "hostinger", name: "Hostinger" },
  { id: "1st_information", name: "1ST Information" },
  { id: "hypersku", name: "HyperSKU" },
]

function isGlobalPlan(plan: string) {
  return plan === "Scale Global" || plan === "Scale VÉRTEBRA+ GLOBAL"
}

function getAccountsForPlan(plan: string) {
  if (isGlobalPlan(plan)) {
    return accountsGlobalPlan
  }
  return accountsBRPlans
}

function formatDateBR(value: string) {
  if (!value) return "-"
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const isoDate = value.includes("T") ? value : `${value}T12:00:00`
    const d = new Date(isoDate)
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR")
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("/")
    const d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`)
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR")
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR")
}

function generateRawText(details: StoreDetails): string {
  const { store, customer, accounts } = details

  const accountsText = accounts
    .filter((acc) => acc.enabled)
    .map(
      (acc) =>
        `${acc.account_type.charAt(0).toUpperCase() + acc.account_type.slice(1)}:\nLogin: ${acc.login}\nSenha: ${acc.password}`,
    )
    .join("\n\n")

  return `DADOS CLIENTE:

Nome completo: ${customer.name}
Data de nascimento: ${formatDateBR(customer.birth_date)}
Endereço completo com CEP: ${customer.address}, ${customer.address_number}
CEP: ${customer.cep}
CPF: ${customer.cpf}

DRIVE: ${store.drive_link || "Não informado"}

PLANO: ${store.plan}
PRODUTOS: ${store.num_products || "-"}
NICHO: ${store.niche || "-"}
REGIÃO: ${store.region === "global" ? `Global - ${store.country || ""} (${store.language || ""})` : "Brasil"}
${store.collections ? `\nCOLEÇÕES:\n${store.collections}` : ""}
DADOS CONTAS:

${accountsText}`
}

function RegionDisplay({ store }: { store: StoreData }) {
  if (store.region === "global") {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span className="text-foreground">Global</span>
        {store.country && (
          <>
            <span className="text-muted-foreground">-</span>
            <span className="text-muted-foreground">{store.country}</span>
          </>
        )}
        {store.language && (
          <>
            <span className="text-muted-foreground">/</span>
            <Languages className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{store.language}</span>
          </>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <MapPin className="h-3.5 w-3.5 text-primary" />
      <span className="text-foreground">Brasil</span>
    </div>
  )
}

interface EditFormState {
  name: string
  store_number: string
  drive_link: string
  region: string
  plan: string
  niche: string
  num_products: string
  country: string
  language: string
  collections: string
  customer_name: string
  birth_date: string
  cpf: string
  address: string
  address_number: string
  cep: string
  accounts: Record<string, { login: string; password: string; enabled: boolean }>
}

export function StoreCards({ initialStores }: { initialStores: StoreData[] }) {
  const [stores, setStores] = useState<StoreData[]>(initialStores)
  const [isPending, startTransition] = useTransition()
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    store_number: "",
    drive_link: "",
    region: "brasil",
    plan: "",
    niche: "",
    num_products: "",
    country: "",
    language: "",
    collections: "",
    customer_name: "",
    birth_date: "",
    cpf: "",
    address: "",
    address_number: "",
    cep: "",
    accounts: {},
  })
  const [copySuccess, setCopySuccess] = useState(false)

  const handleDelete = async (storeId: number) => {
    startTransition(async () => {
      const result = await deleteStore(storeId)
      if (result.success) {
        setStores(stores.filter((s) => s.id !== storeId))
      }
    })
  }

  const handleUpdateProgress = async (storeId: number, progress: number) => {
    startTransition(async () => {
      const result = await updateStoreProgress(storeId, progress)
      if (result.success) {
        setStores(
          stores.map((s) =>
            s.id === storeId
              ? {
                  ...s,
                  progress,
                  status: progress >= 100 ? "concluido" : progress > 0 ? "em_andamento" : "pendente",
                }
              : s,
          ),
        )
      }
    })
  }

  const handleViewStore = async (storeId: number) => {
    startTransition(async () => {
      const result = await getStoreDetails(storeId)
      if (result.success && result.data) {
        setSelectedStore(result.data as StoreDetails)
        setViewDialogOpen(true)
      }
    })
  }

  const handleMarkAsConcluded = async () => {
    if (!selectedStore) return
    startTransition(async () => {
      const result = await updateStoreProgress(selectedStore.store.id, 100)
      if (result.success) {
        setStores(
          stores.map((s) =>
            s.id === selectedStore.store.id ? { ...s, progress: 100, status: "concluido" } : s,
          ),
        )
        setViewDialogOpen(false)
      }
    })
  }

  const handleEditStore = async (storeId: number) => {
    startTransition(async () => {
      const result = await getStoreDetails(storeId)
      if (result.success && result.data) {
        const details = result.data as StoreDetails
        setSelectedStore(details)

        // Build accounts map from existing data
        const accountsMap: Record<string, { login: string; password: string; enabled: boolean }> = {}
        const planAccounts = getAccountsForPlan(details.store.plan)
        for (const acc of planAccounts) {
          const existing = details.accounts.find((a) => a.account_type === acc.id)
          accountsMap[acc.id] = existing
            ? { login: existing.login, password: existing.password, enabled: existing.enabled }
            : { login: "", password: "", enabled: false }
        }

        setEditForm({
          name: details.store.name || "",
          store_number: details.store.store_number || "",
          drive_link: details.store.drive_link || "",
          region: details.store.region || "brasil",
          plan: details.store.plan || "",
          niche: details.store.niche || "",
          num_products: details.store.num_products?.toString() || "",
          country: details.store.country || "",
          language: details.store.language || "",
          collections: details.store.collections || "",
          customer_name: details.customer.name || "",
          birth_date: details.customer.birth_date ? formatDateBR(details.customer.birth_date) : "",
          cpf: details.customer.cpf || "",
          address: details.customer.address || "",
          address_number: details.customer.address_number || "",
          cep: details.customer.cep || "",
          accounts: accountsMap,
        })
        setEditDialogOpen(true)
      }
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedStore) return
    startTransition(async () => {
      // Prepare accounts array
      const accountsList = Object.entries(editForm.accounts).map(([type, data]) => ({
        account_type: type,
        login: data.login,
        password: data.password,
        enabled: data.enabled,
      }))

      const result = await updateStore(selectedStore.store.id, {
        name: editForm.name,
        store_number: editForm.store_number,
        drive_link: editForm.drive_link,
        region: editForm.region,
        plan: editForm.plan,
        niche: editForm.niche,
        num_products: parseInt(editForm.num_products) || undefined,
        country: editForm.country,
        language: editForm.language,
        collections: editForm.collections,
        customer_name: editForm.customer_name,
        cpf: editForm.cpf,
        address: editForm.address,
        address_number: editForm.address_number,
        cep: editForm.cep,
        accounts: accountsList,
      })
      if (result.success) {
        setStores(
          stores.map((s) =>
            s.id === selectedStore.store.id
              ? {
                  ...s,
                  name: editForm.name,
                  store_number: editForm.store_number,
                  drive_link: editForm.drive_link,
                  region: editForm.region as "brasil" | "global",
                  plan: editForm.plan,
                  niche: editForm.niche,
                  num_products: parseInt(editForm.num_products) || undefined,
                  country: editForm.country,
                  language: editForm.language,
                  customer_name: editForm.customer_name,
                }
              : s,
          ),
        )
        setEditDialogOpen(false)
      }
    })
  }

  const handleEditPlanChange = (newPlan: string) => {
    const newAccounts: Record<string, { login: string; password: string; enabled: boolean }> = {}
    const planAccounts = getAccountsForPlan(newPlan)
    for (const acc of planAccounts) {
      newAccounts[acc.id] = editForm.accounts[acc.id] || { login: "", password: "", enabled: false }
    }
    setEditForm((prev) => ({ ...prev, plan: newPlan, accounts: newAccounts }))
  }

  async function handleCopyRaw() {
    if (!selectedStore) return
    const rawText = generateRawText(selectedStore)
    if (!rawText || typeof rawText !== "string") return
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawText)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = rawText
        textarea.setAttribute("readonly", "")
        textarea.style.position = "fixed"
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Erro ao copiar texto bruto:", err)
    }
  }

  const editCurrentAccounts = getAccountsForPlan(editForm.plan)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Lojas em Onboarding</h2>
          <p className="text-muted-foreground">Gerencie o processo de onboarding das suas lojas</p>
        </div>
        <Link href="/nova-loja">
          <Button className="shadow-lg shadow-primary/20 rounded-xl h-11 px-5">
            <Plus className="mr-2 h-4 w-4" />
            Nova Loja
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stores.length}</p>
                <p className="text-sm text-muted-foreground">Total de Lojas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center border border-yellow-500/20">
                <Store className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {stores.filter((s) => s.status === "em_andamento").length}
                </p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center border border-green-500/20">
                <Store className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {stores.filter((s) => s.status === "concluido").length}
                </p>
                <p className="text-sm text-muted-foreground">Concluidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Cards Grid */}
      {stores.length === 0 ? (
        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma loja cadastrada</h3>
            <p className="text-muted-foreground mb-6">Comece cadastrando sua primeira loja para iniciar o onboarding</p>
            <Link href="/nova-loja">
              <Button className="shadow-lg shadow-primary/20 rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Nova Loja
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {stores.map((store) => (
            <Card
              key={store.id}
              className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 hover:border-primary/30 transition-all duration-300 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                      {store.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Loja #{store.store_number}
                    </CardDescription>
                    {store.drive_link && (
                      <a
                        href={store.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Link do Drive
                      </a>
                    )}
                    {store.logo_references_url && (
                      <a
                        href={store.logo_references_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Baixar Referências
                      </a>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewStore(store.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditStore(store.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleUpdateProgress(store.id, Math.min(store.progress + 25, 100))}
                      >
                        Avançar progresso
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateProgress(store.id, 100)}>
                        Marcar como 100%
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(store.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Region */}
                <RegionDisplay store={store} />

                {/* Niche & Products */}
                {(store.niche || store.num_products) && (
                  <div className="flex items-center flex-wrap gap-2">
                    {store.niche && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {store.niche}
                      </Badge>
                    )}
                    {store.num_products && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {store.num_products} produtos
                      </Badge>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cadastrado em:</span>
                    <span className="text-foreground font-medium">{formatDateBRUtil(store.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entregar até:</span>
                    <span className="text-foreground font-medium">
                      {formatDateBRUtil(calculateDeliveryDate(store.created_at, store.plan))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prazo:</span>
                    <span className="text-primary font-medium">
                      {getBusinessDaysByPlan(store.plan)} dias úteis
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-foreground font-medium">{store.progress}%</span>
                  </div>
                  <Progress value={store.progress} className="h-2" />
                </div>

                {/* Status + Plan */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge
                    variant={statusConfig[store.status].variant}
                    className={
                      store.status === "concluido"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : store.status === "em_andamento"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground"
                    }
                  >
                    {statusConfig[store.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{store.plan}</span>
                </div>

                {/* Created by */}
                {store.created_by_name && (
                  <Badge
                    variant="outline"
                    className={cn("text-xs", userColors[store.created_by_name] || userColors.default)}
                  >
                    {store.created_by_name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes da Loja</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedStore?.store.name} - #{selectedStore?.store.store_number}
            </DialogDescription>
          </DialogHeader>

          {selectedStore && (
            <div className="space-y-6">
              {/* Customer Data */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-primary/15 pb-2">Dados do Cliente</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="text-foreground font-medium">{selectedStore.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Nascimento:</span>
                    <p className="text-foreground font-medium">{formatDateBR(selectedStore.customer.birth_date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="text-foreground font-medium">{selectedStore.customer.cpf}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CEP:</span>
                    <p className="text-foreground font-medium">{selectedStore.customer.cep}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="text-foreground font-medium">
                      {selectedStore.customer.address}, {selectedStore.customer.address_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-primary/15 pb-2">Informações da Loja</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plano:</span>
                    <p className="text-foreground font-medium">{selectedStore.store.plan}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Região:</span>
                    <p className="text-foreground font-medium capitalize">
                      {selectedStore.store.region === "global"
                        ? `Global - ${selectedStore.store.country || ""} (${selectedStore.store.language || ""})`
                        : "Brasil"}
                    </p>
                  </div>
                  {selectedStore.store.niche && (
                    <div>
                      <span className="text-muted-foreground">Nicho:</span>
                      <p className="text-foreground font-medium">{selectedStore.store.niche}</p>
                    </div>
                  )}
                  {selectedStore.store.num_products && (
                    <div>
                      <span className="text-muted-foreground">Produtos:</span>
                      <p className="text-foreground font-medium">{selectedStore.store.num_products}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Link do Drive:</span>
                    <p className="text-foreground font-medium">
                      {selectedStore.store.drive_link ? (
                        <a
                          href={selectedStore.store.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {selectedStore.store.drive_link}
                        </a>
                      ) : (
                        "Não informado"
                      )}
                    </p>
                  </div>
                  {selectedStore.store.logo_references_url && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Referências de Logo:</span>
                      <p className="text-foreground font-medium">
                        <a
                          href={selectedStore.store.logo_references_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Baixar Referências
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Collections */}
              {selectedStore.store.collections && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground border-b border-primary/15 pb-2">Coleções da Loja</h4>
                  <div className="space-y-1.5">
                    {selectedStore.store.collections.split("\n").filter(Boolean).map((collection: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground">{collection.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-primary/15 pb-2">Dados das Contas</h4>
                {selectedStore.accounts
                  .filter((a) => a.enabled)
                  .map((account) => (
                    <div
                      key={account.account_type}
                      className="p-3 bg-primary/10 rounded-lg border border-primary/15"
                    >
                      <p className="font-medium text-foreground capitalize mb-2">{account.account_type}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Login:</span>
                          <p className="text-foreground">{account.login}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Senha:</span>
                          <p className="text-foreground">{account.password}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Raw Text */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-primary/15 pb-2">Texto Gerado</h4>
                <Textarea value={generateRawText(selectedStore)} readOnly className="h-48 text-xs font-mono" />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedStore?.store.status !== "concluido" && (
              <Button
                onClick={handleMarkAsConcluded}
                disabled={isPending}
                className="bg-green-600/80 hover:bg-green-600 text-green-50"
              >
                Marcar como concluída
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleCopyRaw}>
              <Copy className="h-4 w-4 mr-2" />
              {copySuccess ? "Copiado!" : "Copiar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="text-foreground">Editar Loja</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Edite todas as informações da loja
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
            <div className="space-y-6 pb-6">
              {/* Store Info Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground text-sm border-b border-primary/15 pb-2">
                  Informações da Loja
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Nome da Loja</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Número da Loja</Label>
                    <Input
                      value={editForm.store_number}
                      onChange={(e) => setEditForm({ ...editForm, store_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Link do Drive</Label>
                  <Input
                    value={editForm.drive_link}
                    onChange={(e) => setEditForm({ ...editForm, drive_link: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Região</Label>
                  <RadioGroup
                    value={editForm.region}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
                        region: value,
                        country: value === "brasil" ? "" : editForm.country,
                        language: value === "brasil" ? "" : editForm.language,
                      })
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="edit-brasil"
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors text-sm",
                        editForm.region === "brasil"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/50",
                      )}
                    >
                      <RadioGroupItem value="brasil" id="edit-brasil" />
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-foreground">Brasil</span>
                    </Label>
                    <Label
                      htmlFor="edit-global"
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors text-sm",
                        editForm.region === "global"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/50",
                      )}
                    >
                      <RadioGroupItem value="global" id="edit-global" />
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-foreground">Global</span>
                    </Label>
                  </RadioGroup>
                </div>

                {editForm.region === "global" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">País</Label>
                      <Input
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        placeholder="Ex: Estados Unidos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground text-sm">Idioma</Label>
                      <Input
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                        placeholder="Ex: Inglês"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-primary/10" />

              {/* Plan, Niche, Products */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground text-sm border-b border-primary/15 pb-2">
                  Plano e Produtos
                </h4>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Plano</Label>
                  <RadioGroup
                    value={editForm.plan}
                    onValueChange={handleEditPlanChange}
                    className="grid grid-cols-2 gap-3"
                  >
                    {planOptions.slice(0, 4).map((plan) => (
                      <Label
                        key={plan.id}
                        htmlFor={`edit-plan-${plan.id}`}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors text-sm",
                          editForm.plan === plan.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-primary/50",
                        )}
                      >
                        <RadioGroupItem value={plan.id} id={`edit-plan-${plan.id}`} />
                        <span className="text-foreground">{plan.name}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                  {/* Show legacy plan if it doesn't match new ones */}
                  {editForm.plan && !planOptions.slice(0, 4).some((p) => p.id === editForm.plan) && (
                    <p className="text-xs text-muted-foreground">
                      Plano atual: <span className="text-primary">{editForm.plan}</span> (legado)
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Número de Produtos</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editForm.num_products}
                      onChange={(e) => setEditForm({ ...editForm, num_products: e.target.value })}
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Nicho</Label>
                    <Input
                      value={editForm.niche}
                      onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                      placeholder="Ex: Moda, Eletrônicos..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Coleções da Loja</Label>
                  <Textarea
                    value={editForm.collections}
                    onChange={(e) => setEditForm({ ...editForm, collections: e.target.value })}
                    placeholder={"Escreva uma coleção por linha\nEx:\nCamisetas\nCalças\nAcessórios"}
                    rows={5}
                    className="resize-y min-h-[100px]"
                  />
                </div>
              </div>

              <Separator className="bg-primary/10" />

              {/* Customer Data */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground text-sm border-b border-primary/15 pb-2">
                  Dados do Cliente
                </h4>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Nome Completo</Label>
                  <Input
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">CPF</Label>
                    <Input
                      value={editForm.cpf}
                      onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">CEP</Label>
                    <Input
                      value={editForm.cep}
                      onChange={(e) => setEditForm({ ...editForm, cep: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Endereço</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Número</Label>
                    <Input
                      value={editForm.address_number}
                      onChange={(e) => setEditForm({ ...editForm, address_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-primary/10" />

              {/* Accounts */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground text-sm border-b border-primary/15 pb-2">
                  Contas
                </h4>
                {editCurrentAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      editForm.accounts[account.id]?.enabled
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary",
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Checkbox
                        id={`edit-${account.id}-enabled`}
                        checked={editForm.accounts[account.id]?.enabled || false}
                        onCheckedChange={(checked) =>
                          setEditForm({
                            ...editForm,
                            accounts: {
                              ...editForm.accounts,
                              [account.id]: {
                                ...editForm.accounts[account.id],
                                enabled: !!checked,
                              },
                            },
                          })
                        }
                        className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label
                        htmlFor={`edit-${account.id}-enabled`}
                        className="text-foreground text-sm font-medium cursor-pointer"
                      >
                        {account.name}
                      </Label>
                    </div>
                    {editForm.accounts[account.id]?.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Login</Label>
                          <Input
                            value={editForm.accounts[account.id]?.login || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                accounts: {
                                  ...editForm.accounts,
                                  [account.id]: {
                                    ...editForm.accounts[account.id],
                                    login: e.target.value,
                                  },
                                },
                              })
                            }
                            placeholder="Email ou usuário"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs">Senha</Label>
                          <Input
                            value={editForm.accounts[account.id]?.password || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                accounts: {
                                  ...editForm.accounts,
                                  [account.id]: {
                                    ...editForm.accounts[account.id],
                                    password: e.target.value,
                                  },
                                },
                              })
                            }
                            placeholder="Senha da conta"
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 pt-2 border-t border-primary/10">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
