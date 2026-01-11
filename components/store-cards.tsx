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

interface StoreData {
  id: number
  name: string
  store_number: string
  region: "brasil" | "global"
  plan: string
  progress: number
  status: "em_andamento" | "concluido" | "pendente"
  created_at: string
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

function formatDateBR(dateStr: string) {
  if (!dateStr) return "-"
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("pt-BR")
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lojas em Onboarding</h2>
          <p className="text-muted-foreground">Gerencie o processo de onboarding das suas lojas</p>
        </div>
        <Link href="/nova-loja">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Nova Loja
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stores.length}</p>
                <p className="text-sm text-muted-foreground">Total de Lojas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Store className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stores.filter((s) => s.status === "em_andamento").length}
                </p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Store className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stores.filter((s) => s.status === "concluido").length}
                </p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Cards Grid */}
      {stores.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma loja cadastrada</h3>
            <p className="text-muted-foreground mb-4">Comece cadastrando sua primeira loja</p>
            <Link href="/nova-loja">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Nova Loja
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Card key={store.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-foreground">{store.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">Loja #{store.store_number}</CardDescription>
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
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem className="text-popover-foreground" onClick={() => handleViewStore(store.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-popover-foreground" onClick={() => handleEditStore(store.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-popover-foreground"
                        onClick={() => handleUpdateProgress(store.id, Math.min(store.progress + 25, 100))}
                      >
                        Avançar progresso
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-popover-foreground"
                        onClick={() => handleUpdateProgress(store.id, 100)}
                      >
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="capitalize">{store.region}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateBR(
  typeof store.created_at === "string"
    ? store.created_at.split("T")[0]
    : new Date(store.created_at).toISOString().split("T")[0]
)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-foreground font-medium">{store.progress}%</span>
                  </div>
                  <Progress value={store.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge
                    variant={statusConfig[store.status].variant}
                    className={
                      store.status === "concluido"
                        ? "bg-green-500/20 text-green-500 border-green-500/30"
                        : store.status === "em_andamento"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground"
                    }
                  >
                    {statusConfig[store.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{store.plan}</span>
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
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes da Loja</DialogTitle>
            <DialogDescription>
              {selectedStore?.store.name} - #{selectedStore?.store.store_number}
            </DialogDescription>
          </DialogHeader>

          {selectedStore && (
            <div className="space-y-6">
              {/* Dados do Cliente */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-border pb-2">Dados do Cliente</h4>
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

              {/* Drive e Plano */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-border pb-2">Informações da Loja</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plano:</span>
                    <p className="text-foreground font-medium">{selectedStore.store.plan}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Região:</span>
                    <p className="text-foreground font-medium capitalize">{selectedStore.store.region}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Link do Drive:</span>
                    <p className="text-foreground font-medium">
                      {selectedStore.store.drive_link ? (
                        <a
                          href={selectedStore.store.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
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
                <h4 className="font-semibold text-foreground border-b border-border pb-2">Dados das Contas</h4>
                {selectedStore.accounts
                  .filter((a) => a.enabled)
                  .map((account) => (
                    <div key={account.account_type} className="p-3 bg-secondary/50 rounded-lg">
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

              {/* Texto Gerado */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground border-b border-border pb-2">Texto Gerado</h4>
                <Textarea
                  value={generateRawText(selectedStore)}
                  readOnly
                  className="h-48 bg-secondary border-input text-foreground text-xs font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleCopyRaw} className="bg-primary hover:bg-primary/90">
              <Copy className="h-4 w-4 mr-2" />
              {copySuccess ? "Copiado!" : "Copiar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Loja</DialogTitle>
            <DialogDescription>Edite as informações da loja</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nome da Loja</Label>
              <Input
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="bg-secondary border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Número da Loja</Label>
              <Input
                value={editFormData.store_number || ""}
                onChange={(e) => setEditFormData({ ...editFormData, store_number: e.target.value })}
                className="bg-secondary border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Link do Drive</Label>
              <Input
                value={editFormData.drive_link || ""}
                onChange={(e) => setEditFormData({ ...editFormData, drive_link: e.target.value })}
                className="bg-secondary border-input text-foreground"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isPending} className="bg-primary hover:bg-primary/90">
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
