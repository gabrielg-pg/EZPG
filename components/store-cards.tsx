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
import { Plus, Store, Calendar, MapPin, MoreVertical, Loader2, Eye, Copy, Edit, ExternalLink } from "lucide-react"
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

function formatDateBR(value: string) {
  if (!value) return "-"

  // Se vier como YYYY-MM-DD ou ISO completo
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const isoDate = value.includes("T") ? value : `${value}T12:00:00`
    const d = new Date(isoDate)
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR")
  }

  // Se vier como DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("/")
    const d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`)
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR")
  }

  // Fallback: tenta como Date normal
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

  const planProducts: Record<string, string> = {
    "Start PRO GROWTH": "30 produtos",
    "Pro VÉRTEBRA": "50 produtos",
    "Scale VÉRTEBRA+ BR": "100 produtos",
    "Scale VÉRTEBRA+ GLOBAL": "100 produtos",
  }

  return `DADOS CLIENTE:

Nome completo: ${customer.name}
Data de nascimento: ${formatDateBR(customer.birth_date)}
Endereço completo com CEP: ${customer.address}, ${customer.address_number}
CEP: ${customer.cep}
CPF: ${customer.cpf}

DRIVE: ${store.drive_link || "Não informado"}

PRODUTOS: ${planProducts[store.plan] || store.plan}

DADOS CONTAS:

E-mail:
Login: ${accounts.find((a) => a.account_type === "hostinger")?.login || "-"}
Senha: ${accounts.find((a) => a.account_type === "hostinger")?.password || "-"}

${accountsText}`
}

export function StoreCards({ initialStores }: { initialStores: StoreData[] }) {
  const [stores, setStores] = useState<StoreData[]>(initialStores)
  const [isPending, startTransition] = useTransition()
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreDetails | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<StoreData>>({})
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
              status:
                progress >= 100
                  ? "concluido"
                  : progress > 0
                  ? "em_andamento"
                  : "pendente",
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
        setSelectedStore(result.data as StoreDetails)
        setEditFormData(result.data.store)
        setEditDialogOpen(true)
      }
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedStore) return
    startTransition(async () => {
      const result = await updateStore(selectedStore.store.id, editFormData)
      if (result.success) {
        setStores(stores.map((s) => (s.id === selectedStore.store.id ? { ...s, ...editFormData } : s)))
        setEditDialogOpen(false)
      }
    })
  }

  async function handleCopyRaw() {
  if (!selectedStore) return

  const rawText = generateRawText(selectedStore)

  if (!rawText || typeof rawText !== "string") return

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(rawText)
    } else {
      // fallback seguro
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
            <Card key={store.id} className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 hover:border-primary/30 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-foreground group-hover:text-primary transition-colors">{store.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">Loja #{store.store_number}</CardDescription>
                    {store.drive_link && (
                      <a
                        href={store.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#A855F7] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Link do Drive
                      </a>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[#9CA3AF] hover:text-white">
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
                      <DropdownMenuItem
                        onClick={() => handleUpdateProgress(store.id, 100)}
                      >
                        Marcar como 100%
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-400" onClick={() => handleDelete(store.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="capitalize">{store.region}</span>
                  </div>
                </div>

                {/* Datas e Prazo */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Cadastrado em:</span>
                    <span className="text-white font-medium">
                      {formatDateBRUtil(store.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Entregar até:</span>
                    <span className="text-white font-medium">
                      {formatDateBRUtil(calculateDeliveryDate(store.created_at, store.plan))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF]">Prazo:</span>
                    <span className="text-[#A855F7] font-medium">
                      {getBusinessDaysByPlan(store.plan)} dias úteis
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9CA3AF]">Progresso</span>
                    <span className="text-white font-medium">{store.progress}%</span>
                  </div>
                  <Progress value={store.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge
                    variant={statusConfig[store.status].variant}
                    className={
                      store.status === "concluido"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : store.status === "em_andamento"
                          ? "bg-[rgba(139,92,246,0.2)] text-[#A855F7] border-[rgba(139,92,246,0.3)]"
                          : "bg-[rgba(255,255,255,0.06)] text-[#9CA3AF]"
                    }
                  >
                    {statusConfig[store.status].label}
                  </Badge>
                  <span className="text-xs text-[#9CA3AF]">{store.plan}</span>
                </div>

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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes da Loja</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              {selectedStore?.store.name} - #{selectedStore?.store.store_number}
            </DialogDescription>
          </DialogHeader>

          {selectedStore && (
            <div className="space-y-6">
              {/* Dados do Cliente */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white border-b border-[rgba(139,92,246,0.15)] pb-2">Dados do Cliente</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#9CA3AF]">Nome:</span>
                    <p className="text-white font-medium">{selectedStore.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Data de Nascimento:</span>
                    <p className="text-white font-medium">{formatDateBR(selectedStore.customer.birth_date)}</p>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">CPF:</span>
                    <p className="text-white font-medium">{selectedStore.customer.cpf}</p>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">CEP:</span>
                    <p className="text-white font-medium">{selectedStore.customer.cep}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9CA3AF]">Endereço:</span>
                    <p className="text-white font-medium">
                      {selectedStore.customer.address}, {selectedStore.customer.address_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drive e Plano */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white border-b border-[rgba(139,92,246,0.15)] pb-2">Informações da Loja</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#9CA3AF]">Plano:</span>
                    <p className="text-white font-medium">{selectedStore.store.plan}</p>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Região:</span>
                    <p className="text-white font-medium capitalize">{selectedStore.store.region}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9CA3AF]">Link do Drive:</span>
                    <p className="text-white font-medium">
                      {selectedStore.store.drive_link ? (
                        <a
                          href={selectedStore.store.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#A855F7] hover:underline"
                        >
                          {selectedStore.store.drive_link}
                        </a>
                      ) : (
                        "Não informado"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contas */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white border-b border-[rgba(139,92,246,0.15)] pb-2">Dados das Contas</h4>
                {selectedStore.accounts
                  .filter((a) => a.enabled)
                  .map((account) => (
                    <div key={account.account_type} className="p-3 bg-[rgba(139,92,246,0.1)] rounded-lg border border-[rgba(139,92,246,0.15)]">
                      <p className="font-medium text-white capitalize mb-2">{account.account_type}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[#9CA3AF]">Login:</span>
                          <p className="text-white">{account.login}</p>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF]">Senha:</span>
                          <p className="text-white">{account.password}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Texto Gerado */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white border-b border-[rgba(139,92,246,0.15)] pb-2">Texto Gerado</h4>
                <Textarea
                  value={generateRawText(selectedStore)}
                  readOnly
                  className="h-48 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedStore?.store.status !== "concluido" && (
              <Button
                onClick={handleMarkAsConcluded}
                disabled={isPending}
                className="bg-green-600/80 hover:bg-green-600 text-white"
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Editar Loja</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">Edite as informações da loja</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Nome da Loja</Label>
              <Input
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Número da Loja</Label>
              <Input
                value={editFormData.store_number || ""}
                onChange={(e) => setEditFormData({ ...editFormData, store_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Link do Drive</Label>
              <Input
                value={editFormData.drive_link || ""}
                onChange={(e) => setEditFormData({ ...editFormData, drive_link: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
