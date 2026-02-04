"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BookOpen, 
  Palette, 
  MessageSquareText, 
  Search, 
  Code, 
  Target,
  ExternalLink
} from "lucide-react"

const resources = [
  {
    id: "tutoriais",
    title: "PG | TUTORIAIS",
    subtitle: "Base interna de conhecimento operacional",
    description: "Aqui ficam tutoriais práticos criados conforme demandas reais da operação. Esse banco serve para padronizar processos e acelerar a execução, além de facilitar o onboarding de novos colaboradores dentro da Pro Growth.",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/20",
    link: "https://drive.google.com/drive/u/0/folders/1u9mhu7Ud42Puo7uYPnUQs_lbtndk3ewU"
  },
  {
    id: "temas",
    title: "PG | TEMAS",
    subtitle: "Estruturas dos planos Pro Growth",
    description: "Repositório dos temas utilizados nos planos da Pro Growth: START GROWTH, PRO VÉRTEBRA, SCALE VÉRTEBRA e SCALE GLOBAL. Cada tema segue a estrutura validada de cada plano, garantindo consistência, padrão e replicabilidade das operações.",
    icon: Palette,
    color: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/20",
    link: "https://drive.google.com/drive/u/0/folders/1FhdDr0GcgvmYMhdAiJibRYVP-HIc-x0s"
  },
  {
    id: "scripts",
    title: "PG | SCRIPTS",
    subtitle: "Comunicação operacional padronizada",
    description: "Zona dedicada aos scripts usados na execução diária da operação: boas-vindas em grupos, entrega de logotipo, logotipo aprovado/reprovado, entrega da loja. Comunicação com clientes em cada etapa do projeto. Tudo padronizado para manter clareza, profissionalismo e escala.",
    icon: MessageSquareText,
    color: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/20",
    link: "https://drive.google.com/drive/u/0/folders/1H9XDD8wprHUC55obITqJV0v-RH8htRZP"
  },
  {
    id: "mineracao",
    title: "PG | MINERAÇÃO DE PRODUTOS",
    subtitle: "Produtos e nichos já validados",
    description: "Estrutura em nuvem organizada por pastas, separadas por nichos validados. Aqui ficam processos, listas e materiais de mineração já testados, reduzindo risco e eliminando tentativas aleatórias.",
    icon: Search,
    color: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/20",
    link: "https://drive.google.com/drive/u/0/folders/1IamIrpizA3krNAkBlo33sKrSLM9VunMx"
  },
  {
    id: "codigos",
    title: "PG | CÓDIGOS HTML",
    subtitle: "Recursos técnicos para Shopify",
    description: "Repositório de códigos HTML úteis para implementação em lojas Shopify. Utilizado para otimizações, ajustes técnicos e melhorias de conversão sem depender de desenvolvimento externo.",
    icon: Code,
    color: "from-rose-500 to-red-500",
    shadowColor: "shadow-rose-500/20",
    link: "https://drive.google.com/drive/u/0/folders/1IUZnZoziM576OAq99_Xcppq1BrbbVD_K"
  },
  {
    id: "criativos",
    title: "PG | CRIATIVOS",
    subtitle: "Criação e organização de criativos para tráfego pago",
    description: "Área dedicada à criação, armazenamento e organização dos criativos utilizados nas campanhas. Criativos validados, variações por nicho, estruturas criativas usadas em escala e base histórica de anúncios para análise e melhoria de performance.",
    icon: Target,
    color: "from-indigo-500 to-violet-500",
    shadowColor: "shadow-indigo-500/20",
    link: "https://drive.google.com/drive/u/0/folders/1UaLtpLBsUkOQzKzglRFp6SXjSdBKc2-3"
  }
]

export function ExecutionZoneCards() {
  return (
    <div className="space-y-8">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <Card 
            key={resource.id}
            className={`group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-all duration-300 hover:shadow-xl ${resource.shadowColor}`}
          >
            {/* Gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${resource.color}`} />
            
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${resource.color}`} />
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center shadow-lg ${resource.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                  <resource.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-foreground mt-4 group-hover:text-primary transition-colors duration-300">
                {resource.title}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-primary/80">
                {resource.subtitle}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {resource.description}
              </p>
              
              <a 
                href={resource.link} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(resource.link, '_blank', 'noopener,noreferrer')
                }}
                className={`relative z-10 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white bg-gradient-to-r ${resource.color} hover:opacity-90 transition-all duration-300 shadow-lg ${resource.shadowColor} hover:shadow-xl cursor-pointer pointer-events-auto`}
              >
                <span>Acessar</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
