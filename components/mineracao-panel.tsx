"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Pickaxe, ExternalLink, ListChecks, Search, FolderOpen } from "lucide-react"
import { ClientStoresBlock } from "@/components/client-stores-block"
import { AccessCredentialsBlock } from "@/components/access-credentials-block"
import { MiningToolsBlocks } from "@/components/mining-tools-blocks"
import type { ClientStoreEntry } from "@/lib/client-stores"
import type { AccessCredential } from "@/app/actions/access-actions"
import type { MiningExtension, UsefulCode } from "@/app/actions/mining-tools-actions"

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

export function MineracaoPanel({
  initialClientStores = [],
  initialCredentials = [],
  initialExtensions = [],
  initialUsefulCodes = [],
}: {
  initialClientStores?: ClientStoreEntry[]
  initialCredentials?: AccessCredential[]
  initialExtensions?: MiningExtension[]
  initialUsefulCodes?: UsefulCode[]
}) {
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

      {/* Drive de Criativos - destaque */}
      <a
        href="https://drive.google.com/drive/folders/1UaLtpLBsUkOQzKzglRFp6SXjSdBKc2-3?hl=pt-br"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 to-primary/5 p-5 transition-colors hover:border-primary/50 hover:from-primary/20"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-base font-semibold text-foreground">Drive Criativos - Clientes</p>
            <p className="text-sm text-muted-foreground">Pasta compartilhada com todos os criativos dos clientes.</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform group-hover:scale-105">
          Abrir pasta
          <ExternalLink className="h-4 w-4" />
        </span>
      </a>

      {/* Acessos (contas dinâmicas: adicionar/editar/excluir) */}
      <AccessCredentialsBlock initialCredentials={initialCredentials} />

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

            <div className="mt-6 space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Search className="h-4 w-4" />
                Informação importante
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Caso ache poucos vídeos do concorrente, baixe todos os possíveis daquele produto e, em seguida, procure
                no <span className="font-semibold text-foreground">WinningHunter</span> outros players que estão rodando
                com criativos diferentes.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">PS:</span> os criativos precisam ter ângulos diferentes,
                não apenas o mesmo criativo com músicas diferentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Ferramentas & códigos (extensões e códigos úteis dinâmicos) */}
      <MiningToolsBlocks initialExtensions={initialExtensions} initialUsefulCodes={initialUsefulCodes} />

      {/* Lojas de nossos clientes */}
      <ClientStoresBlock initialStores={initialClientStores} />
    </div>
  )
}
