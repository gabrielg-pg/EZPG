export const propostaConfig = {
  validade: "Proposta válida por 5 dias após a sua reunião.",
  whatsapp: "https://wa.link/kxuh19",
  garantia: {
    titulo: "Garantia de 7 dias",
    texto: "Acreditamos tanto que iremos lhe entregar algo além das suas expectativas, que oferecemos 7 dias após a estrutura pronta para você avaliar e, caso não gostares, iremos devolver 100% no Pix, sem complicações. Porém, em 15 anos, nunca tivemos 1 caso de reembolso. Temos certeza que você não será o primeiro.",
  },
  logoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pg_neg_principal-uEzXxSS3XTRWXcfURoNuczm7hsBcte.png",
  footer: ["Copyright © 2026 PRO GROWTH®︎ GLOBAL LTDA.", "Todos os direitos reservados.", "CNPJ: 39.980.588/0001-22"],
  paises: [
    { nome: "Brasil", bandeira: "🇧🇷" }, { nome: "Europa", bandeira: "🇪🇺" }, { nome: "Estados Unidos", bandeira: "🇺🇸" },
    { nome: "Portugal", bandeira: "🇵🇹" }, { nome: "Espanha", bandeira: "🇪🇸" }, { nome: "Itália", bandeira: "🇮🇹" },
    { nome: "Reino Unido", bandeira: "🇬🇧" }, { nome: "França", bandeira: "🇫🇷" }, { nome: "Alemanha", bandeira: "🇩🇪" },
    { nome: "Canadá", bandeira: "🇨🇦" }, { nome: "México", bandeira: "🇲🇽" },
  ],
  videos: {
    destaque: "6_yW96AbLiE",
    verticais: ["y1tbuvC83is", "a-WmEBSTTyM", "NEOB1NGFPCk", "zYN9t_QP2qc", "f8h6ED8w9AI", "VKXDw4FcQTs", "dHoed044zdo", "iO8NRnadk9g", "D3XUAIYddI8", "wiNs5iTPynE", "W7F9PMkPaKk", "KQCUcdxhWtY"],
  },
  planos: [
    { nome: "START GROWTH™", indicadoPara: "Quem está iniciando no e-commerce e precisa da base correta.", valor: 2997, pix: 2847.15, prazo: "7 dias úteis", entregaveis: ["Estrutura base da loja", "Organização inicial de produtos", "Checkout configurado", "Páginas institucionais", "Identidade visual inicial", "Layout base", "Onboarding inicial"], linkCartao: "#", linkPix: "#" },
    { nome: "PRO VÉRTEBRA™", indicadoPara: "Quem quer iniciar com estrutura sólida e percepção profissional.", valor: 5297, pix: 5032.15, prazo: "7 dias úteis", entregaveis: ["Loja completa estruturada", "Organização estratégica de produtos", "Arquitetura de conversão", "Checkout otimizado", "Identidade visual profissional", "Layout refinado", "Banners estratégicos", "Páginas institucionais completas", "Estrutura de autoridade", "Base operacional organizada", "Onboarding estratégico", "Base pronta para tráfego"], linkCartao: "#", linkPix: "#" },
    { nome: "SCALE VÉRTEBRA™", indicadoPara: "Quem quer estrutura pronta para escala e já começar com tráfego gerido.", valor: 9997, pix: 9497.15, prazo: "10 dias úteis", observacao: "Após o primeiro mês de gestão, plano Pro ADS por R$ 1.497,00.", entregaveis: ["Loja estruturada para escala", "Arquitetura de conversão avançada", "Organização estratégica", "Identidade visual completa", "Layout profissional", "Estrutura de autoridade", "Planejamento estratégico", "Estrutura pronta para campanhas", "Onboarding e acompanhamento", "Gestão estratégica de mídias", "Gestão de tráfego pago completa por 1 mês"], linkCartao: "#", linkPix: "#" },
    { nome: "SCALE GLOBAL™", indicadoPara: "Quem busca escala real e gestão de tráfego.", valor: 14997, pix: 14247.15, prazo: "10 dias úteis", entregaveis: ["Abertura de Empresa LTD / UK", "Loja estruturada completa", "Arquitetura internacional", "Checkout global", "Organização operacional", "Identidade visual premium", "Estrutura de autoridade", "Manual estratégico", "Organização de contas", "Otimizações iniciais", "Gestão de ADS", "Gestão de mídias sociais"], linkCartao: "#", linkPix: "#" },
  ],
} as const

export type PropostaPlan = (typeof propostaConfig.planos)[number]
export const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || ""
export const proposalLink = (_name?: string) => "https://progrowth-global.com/proposta"
export const followUpDefaults = [
  "Oi {nome}, tudo bem? Passando para saber se você conseguiu ver a proposta com calma. Deixo o link aqui de novo: {link}. Ficou alguma dúvida sobre os planos?",
  "{nome}, tudo certo? Estou fechando a agenda de novas operações e queria confirmar se ainda faz sentido reservar a sua vaga. Se quiser, tiro qualquer dúvida por aqui mesmo.",
  "Oi {nome}! Esse é meu último contato sobre a proposta, para não te incomodar. Se o momento não for agora, sem problema, é só me avisar. Se quiser seguir, o link continua aqui: {link}",
]

export function track(event: string, data?: Record<string, string>) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("proposta:track", { detail: { event, ...data } }))
}
