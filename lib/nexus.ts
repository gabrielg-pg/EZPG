// Tipos e metadados compartilhados do Nexus Growth (client-safe: sem imports de servidor)

export type NexusStatus =
  | "ideia"
  | "planejado"
  | "em_producao"
  | "aguardando_aprovacao"
  | "aprovado"
  | "agendado"
  | "publicado"

export type NexusPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "stories"
  | "outra"

export type NexusContentType =
  | "reel"
  | "story"
  | "carrossel"
  | "post"
  | "video"
  | "short"
  | "live"
  | "anuncio"
  | "outro"

export type NexusPillar =
  | "educacional"
  | "autoridade"
  | "prova_social"
  | "bastidores"
  | "oferta"
  | "institucional"
  | "engajamento"
  | "outro"

export type NexusContent = {
  id: number
  title: string
  date: string // YYYY-MM-DD
  publication_time: string | null // HH:MM
  platforms: NexusPlatform[]
  content_type: NexusContentType | null
  status: NexusStatus
  responsible_user_id: number | null
  responsible_name: string | null
  pillar: NexusPillar | null
  objective: string
  briefing: string
  caption: string
  cta: string
  references: string
  material_url: string
  notes: string
  revision_note: string
  sort_order: number
  created_by: number | null
  created_at: string
  updated_at: string
}

export type NexusCredential = {
  id: number
  platform_name: string
  platform_url: string
  username: string
  notes: string
  // A senha NUNCA vem por padrão; só é revelada sob demanda por quem tem permissão.
  can_reveal: boolean
  can_edit: boolean
  authorized_user_ids: number[]
  created_by: number | null
  created_at: string
  updated_at: string
}

// ---- Metadados visuais (badges) ----

export const STATUS_META: Record<
  NexusStatus,
  { label: string; badge: string; dot: string }
> = {
  ideia: {
    label: "Ideia",
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  planejado: {
    label: "Planejado",
    badge: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
  em_producao: {
    label: "Em produção",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
  },
  aguardando_aprovacao: {
    label: "Aguardando aprovação",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  aprovado: {
    label: "Aprovado",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
  },
  agendado: {
    label: "Agendado",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    dot: "bg-cyan-400",
  },
  publicado: {
    label: "Publicado",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
}

export const STATUS_ORDER: NexusStatus[] = [
  "ideia",
  "planejado",
  "em_producao",
  "aguardando_aprovacao",
  "aprovado",
  "agendado",
  "publicado",
]

export const PLATFORM_META: Record<NexusPlatform, { label: string; badge: string }> = {
  instagram: { label: "Instagram", badge: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  facebook: { label: "Facebook", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  tiktok: { label: "TikTok", badge: "bg-foreground/10 text-foreground border-border" },
  youtube: { label: "YouTube", badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  linkedin: { label: "LinkedIn", badge: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  stories: { label: "Stories", badge: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  outra: { label: "Outra", badge: "bg-muted text-muted-foreground border-border" },
}

export const CONTENT_TYPE_META: Record<NexusContentType, string> = {
  reel: "Reel",
  story: "Story",
  carrossel: "Carrossel",
  post: "Post",
  video: "Vídeo",
  short: "Short",
  live: "Live",
  anuncio: "Anúncio",
  outro: "Outro",
}

export const PILLAR_META: Record<NexusPillar, string> = {
  educacional: "Educacional",
  autoridade: "Autoridade",
  prova_social: "Prova Social",
  bastidores: "Bastidores",
  oferta: "Oferta",
  institucional: "Institucional",
  engajamento: "Engajamento",
  outro: "Outro",
}

export const MONTHS_SHORT = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
]

export const MONTHS_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export const WEEKDAYS_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]

export const WEEKDAYS_LONG = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
]

// Um conteúdo está atrasado se a data já passou e o status não é "publicado".
export function isLate(dateStr: string, status: NexusStatus): boolean {
  if (status === "publicado") return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return false
  const contentDate = new Date(y, m - 1, d)
  return contentDate.getTime() < today.getTime()
}

// Monta a grade do mês iniciando na segunda-feira (padrão calendário PT-BR).
export function buildMonthGrid(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1)
  // getDay(): 0=Dom..6=Sáb → converte para 0=Seg..6=Dom
  const jsDow = firstDay.getDay()
  const leadingBlanks = (jsDow + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<Date | null> = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // completa a última semana
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
