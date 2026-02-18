"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, Users, Shield, UserCheck, Loader2, Briefcase, KeyRound, Mail, UserCog, Rocket, ArrowRightLeft } from "lucide-react"
import { createUserAction } from "@/app/actions/auth-actions"
import { updateUser, deleteUser } from "@/app/actions/user-actions"
import { cn } from "@/lib/utils"

type RoleType = "admin" | "comercial" | "manager" | "user" | "zona_execucao"

interface User {
  id: number
  name: string
  username: string
  email: string
  role: RoleType
  roles: RoleType[]
  status: "ativo" | "inativo"
  created_at: string
}

const roleConfig = {
  admin: { label: "Admin", color: "bg-red-500/15 text-red-400 border-red-500/25", icon: Shield, description: "Acesso total ao sistema" },
  comercial: { label: "Comercial", color: "bg-blue-500/15 text-blue-400 border-blue-500/25", icon: Briefcase, description: "Gerencia reunioes e leads" },
  manager: { label: "Gerente", color: "bg-primary/15 text-primary border-primary/25", icon: UserCog, description: "Gerencia equipe e lojas" },
  user: { label: "Usuario", color: "bg-muted text-muted-foreground border-border", icon: Users, description: "Acesso basico ao sistema" },
  zona_execucao: { label: "Zona de Execucao", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", icon: Rocket, description: "Dashboard, lojas e zona de execucao" },
}

export function AdminUserManagement({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [transferToUserId, setTransferToUserId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    roles: ["user"] as RoleType[],
    status: "ativo" as User["status"],
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const resetForm = () => {
    setFormData({ name: "", username: "", email: "", password: "", roles: ["user"], status: "ativo" })
    setError(null)
  }
  
  const toggleRole = (role: RoleType) => {
    setFormData(prev => {
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
      // Ensure at least one role is selected
      return { ...prev, roles: newRoles.length > 0 ? newRoles : ["user"] }
    })
  }

  const handleCreate = () => {
    setError(null)
    startTransition(async () => {
      const result = await createUserAction({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.roles,
      })

      if (result.success) {
        window.location.reload()
      } else {
        setError(result.error || "Erro ao criar usuário")
      }
    })
  }

  const handleEdit = () => {
    if (!selectedUser) return
    setError(null)

    startTransition(async () => {
      const result = await updateUser(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        roles: formData.roles,
        status: formData.status,
      })

      if (result.success) {
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id
              ? { ...user, name: formData.name, email: formData.email, role: formData.roles[0] as RoleType, roles: formData.roles, status: formData.status }
              : user,
          ),
        )
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        resetForm()
      } else {
        setError(result.error || "Erro ao atualizar usuário")
      }
    })
  }

  const handleDelete = () => {
    if (!selectedUser) return
    if (!transferToUserId) {
      setError("Selecione um usuario para transferir os dados")
      return
    }

    startTransition(async () => {
      const result = await deleteUser(selectedUser.id, parseInt(transferToUserId))

      if (result.success) {
        setUsers(users.filter((user) => user.id !== selectedUser.id))
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        setTransferToUserId("")
      } else {
        setError(result.error || "Erro ao excluir usuário")
      }
    })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      roles: user.roles || [user.role],
      status: user.status,
    })
    setError(null)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setTransferToUserId("")
    setError(null)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Usuarios</h2>
          <p className="text-muted-foreground">Controle de acessos e permissoes do sistema</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsCreateDialogOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl h-11 px-5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total de Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center border border-red-500/20">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{users.filter((u) => u.roles?.includes("admin") || u.role === "admin").length}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center border border-blue-500/20">
                <Briefcase className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {users.filter((u) => u.roles?.includes("comercial") || u.role === "comercial").length}
                </p>
                <p className="text-sm text-muted-foreground">Comerciais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center border border-green-500/20">
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{users.filter((u) => u.status === "ativo").length}</p>
                <p className="text-sm text-muted-foreground">Usuarios Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-foreground text-lg">Lista de Usuarios</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gerencie permissoes e acessos dos usuarios
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground w-full sm:w-72 h-10 rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-muted-foreground font-semibold">Usuario</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Acessos</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Cadastro</TableHead>
                  <TableHead className="text-muted-foreground font-semibold text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhum usuario encontrado</p>
                      <p className="text-sm">Tente ajustar sua busca</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(user.roles || [user.role]).map((role) => {
                            const config = roleConfig[role] || roleConfig.user
                            const IconComponent = config.icon
                            return (
                              <Badge key={role} variant="outline" className={cn("gap-1", config.color)}>
                                <IconComponent className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5",
                            user.status === "ativo"
                              ? "bg-green-500/15 text-green-400 border-green-500/25"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            user.status === "ativo" ? "bg-green-400" : "bg-muted-foreground"
                          )} />
                          {user.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5 h-8"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editar Acesso</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Criar Novo Usuario
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os dados para criar um novo usuario no sistema
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-foreground font-medium">
                  Nome Completo
                </Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Joao Silva"
                  className="bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-username" className="text-foreground font-medium">
                  Usuario (login)
                </Label>
                <Input
                  id="create-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: joao.silva"
                  className="bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password" className="text-foreground font-medium">
                  Senha
                </Label>
                <Input
                  id="create-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha segura"
                  className="bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Niveis de Acesso
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(roleConfig) as [RoleType, typeof roleConfig.admin][]).map(([role, config]) => {
                  const IconComponent = config.icon
                  const isSelected = formData.roles.includes(role)
                  return (
                    <div 
                      key={role} 
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                        isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      <Checkbox
                        id={`create-role-${role}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleRole(role)}
                        className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isSelected ? "bg-primary/20" : "bg-muted")}>
                        <IconComponent className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor={`create-role-${role}`}
                          className="text-sm text-foreground cursor-pointer font-medium"
                        >
                          {config.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-border text-foreground hover:bg-secondary rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              Editar Acesso do Usuario
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Atualize as informacoes e permissoes de acesso de <span className="text-foreground font-medium">{selectedUser?.name}</span>
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-foreground font-medium">
                  Nome
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary/50 border-input text-foreground h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-secondary/50 border-input text-foreground h-10 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Niveis de Acesso
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(roleConfig) as [RoleType, typeof roleConfig.admin][]).map(([role, config]) => {
                  const IconComponent = config.icon
                  const isSelected = formData.roles.includes(role)
                  return (
                    <div 
                      key={role} 
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                        isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      <Checkbox
                        id={`edit-role-${role}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleRole(role)}
                        className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isSelected ? "bg-primary/20" : "bg-muted")}>
                        <IconComponent className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor={`edit-role-${role}`}
                          className="text-sm text-foreground cursor-pointer font-medium"
                        >
                          {config.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-foreground font-medium">
                Status da Conta
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as User["status"] })}
              >
                <SelectTrigger className="bg-secondary/50 border-input text-foreground h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  <SelectItem value="ativo" className="text-popover-foreground rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="inativo" className="text-popover-foreground rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      Inativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-border text-foreground hover:bg-secondary rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alteracoes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Excluir Usuario
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o usuario <span className="text-foreground font-medium">{selectedUser?.name}</span>? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Transferir dados para</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Todas as lojas, reunioes e demais registros de <span className="text-foreground font-medium">{selectedUser?.name}</span> serao transferidos para o usuario selecionado.
              </p>
              <Select value={transferToUserId} onValueChange={setTransferToUserId}>
                <SelectTrigger className="bg-secondary/50 border-input text-foreground h-10 rounded-xl">
                  <SelectValue placeholder="Selecione um usuario..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {users
                    .filter((u) => selectedUser && u.id !== selectedUser.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={String(u.id)} className="text-popover-foreground rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.name}</span>
                          <span className="text-xs text-muted-foreground">({u.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-border text-foreground hover:bg-secondary rounded-xl"
            >
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={isPending || !transferToUserId} variant="destructive" className="rounded-xl">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir e Transferir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
