export type VertebraPipelineStatus =
  | "novo_lead"
  | "contato_feito"
  | "em_negociacao"
  | "fechado"
  | "perdido"

export type VertebraSinalStatus = "pendente" | "pago"

export type VertebraLead = {
  id: number
  nome: string
  whatsapp: string
  plano: string | null
  plano_preco: string | null
  forma_pagamento: string | null
  sinal_status: VertebraSinalStatus
  pipeline_status: VertebraPipelineStatus
  origem: string
  notas: string | null
  created_at: string
  updated_at: string
}

export type VertebraColumn = {
  key: VertebraPipelineStatus
  label: string
  color: string
}

// Colunas do pipeline (mesmas do CRM) — na ordem de exibição
export const VERTEBRA_COLUMNS: VertebraColumn[] = [
  { key: "novo_lead", label: "Novo Lead", color: "#3B82F6" },
  { key: "contato_feito", label: "Contato Feito", color: "#F59E0B" },
  { key: "em_negociacao", label: "Em Negociação", color: "#F97316" },
  { key: "fechado", label: "Fechado", color: "#16A34A" },
  { key: "perdido", label: "Perdido", color: "#EF4444" },
]

export type Plano = {
  id: string
  nome: string
  preco: string
  descricao: string
}

// Planos oferecidos no formulário (mesmos valores do PG Dash)
export const PLANOS_VERTEBRA: Plano[] = [
  {
    id: "start_growth",
    nome: "Start Growth™",
    preco: "R$2.497,00",
    descricao: "Indicado para quem está iniciando no e-commerce e precisa da base correta.",
  },
  {
    id: "pro_vertebra",
    nome: "Pro Vértebra™",
    preco: "R$4.297,00",
    descricao: "Indicado para quem quer iniciar com estrutura sólida e percepção profissional.",
  },
  {
    id: "scale_vertebra",
    nome: "Scale Vértebra™",
    preco: "R$6.997,00",
    descricao: "Indicado para quem já validou a ideia e quer escalar com acompanhamento profissional contínuo.",
  },
  {
    id: "scale_global",
    nome: "Scale Global™",
    preco: "R$9.997,00",
    descricao: "Indicado para quem busca escala real e gestão de tráfego internacional.",
  },
]

export type FormaPagamento = {
  id: string
  titulo: string
  descricao: string
}

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  { id: "pix", titulo: "Pix à vista", descricao: "10% de desconto" },
  {
    id: "cartao",
    titulo: "Cartão de crédito",
    descricao: "Até 12x com juros, via C6 Bank (uma das menores taxas do mercado atualmente)",
  },
]

// Cores dos badges de plano (mesmo padrão do CRM)
export const PLANO_BADGE: Record<string, string> = {
  "Start Growth™": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Pro Vértebra™": "bg-primary/15 text-primary border-primary/30",
  "Scale Vértebra™": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Scale Global™": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
}

export const RESERVA_CHECKOUT = "https://payfast.greenn.com.br/bf7b7my"
