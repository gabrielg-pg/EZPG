"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pickaxe,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ListChecks,
  Puzzle,
  Code2,
  Search,
  ShoppingBag,
  Mail,
  Image as ImageIcon,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Credential = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  login: string
  password: string
  site?: string
}

const credentials: Credential[] = [
  { name: "Gmail", icon: Mail, login: "suporteprogrowth@gmail.com", password: "#Eusouprogrowth2030" },
  { name: "Zona de Execução", icon: Pickaxe, login: "karolsantosangeli266@gmail.com", password: "#PG2026" },
  { name: "Shopify", icon: ShoppingBag, login: "hello@progrowthglobal.com", password: "#Eusoupg2026" },
  { name: "Poky", icon: ImageIcon, login: "suporteprogrowth@gmail.com", password: "@MineracaoProGrowth2030#" },
  {
    name: "E-mail Pro Growth",
    icon: Mail,
    login: "hello@progrowthglobal.com",
    password: "@PinterestProGrowth2030#",
    site: "https://mail.hostinger.com/old/?_task=mail&_mbox=INBOX",
  },
  {
    name: "Magnific — Imagens",
    icon: ImageIcon,
    login: "suporteprogrowth@gmail.com",
    password: "#Eusoufoda76",
    site: "https://www.magnific.com",
  },
]

const steps: { title: string; description: string }[] = [
  {
    title: "Filtre lojas com tráfego relevante",
    description:
      "Apenas lojas com 10 mil visitas ou mais. Lojas abaixo de 10 mil visitas ainda não vendem bem. Verifique no Similarweb.",
  },
  {
    title: "Encontre os produtos mais vendidos",
    description:
      "Ao achar uma loja vencedora, use o código collections/all?sort_by=best-selling e veja os TOP 6 produtos. Os 3 ou 4 primeiros são os que mais vendem — priorize sempre da esquerda para a direita.",
  },
  {
    title: "Baixe os criativos do concorrente",
    description:
      "Abra a extensão Ad Cloud Library, cole a URL da loja e veja os criativos em veiculação. Baixe todos, priorizando os vídeos do produto com maior conversão.",
  },
  {
    title: "Importe o produto para a Shopify",
    description:
      "Importe o produto para a Shopify da Pro Growth Global. Se precisar editar algo, edite e exporte — o arquivo vai direto para o e-mail. Baixe e insira na loja que está minerando o produto.",
  },
  {
    title: "Produza os criativos complementares",
    description:
      "Cada produto minerado precisa de no mínimo 7 vídeos e 3 imagens em versão collage (feed e stories) criadas na plataforma Magnific.",
  },
  {
    title: "Limpe os metadados",
    description: "Após baixar os vídeos do concorrente, faça a limpeza de metadados de todos os arquivos.",
  },
  {
    title: "Ajuste o formato dos criativos",
    description:
      "Após a limpeza, ajuste o tamanho dos criativos no CapCut para o formato 9:16, de acordo com as posições solicitadas do Facebook.",
  },
  {
    title: "Organize dentro da pasta do cliente",
    description:
      "Crie uma pasta com o nome exato do título do produto e nomeie os criativos em sequência: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10.",
  },
  {
    title: "Registre e comunique a conclusão",
    description:
      "Marque na Zona de Execução os criativos realizados do cliente. Ao finalizar todos, avise a Karol no grupo de WhatsApp para que ela suba as estruturas durante o dia.",
  },
]

const extensions: { name: string; url: string }[] = [
  {
    name: "Similarweb — Website Traffic",
    url: "https://chromewebstore.google.com/detail/similarweb-website-traffi/hoklmmgfnpapgjgcpechhaamimifchmp",
  },
  {
    name: "Ad Cloud Library",
    url: "https://chromewebstore.google.com/detail/ad-library-cloud/mmehdbhpbgoegockemckbpjeoflflobc?hl=pt",
  },
  {
    name: "PPSPY — Shopify Analytics",
    url: "https://chromewebstore.google.com/detail/ppspy-1-shopify-analytics/lppbajkahdbbadheilijoeegnfndhlab?hl=pt_BR",
  },
]

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignora falha de clipboard
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={`Copiar ${label}`}
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

function CredentialField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const display = secret && !revealed ? "•".repeat(Math.min(value.length, 16)) : value

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-2">
        <span className={cn("flex-1 truncate text-sm text-foreground", secret && "font-mono tracking-wide")}>
          {display}
        </span>
        {secret && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        )}
        <CopyButton value={value} label={label} />
      </div>
    </div>
  )
}

export function MineracaoPanel() {
  const bestSellingCode = "collections/all?sort_by=best-selling"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
          <Pickaxe className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground text-balance">Mineração de Produtos</h2>
          <p className="text-muted-foreground text-pretty">
            Central de acessos, extensões e o passo a passo oficial de mineração da Pro Growth Global.
          </p>
        </div>
      </div>

      {/* Acessos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Acessos</h3>
          <Badge variant="outline" className="ml-1 border-teal-500/25 bg-teal-500/15 text-teal-400">
            {credentials.length} plataformas
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {credentials.map((cred) => {
            const Icon = cred.icon
            return (
              <Card key={cred.name} className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {cred.name}
                    </CardTitle>
                    {cred.site && (
                      <a
                        href={cred.site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Abrir
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CredentialField label="Login" value={cred.login} />
                  <CredentialField label="Senha" value={cred.password} secret />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Estrutura de Mineração */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Estrutura de Mineração de Produtos</h3>
        </div>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <ol className="space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary ring-1 ring-primary/25">
                    {index + 1}
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Ferramentas & códigos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Extensões */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Extensões</h3>
          </div>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="space-y-2 p-4">
              {extensions.map((ext) => (
                <a
                  key={ext.name}
                  href={ext.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <Puzzle className="h-4 w-4 text-primary" />
                    {ext.name}
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Códigos úteis */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Códigos úteis</h3>
          </div>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Search className="h-4 w-4 text-primary" />
                  Produtos mais vendidos da loja concorrente
                </p>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                  <code className="flex-1 truncate font-mono text-sm text-teal-400">{bestSellingCode}</code>
                  <CopyButton value={bestSellingCode} label="código" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Adicione ao final da URL da loja para listar os produtos por mais vendidos.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-teal-500/20 bg-teal-500/5 px-4 py-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Lembre-se: minere apenas lojas com <span className="font-semibold text-foreground">10 mil visitas
                  ou mais</span> (confira no Similarweb) e priorize os primeiros produtos da esquerda para a direita.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
