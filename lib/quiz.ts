// Configuração do Quiz de Qualificação (Funil Pro Growth)
// Compartilhado entre client (exibição) e server (recálculo autoritativo do score).

export type QuizOption = {
  value: string
  label: string
  points: number
}

export type QuizQuestion = {
  id: string
  title: string
  // usada no painel /funil para exibir colunas específicas (capital / prazo)
  facet?: "capital" | "prazo"
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    title: "O que você busca construir?",
    options: [
      { value: "operacao", label: "Uma operação de negócio", points: 3 },
      { value: "nova_renda", label: "Uma nova renda", points: 2 },
      { value: "complementar", label: "Complementar minha renda", points: 1 },
      { value: "pesquisando", label: "Só estou pesquisando", points: 0 },
    ],
  },
  {
    id: "q2",
    title: "Quanto você tem disponível para investir?",
    facet: "capital",
    options: [
      { value: "ate_1k", label: "Até R$ 1.000", points: 0 },
      { value: "1k_3k", label: "R$ 1.000 a R$ 3.000", points: 1 },
      { value: "3k_5k", label: "R$ 3.000 a R$ 5.000", points: 3 },
      { value: "5k_10k", label: "R$ 5.000 a R$ 10.000", points: 4 },
      { value: "acima_10k", label: "Acima de R$ 10.000", points: 5 },
    ],
  },
  {
    id: "q3",
    title: "Como você gera renda hoje?",
    options: [
      { value: "clt", label: "CLT (carteira assinada)", points: 2 },
      { value: "empresario", label: "Empresário(a)", points: 3 },
      { value: "autonomo", label: "Autônomo(a)", points: 2 },
      { value: "investimentos", label: "Investimentos", points: 4 },
      { value: "sem_renda", label: "Sem renda fixa no momento", points: 0 },
    ],
  },
  {
    id: "q4",
    title: "Qual sua faixa de renda mensal?",
    options: [
      { value: "ate_3k", label: "Até R$ 3.000", points: 0 },
      { value: "3k_5k", label: "R$ 3.000 a R$ 5.000", points: 1 },
      { value: "5k_10k", label: "R$ 5.000 a R$ 10.000", points: 2 },
      { value: "10k_20k", label: "R$ 10.000 a R$ 20.000", points: 3 },
      { value: "acima_20k", label: "Acima de R$ 20.000", points: 4 },
    ],
  },
  {
    id: "q5",
    title: "Quando pretende começar?",
    facet: "prazo",
    options: [
      { value: "imediatamente", label: "Imediatamente", points: 4 },
      { value: "30_dias", label: "Nos próximos 30 dias", points: 3 },
      { value: "3_meses", label: "Em até 3 meses", points: 2 },
      { value: "avaliando", label: "Ainda estou avaliando", points: 1 },
      { value: "pesquisando", label: "Só pesquisando", points: 0 },
    ],
  },
  {
    id: "q6",
    title: "Qual sua experiência com vendas online?",
    options: [
      { value: "operacao_ativa", label: "Tenho uma operação funcionando", points: 4 },
      { value: "vendeu_antes", label: "Já vendi online antes", points: 2 },
      { value: "dropshipping", label: "Já tentei dropshipping", points: 2 },
      { value: "nunca", label: "Nunca vendi online", points: 0 },
      { value: "acompanha", label: "Apenas acompanho o mercado", points: 0 },
    ],
  },
  {
    id: "q7",
    title: "Quanto investiria mensalmente na operação?",
    options: [
      { value: "ate_500", label: "Até R$ 500", points: 0 },
      { value: "500_1k", label: "R$ 500 a R$ 1.000", points: 1 },
      { value: "1k_3k", label: "R$ 1.000 a R$ 3.000", points: 2 },
      { value: "3k_5k", label: "R$ 3.000 a R$ 5.000", points: 3 },
      { value: "acima_5k", label: "Acima de R$ 5.000", points: 4 },
    ],
  },
]

// Pontuação máxima possível (derivada da config, para exibir "score / MAX_SCORE")
export const MAX_SCORE = QUIZ_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0,
)

export type QuizProfile = "BAIXA_PRONTIDAO" | "EM_PREPARACAO" | "ALTO_POTENCIAL"

export type ProfileMeta = {
  key: QuizProfile
  label: string
  // tokens de cor para badges/indicadores
  color: string // texto/borda
  bg: string
  dot: string
  ring: string
  hex: string
  description: string
}

export const PROFILE_META: Record<QuizProfile, ProfileMeta> = {
  BAIXA_PRONTIDAO: {
    key: "BAIXA_PRONTIDAO",
    label: "Baixa Prontidão",
    color: "text-red-400 border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
    ring: "ring-red-500/40",
    hex: "#EF4444",
    description: "Ainda pesquisando, pouco capital, sem urgência",
  },
  EM_PREPARACAO: {
    key: "EM_PREPARACAO",
    label: "Em Preparação",
    color: "text-amber-400 border-amber-500/30",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
    ring: "ring-amber-500/40",
    hex: "#F59E0B",
    description: "Interesse real, algum capital, incerteza de prazo",
  },
  ALTO_POTENCIAL: {
    key: "ALTO_POTENCIAL",
    label: "Alto Potencial",
    color: "text-green-400 border-green-500/30",
    bg: "bg-green-500/10",
    dot: "bg-green-500",
    ring: "ring-green-500/40",
    hex: "#22C55E",
    description: "Pronto para começar, capital disponível, urgência clara",
  },
}

// Respostas: { q1: "operacao", q2: "5k_10k", ... }
export type QuizAnswers = Record<string, string>

// Recalcula os pontos por pergunta a partir das respostas (autoritativo no server)
export function computePoints(answers: QuizAnswers): Record<string, number> {
  const points: Record<string, number> = {}
  for (const q of QUIZ_QUESTIONS) {
    const selected = answers[q.id]
    const opt = q.options.find((o) => o.value === selected)
    points[q.id] = opt ? opt.points : 0
  }
  return points
}

export function computeScore(answers: QuizAnswers): number {
  const points = computePoints(answers)
  return Object.values(points).reduce((a, b) => a + b, 0)
}

export function getProfile(score: number): QuizProfile {
  if (score <= 7) return "BAIXA_PRONTIDAO"
  if (score <= 14) return "EM_PREPARACAO"
  return "ALTO_POTENCIAL"
}

// Resolve o label de uma resposta (ex.: capital, prazo) para exibição no painel
export function getAnswerLabel(questionId: string, value: string | null | undefined): string | null {
  if (!value) return null
  const q = QUIZ_QUESTIONS.find((q) => q.id === questionId)
  const opt = q?.options.find((o) => o.value === value)
  return opt?.label ?? null
}

export function getFacetQuestionId(facet: "capital" | "prazo"): string | null {
  return QUIZ_QUESTIONS.find((q) => q.facet === facet)?.id ?? null
}
