// Configuração do Funil Método VÉRTEBRA™ (16 telas)
// Cor primária: #6B21A8 (roxo)

export type VertebraAnswerKey =
  | "target_income"
  | "gender"
  | "employment_status"
  | "current_income"
  | "affirmation_1"
  | "affirmation_2"
  | "affirmation_3"
  | "available_time"
  | "main_blocker"
  | "income_use_case"

export type VertebraAnswers = Partial<Record<VertebraAnswerKey, string>>

export type VertebraOption = {
  value: string
  label: string
  emoji?: string
}

export type VertebraQuestion = {
  key: VertebraAnswerKey
  title: string
  subtitle?: string
  options: VertebraOption[]
}

// Perguntas com opções (telas de escolha). As telas informativas
// (5, 9, 13, 14, 15, contato e redirect) são tratadas no componente do funil.
export const VERTEBRA_QUESTIONS: Record<VertebraAnswerKey, VertebraQuestion> = {
  target_income: {
    key: "target_income",
    title: "Quanto VOCÊ QUER estar ganhando em 30 DIAS?",
    subtitle: "Escolha a meta que mais te representa hoje.",
    options: [
      { value: "2.5k_5k", label: "R$ 2.5k – 5k / dia" },
      { value: "5k_10k", label: "R$ 5k – 10k / dia" },
      { value: "10k_25k", label: "R$ 10k – 25k / dia" },
      { value: "acima_25k", label: "Acima de R$ 25k / dia" },
    ],
  },
  gender: {
    key: "gender",
    title: "Você é...",
    options: [
      { value: "homem", label: "Homem", emoji: "😊" },
      { value: "mulher", label: "Mulher", emoji: "💪" },
    ],
  },
  employment_status: {
    key: "employment_status",
    title: "Qual sua situação hoje...",
    options: [
      { value: "clt", label: "CLT", emoji: "📋" },
      { value: "empreendedor", label: "Empreendedor", emoji: "👨‍💼" },
      { value: "autonomo", label: "Autônomo / PJ", emoji: "📊" },
      { value: "estudante", label: "Estudante", emoji: "🎓" },
      { value: "nao_trabalho", label: "Não trabalho / estudo", emoji: "🏠" },
    ],
  },
  current_income: {
    key: "current_income",
    title: "Quanto você ganha por mês atualmente?",
    options: [
      { value: "sem_renda", label: "Sem renda no momento" },
      { value: "ate_2k", label: "Até R$ 2.000" },
      { value: "2k_5k", label: "R$ 2.000 – 5.000" },
      { value: "5k_10k", label: "R$ 5.000 – 10.000" },
      { value: "10k_20k", label: "R$ 10.000 – 20.000" },
      { value: "20k_30k", label: "R$ 20.000 – 30.000" },
      { value: "acima_30k", label: "Acima de R$ 30.000" },
    ],
  },
  affirmation_1: {
    key: "affirmation_1",
    title: "TRABALHO +8H/DIA E NÃO CONSIGO GUARDAR DINHEIRO",
    subtitle: "O quanto isso é a sua realidade?",
    options: [
      { value: "nao_sobra", label: "Não sobra nada", emoji: "😰" },
      { value: "ate_guardo", label: "Até guardo", emoji: "💵" },
      { value: "ta_rico", label: "Tá rico", emoji: "💰" },
    ],
  },
  affirmation_2: {
    key: "affirmation_2",
    title: "PERDI TODAS AS OPORTUNIDADES DE GANHAR DINHEIRO NA INTERNET",
    subtitle: "O quanto isso é a sua realidade?",
    options: [
      { value: "nao_aguento", label: "Não aguento", emoji: "😩" },
      { value: "cascalho", label: "Consegui fazer cascalho", emoji: "💵" },
      { value: "voando_alto", label: "TÔ VOANDO ALTO", emoji: "🚀" },
    ],
  },
  affirmation_3: {
    key: "affirmation_3",
    title: "TENHO MEDO DE PERDER TEMPO E DINHEIRO COM NEGÓCIO ONLINE...",
    subtitle: "O quanto isso é a sua realidade?",
    options: [
      { value: "minha_realidade", label: "100% minha realidade", emoji: "😨" },
      { value: "desconfiado", label: "Sou desconfiado", emoji: "🤨" },
      { value: "pra_cima", label: "PRA CIMA DELES", emoji: "🔥" },
    ],
  },
  available_time: {
    key: "available_time",
    title: "Quanto tempo por dia você consegue dedicar nos primeiros 30 dias?",
    options: [
      { value: "30min", label: "30 minutos" },
      { value: "1h", label: "1 hora" },
      { value: "2h", label: "2 horas" },
      { value: "3h_mais", label: "+3 horas" },
    ],
  },
  main_blocker: {
    key: "main_blocker",
    title: "Qual é a sua maior trava hoje?",
    options: [
      { value: "por_onde_comecar", label: "Não sei por onde começar" },
      { value: "sem_tempo", label: "Sem tempo" },
      { value: "sem_dinheiro", label: "Sem dinheiro" },
      { value: "acompanhamento", label: "Preciso de acompanhamento" },
    ],
  },
  income_use_case: {
    key: "income_use_case",
    title: "O que você faria com uma renda extra de R$ 1.621 por dia?",
    options: [
      { value: "pagar_contas", label: "Pagar contas", emoji: "💳" },
      { value: "largar_clt", label: "Largar o CLT", emoji: "💼" },
      { value: "ajudar_familia", label: "Ajudar a família", emoji: "👨‍👩‍👧" },
      { value: "viajar", label: "Viajar", emoji: "✈️" },
      { value: "comprar_casa", label: "Comprar casa", emoji: "🏠" },
    ],
  },
}

// Ordem das perguntas conforme a sequência das telas
export const VERTEBRA_QUESTION_ORDER: VertebraAnswerKey[] = [
  "target_income",
  "gender",
  "employment_status",
  "current_income",
  "affirmation_1",
  "affirmation_2",
  "affirmation_3",
  "available_time",
  "main_blocker",
  "income_use_case",
]

// Retorna o label legível de uma resposta
export function getVertebraAnswerLabel(key: VertebraAnswerKey, value?: string): string | null {
  if (!value) return null
  const q = VERTEBRA_QUESTIONS[key]
  const opt = q.options.find((o) => o.value === value)
  return opt ? opt.label : value
}

// ---- Pipeline do dashboard ----

export type VertebraStatus = "novo" | "contato_feito" | "fechado" | "perdido"

export type VertebraPipelineColumn = {
  key: VertebraStatus
  label: string
  hex: string
  color: string
  bg: string
  dot: string
}

export const VERTEBRA_PIPELINE: VertebraPipelineColumn[] = [
  {
    key: "novo",
    label: "Novo Lead",
    hex: "#8B5CF6",
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    dot: "bg-violet-400",
  },
  {
    key: "contato_feito",
    label: "Contato Feito",
    hex: "#3B82F6",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
  },
  {
    key: "fechado",
    label: "Fechado",
    hex: "#22C55E",
    color: "text-green-300",
    bg: "bg-green-500/10",
    dot: "bg-green-400",
  },
  {
    key: "perdido",
    label: "Perdido",
    hex: "#EF4444",
    color: "text-red-300",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
  },
]

export const VERTEBRA_STATUS_META: Record<VertebraStatus, VertebraPipelineColumn> =
  VERTEBRA_PIPELINE.reduce(
    (acc, col) => {
      acc[col.key] = col
      return acc
    },
    {} as Record<VertebraStatus, VertebraPipelineColumn>,
  )

export function isVertebraStatus(v: string): v is VertebraStatus {
  return VERTEBRA_PIPELINE.some((c) => c.key === v)
}

// Mapeia status legados (pipeline antigo de 5 colunas) para as 4 colunas atuais
const LEGACY_VERTEBRA_STATUS: Record<string, VertebraStatus> = {
  prospect: "novo",
  qualificado: "novo",
  aprovado: "novo",
  whatsapp_enviado: "contato_feito",
  convertido: "fechado",
}

export function normalizeVertebraStatus(value?: string | null): VertebraStatus {
  if (!value) return "novo"
  if (isVertebraStatus(value)) return value
  return LEGACY_VERTEBRA_STATUS[value] ?? "novo"
}
