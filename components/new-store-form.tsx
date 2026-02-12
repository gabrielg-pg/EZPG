"use client"

import { useState, useTransition, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Store,
  User,
  CreditCard,
  Settings,
  Globe,
  MapPin,
  Loader2,
  TrendingUp,
  Brain,
  Rocket,
  Zap,
  Upload,
  X,
  FileImage,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createStore } from "@/app/actions/store-actions"

const steps = [
  { id: 1, name: "Loja", icon: Store },
  { id: 2, name: "Cliente", icon: User },
  { id: 3, name: "Plano", icon: CreditCard },
  { id: 4, name: "Contas", icon: Settings },
]

const plans = [
  { id: "Start Growth", name: "Start Growth", icon: TrendingUp, color: "text-emerald-500" },
  { id: "Pro Vértebra", name: "Pro Vértebra", icon: Brain, color: "text-purple-500" },
  { id: "Scale Vértebra", name: "Scale Vértebra", icon: Rocket, color: "text-blue-500" },
  { id: "Scale Global", name: "Scale Global", icon: Zap, color: "text-orange-500" },
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

interface FormData {
  storeName: string
  storeNumber: string
  region: "brasil" | "global"
  customerName: string
  birthDate: string
  cpf: string
  address: string
  addressNumber: string
  cep: string
  plan: string
  driveLink: string
  niche: string
  numProducts: string
  country: string
  language: string
  accounts: Record<string, { login: string; password: string; enabled: boolean }>
}

function getAccountsForPlan(plan: string) {
  if (plan === "Scale Global") {
    return accountsGlobalPlan
  }
  return accountsBRPlans
}

function initializeAccounts(plan: string) {
  const accounts = getAccountsForPlan(plan)
  return accounts.reduce(
    (acc, account) => ({
      ...acc,
      [account.id]: { login: "", password: "", enabled: false },
    }),
    {},
  )
}

function validateStep(step: number, formData: FormData): string | null {
  if (step === 1) {
    if (!formData.storeName.trim()) return "Nome da loja é obrigatório"
    if (!formData.storeNumber.trim()) return "Número da loja é obrigatório"
  }
  if (step === 2) {
    if (!formData.customerName.trim()) return "Nome do cliente é obrigatório"
    if (!formData.birthDate) return "Data de nascimento é obrigatória"
    if (!formData.cpf.trim()) return "CPF é obrigatório"
    if (!formData.address.trim()) return "Endereço é obrigatório"
    if (!formData.cep.trim()) return "CEP é obrigatório"
  }
  if (step === 3) {
    if (!formData.plan) return "Selecione um plano"
    if (!formData.numProducts.trim()) return "Número de produtos é obrigatório"
    if (!formData.niche.trim()) return "Nicho da loja é obrigatório"
    if (formData.region === "global") {
      if (!formData.country.trim()) return "País é obrigatório para lojas globais"
      if (!formData.language.trim()) return "Idioma é obrigatório para lojas globais"
    }
  }
  if (step === 4) {
    const accounts = getAccountsForPlan(formData.plan)
    const enabledAccounts = accounts.filter((acc) => formData.accounts[acc.id]?.enabled)
    if (enabledAccounts.length === 0) return "Ative pelo menos uma conta"
    for (const acc of enabledAccounts) {
      const data = formData.accounts[acc.id]
      if (!data.login.trim() || !data.password.trim()) {
        return `Preencha login e senha para ${acc.name}`
      }
    }
  }
  return null
}

function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

function formatCEP(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
}

function formatDateInputBR(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
}

function parseDateBRToISO(dateBR: string) {
  const parts = dateBR.split("/")
  if (parts.length !== 3) return ""
  const [day, month, year] = parts
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return ""
  return `${year}-${month}-${day}`
}

export function NewStoreForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<FormData>({
    storeName: "",
    storeNumber: "",
    region: "brasil",
    customerName: "",
    birthDate: "",
    cpf: "",
    address: "",
    addressNumber: "",
    cep: "",
    plan: "",
    driveLink: "",
    niche: "",
    numProducts: "",
    country: "",
    language: "",
    accounts: initializeAccounts(""),
  })
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadAvailable, setUploadAvailable] = useState(true)

  // Check if upload is available on mount
  useEffect(() => {
    fetch("/api/upload/check").then(res => {
      if (!res.ok) setUploadAvailable(false)
    }).catch(() => setUploadAvailable(false))
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif",
      "application/pdf", "application/zip", "application/x-zip-compressed",
    ]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Tipo de arquivo não permitido. Use imagens, PDF ou ZIP.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Arquivo muito grande. Máximo: 10MB")
      return
    }

    setIsUploading(true)
    setUploadError(null)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      const response = await fetch("/api/upload", { method: "POST", body: formDataUpload })
      const result = await response.json()
      if (!response.ok) {
        setUploadError(result.error || "Erro ao fazer upload")
        return
      }
      setUploadedFile({ url: result.url, name: result.filename, size: result.size })
    } catch {
      setUploadError("Erro ao fazer upload do arquivo")
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const currentAccounts = getAccountsForPlan(formData.plan)

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => {
      if (field === "region") {
        const regionValue = value as "brasil" | "global"
        return {
          ...prev,
          region: regionValue,
          country: regionValue === "brasil" ? "" : prev.country,
          language: regionValue === "brasil" ? "" : prev.language,
        }
      }
      if (field === "plan") {
        return {
          ...prev,
          plan: value as string,
          accounts: initializeAccounts(value as string),
        }
      }
      return { ...prev, [field]: value }
    })
  }

  const updateAccountData = (accountId: string, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [accountId]: {
          ...prev.accounts[accountId],
          [field]: value,
        },
      },
    }))
  }

  const nextStep = () => {
    const validationError = validateStep(currentStep, formData)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setError(null)
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = () => {
    const validationError = validateStep(currentStep, formData)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    startTransition(async () => {
      const dataToSave = {
        ...formData,
        birthDate: parseDateBRToISO(formData.birthDate),
        numProducts: parseInt(formData.numProducts) || 0,
        logoReferencesUrl: uploadedFile?.url || undefined,
      }
      const result = await createStore(dataToSave)
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Erro ao criar loja")
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Nova Loja</h2>
        <p className="text-muted-foreground">Preencha as informações para cadastrar uma nova loja</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  currentStep > step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-primary text-primary bg-transparent"
                      : "border-muted text-muted-foreground bg-transparent",
                )}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("h-0.5 w-12 sm:w-24 mx-2", currentStep > step.id ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{steps[currentStep - 1].name}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {currentStep === 1 && "Informações básicas da loja"}
            {currentStep === 2 && "Dados do cliente responsável"}
            {currentStep === 3 && "Selecione o plano e configure detalhes"}
            {currentStep === 4 && "Configure as contas de integração"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Store Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-foreground">
                    Nome da Loja *
                  </Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    onChange={(e) => updateFormData("storeName", e.target.value)}
                    placeholder="Digite o nome da loja"
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeNumber" className="text-foreground">
                    Número da Loja *
                  </Label>
                  <Input
                    id="storeNumber"
                    value={formData.storeNumber}
                    onChange={(e) => updateFormData("storeNumber", e.target.value)}
                    placeholder="Ex: 001"
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driveLink" className="text-foreground">
                  Link do Drive
                </Label>
                <Input
                  id="driveLink"
                  value={formData.driveLink}
                  onChange={(e) => updateFormData("driveLink", e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Logo References Upload */}
              {uploadAvailable && (
                <div className="space-y-2">
                  <Label className="text-foreground">Referências de Logo</Label>
                  {uploadedFile ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                      <FileImage className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                        isDragging
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/50 hover:bg-secondary/80",
                      )}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Enviando...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm text-foreground font-medium">
                              Arraste um arquivo ou clique para selecionar
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Imagens, PDF ou ZIP (max. 10MB)
                            </p>
                          </div>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                      />
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-xs text-destructive mt-1">{uploadError}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-foreground">Região *</Label>
                <RadioGroup
                  value={formData.region}
                  onValueChange={(value) => updateFormData("region", value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="brasil"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      formData.region === "brasil"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="brasil" id="brasil" className="border-input" />
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">Brasil</span>
                  </Label>
                  <Label
                    htmlFor="global"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                      formData.region === "global"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="global" id="global" className="border-input" />
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">Global</span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Country and Language for Global region */}
              {formData.region === "global" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-foreground">
                      País *
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => updateFormData("country", e.target.value)}
                      placeholder="Ex: Estados Unidos"
                      className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-foreground">
                      Idioma *
                    </Label>
                    <Input
                      id="language"
                      value={formData.language}
                      onChange={(e) => updateFormData("language", e.target.value)}
                      placeholder="Ex: Inglês"
                      className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customer Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-foreground">
                  Nome Completo *
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => updateFormData("customerName", e.target.value)}
                  placeholder="Nome do cliente"
                  className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-foreground">
                    Data de Nascimento *
                  </Label>
                  <Input
                    id="birthDate"
                    type="text"
                    value={formData.birthDate}
                    onChange={(e) => updateFormData("birthDate", formatDateInputBR(e.target.value))}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-foreground">
                    CPF *
                  </Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => updateFormData("cpf", formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">
                  Endereço *
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Rua, Avenida..."
                  className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressNumber" className="text-foreground">
                    Número
                  </Label>
                  <Input
                    id="addressNumber"
                    value={formData.addressNumber}
                    onChange={(e) => updateFormData("addressNumber", e.target.value)}
                    placeholder="Número"
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-foreground">
                    CEP *
                  </Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => updateFormData("cep", formatCEP(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection + Niche + Products */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-foreground font-medium">Selecione o Plano *</Label>
                <RadioGroup
                  value={formData.plan}
                  onValueChange={(value) => updateFormData("plan", value)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {plans.map((plan) => {
                    const IconComponent = plan.icon
                    return (
                      <Label
                        key={plan.id}
                        htmlFor={plan.id}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                          formData.plan === plan.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-primary/50",
                        )}
                      >
                        <RadioGroupItem value={plan.id} id={plan.id} className="border-input" />
                        <IconComponent className={cn("h-5 w-5", plan.color)} />
                        <span className="text-foreground font-medium">{plan.name}</span>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numProducts" className="text-foreground">
                    Número de Produtos *
                  </Label>
                  <Input
                    id="numProducts"
                    type="number"
                    min="1"
                    value={formData.numProducts}
                    onChange={(e) => updateFormData("numProducts", e.target.value)}
                    placeholder="Ex: 30"
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niche" className="text-foreground">
                    Nicho da Loja *
                  </Label>
                  <Input
                    id="niche"
                    value={formData.niche}
                    onChange={(e) => updateFormData("niche", e.target.value)}
                    placeholder="Ex: Moda, Eletrônicos..."
                    className="bg-secondary border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Account Checklist based on selected plan */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {!formData.plan && (
                <p className="text-muted-foreground text-sm">Volte ao passo anterior e selecione um plano.</p>
              )}
              {currentAccounts.map((account) => (
                <Card
                  key={account.id}
                  className={cn(
                    "border transition-colors",
                    formData.accounts[account.id]?.enabled
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary",
                  )}
                >
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`${account.id}-enabled`}
                        checked={formData.accounts[account.id]?.enabled || false}
                        onCheckedChange={(checked) => updateAccountData(account.id, "enabled", checked)}
                        className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label htmlFor={`${account.id}-enabled`} className="text-foreground font-medium cursor-pointer">
                        {account.name}
                      </Label>
                    </div>

                    {formData.accounts[account.id]?.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                        <div className="space-y-2">
                          <Label htmlFor={`${account.id}-login`} className="text-foreground text-sm">
                            Login *
                          </Label>
                          <Input
                            id={`${account.id}-login`}
                            value={formData.accounts[account.id]?.login || ""}
                            onChange={(e) => updateAccountData(account.id, "login", e.target.value)}
                            placeholder="Email ou usuário"
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${account.id}-password`} className="text-foreground text-sm">
                            Senha *
                          </Label>
                          <Input
                            id={`${account.id}-password`}
                            type="password"
                            value={formData.accounts[account.id]?.password || ""}
                            onChange={(e) => updateAccountData(account.id, "password", e.target.value)}
                            placeholder="Senha da conta"
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-input text-foreground hover:bg-secondary bg-transparent"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>

            {currentStep < 4 ? (
              <Button onClick={nextStep} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Finalizar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
