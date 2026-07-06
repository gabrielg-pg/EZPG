import {
  FileText,
  Palette,
  Camera,
  Handshake,
  ClipboardList,
  Target,
  FileSignature,
  ExternalLink,
  type LucideIcon,
} from "lucide-react"

interface KnowledgeItem {
  title: string
  subtitle: string
  description: string
  href: string
  icon: LucideIcon
  accent: string
  iconBg: string
  iconText: string
}

const items: KnowledgeItem[] = [
  {
    title: "Documentos Empresa",
    subtitle: "Base interna de documentos institucionais",
    description:
      "Documentos oficiais e institucionais da AEESJB: contratos, estatutos e arquivos administrativos. Centraliza informações e facilita o acesso de colaboradores e diretoria.",
    href: "https://drive.google.com/drive/folders/1K7kuTF55FiYnUWDbgNWU6-74-ziLLf44?hl=pt_BR",
    icon: FileText,
    accent: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
  },
  {
    title: "Material de Branding",
    subtitle: "Identidade visual da AEESJB",
    description:
      "Repositório dos materiais de branding: logotipos, cores institucionais, fontes e templates. Cada material segue a identidade visual validada, garantindo consistência em todas as aplicações.",
    href: "https://drive.google.com/drive/folders/1mX_NFzHBgW_dsbGWh0w2xR2_6MlGi0r-?hl=pt_BR",
    icon: Palette,
    accent: "bg-pink-500",
    iconBg: "bg-pink-500/15",
    iconText: "text-pink-400",
  },
  {
    title: "Fotos Campeonatos",
    subtitle: "Registro visual dos eventos",
    description:
      "Fotos capturadas durante os campeonatos e eventos da AEESJB. Registros de jogos, premiações e bastidores, organizados por edição e categoria.",
    href: "https://drive.google.com/drive/folders/1YK_CRjUOiWZgWfzn36x1cGru3KNnt_N_?hl=pt_BR",
    icon: Camera,
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
  },
  {
    title: "Logotipo Patrocinadores",
    subtitle: "Marcas parceiras validadas",
    description:
      "Estrutura organizada por patrocinador, com os logotipos oficiais e materiais de identidade das marcas parceiras da AEESJB, reduzindo risco de uso incorreto e padronizando aplicações.",
    href: "https://drive.google.com/drive/folders/1qtXTWxwsadO-JunNQWSQe6uSfPYfQB2d?hl=pt_BR",
    icon: Handshake,
    accent: "bg-orange-500",
    iconBg: "bg-orange-500/15",
    iconText: "text-orange-400",
  },
  {
    title: "Regulamentos Campeonatos",
    subtitle: "Normas técnicas oficiais",
    description:
      "Regulamentos oficiais utilizados nos campeonatos da AEESJB. Consulta de regras, critérios de disputa e normas técnicas sem depender de reenvio manual.",
    href: "https://drive.google.com/drive/folders/1o1dD2AA0dYBb_8F6wmkMIMbCmM9dSwo-?hl=pt_BR",
    icon: ClipboardList,
    accent: "bg-red-500",
    iconBg: "bg-red-500/15",
    iconText: "text-red-400",
  },
  {
    title: "Criativos",
    subtitle: "Criativos para tráfego pago",
    description:
      "Criação, armazenamento e organização dos criativos usados nas campanhas. Criativos validados, variações por nicho, estruturas em escala e base histórica de anúncios para análise.",
    href: "https://drive.google.com/drive/folders/1Av3OI-jDe0jUKfSNRH2iV1zqqzTiBC_f?hl=pt_BR",
    icon: Target,
    accent: "bg-indigo-500",
    iconBg: "bg-indigo-500/15",
    iconText: "text-indigo-400",
  },
  {
    title: "Inscrições Campeonatos",
    subtitle: "Cadastros e formulários de participação",
    description:
      "Inscrições dos campeonatos da AEESJB. Formulários, listas de participantes e documentos de cadastro necessários para cada edição do evento.",
    href: "https://drive.google.com/drive/folders/1a0Dzda-3Jl6yt0xlgYl-uEn2EKZjlzG3?hl=pt_BR",
    icon: FileSignature,
    accent: "bg-yellow-500",
    iconBg: "bg-yellow-500/15",
    iconText: "text-yellow-400",
  },
]

export function KnowledgeBase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Central de acesso aos repositórios e materiais oficiais da AEESJB.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-border/80 hover:shadow-xl hover:shadow-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${item.accent}`} aria-hidden="true" />

              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg}`}>
                <Icon className={`h-6 w-6 ${item.iconText}`} aria-hidden="true" />
              </div>

              <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-foreground text-balance">
                {item.title}
              </h2>
              <p className={`mt-1 text-[13px] font-semibold ${item.iconText}`}>{item.subtitle}</p>
              <p className="mt-3 flex-grow text-sm leading-relaxed text-muted-foreground text-pretty">
                {item.description}
              </p>

              <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-colors group-hover:bg-secondary/80">
                Acessar
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
