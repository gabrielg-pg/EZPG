export const propostaConfig = {
  validade: "Proposta válida por 5 dias após a sua reunião.",
  whatsapp: "https://wa.link/kxuh19",
  logoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pg_neg_principal-uEzXxSS3XTRWXcfURoNuczm7hsBcte.png",
  guaranteeBadgeUrl: "/guarantee-badge.png",
  footer: ["Copyright © 2026 PRO GROWTH®︎ GLOBAL LTDA.", "Todos os direitos reservados.", "CNPJ: 39.980.588/0001-22"],
  anuncioResposta: "",
  paises: [
    { nome: "Brasil", bandeira: "🇧🇷" }, { nome: "Europa", bandeira: "🇪🇺" }, { nome: "Estados Unidos", bandeira: "🇺🇸" },
    { nome: "Portugal", bandeira: "🇵🇹" }, { nome: "Espanha", bandeira: "🇪🇸" }, { nome: "Itália", bandeira: "🇮🇹" },
    { nome: "Reino Unido", bandeira: "🇬🇧" }, { nome: "França", bandeira: "🇫🇷" }, { nome: "Alemanha", bandeira: "🇩🇪" }, { nome: "Canadá", bandeira: "🇨🇦" },
  ],
  videos: [
    { id: "y1tbuvC83is", destaque: true, mercado: "", resultado: "" },
    { id: "a-WmEBSTTyM", destaque: true, mercado: "", resultado: "" },
    { id: "NEOB1NGFPCk", destaque: true, mercado: "", resultado: "" },
    { id: "zYN9t_QP2qc", destaque: false, mercado: "", resultado: "" },
    { id: "f8h6ED8w9AI", destaque: false, mercado: "", resultado: "" },
    { id: "VKXDw4FcQTs", destaque: false, mercado: "", resultado: "" },
    { id: "dHoed044zdo", destaque: false, mercado: "", resultado: "" },
    { id: "iO8NRnadk9g", destaque: false, mercado: "", resultado: "" },
    { id: "D3XUAIYddI8", destaque: false, mercado: "", resultado: "" },
    { id: "wiNs5iTPynE", destaque: false, mercado: "", resultado: "" },
    { id: "W7F9PMkPaKk", destaque: false, mercado: "", resultado: "" },
    { id: "KQCUcdxhWtY", destaque: false, mercado: "", resultado: "" },
    { id: "6_yW96AbLiE", destaque: false, mercado: "", resultado: "" },
  ],
  planos: [
    { nome: "START GROWTH™", indicadoPara: "Pra quem está entrando no e-commerce e quer começar pela base certa.", valor: 2997, pix: 2847.15, prazo: "7 dias úteis", entregaveis: ["Estrutura base da operação", "Organização inicial de produtos", "Checkout configurado", "Páginas institucionais", "Identidade visual inicial", "Layout base", "Onboarding inicial"], linkCartao: "#", linkPix: "#", observacao: "" },
    { nome: "PRO VÉRTEBRA™", indicadoPara: "Pra quem quer entrar com uma estrutura sólida. Uma que você mesmo compraria.", valor: 5297, pix: 5032.15, prazo: "7 dias úteis", entregaveis: ["Estrutura completa", "Organização estratégica de produtos", "Arquitetura de conversão", "Checkout otimizado", "Identidade visual profissional", "Layout refinado", "Banners estratégicos", "Páginas institucionais completas", "Estrutura de autoridade", "Base operacional organizada", "Onboarding estratégico", "Base pronta para tráfego"], linkCartao: "#", linkPix: "#", observacao: "" },
    { nome: "SCALE VÉRTEBRA™", indicadoPara: "Pra quem quer a estrutura pronta pra escala e já começar com o tráfego gerido por nós.", valor: 9997, pix: 9497.15, prazo: "10 dias úteis", observacao: "Após o primeiro mês de gestão, plano Pro ADS por R$ 1.497,00.", entregaveis: ["Estrutura pronta para escala", "Arquitetura de conversão avançada", "Organização estratégica de produtos", "Identidade visual completa", "Layout profissional", "Estrutura de autoridade", "Planejamento estratégico", "Estrutura pronta para campanhas", "Onboarding e acompanhamento", "Gestão estratégica de mídias", "Gestão de tráfego pago completa por 1 mês"], linkCartao: "#", linkPix: "#" },
    { nome: "SCALE GLOBAL™", indicadoPara: "Pra quem vai vender fora do Brasil. Empresa LTD aberta no Reino Unido, checkout global e tráfego gerido.", valor: 14997, pix: 14247.15, prazo: "10 dias úteis", entregaveis: ["Abertura de empresa LTD no Reino Unido", "Estrutura completa", "Arquitetura internacional", "Checkout global", "Organização operacional", "Identidade visual premium", "Estrutura de autoridade", "Manual estratégico", "Organização de contas", "Otimizações iniciais", "Gestão de ADS", "Gestão de mídias sociais"], linkCartao: "#", linkPix: "#", observacao: "" },
  ],
} as const

export type PropostaPlan = (typeof propostaConfig.planos)[number]
export type PropostaVideo = (typeof propostaConfig.videos)[number]
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
