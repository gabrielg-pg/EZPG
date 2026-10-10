"use client"

import { useEffect, useState } from "react"
import { ArrowDown, Check, ChevronDown, ExternalLink, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatBRL, propostaConfig, track, type PropostaPlan, type PropostaVideo } from "@/lib/proposta-config"

function AnimatedMetric({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const duration = 1400
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <span className="block text-3xl font-bold tracking-tight text-purple-300 sm:text-4xl">{prefix}{current.toLocaleString("pt-BR")}{suffix}</span>
}

function VideoCard({ video, compact = false }: { video: PropostaVideo; compact?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const hasCaption = Boolean(video.mercado || video.resultado)
  return <article className="min-w-0">
    <button type="button" className={`group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-black text-left ${compact ? "aspect-[16/9]" : "aspect-[9/16]"}`} onClick={() => { setPlaying(true); track("video_play", { video: video.id }) }} aria-label={`Reproduzir vídeo ${video.id}`}>
      {playing ? <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`} title={`Depoimento ${video.id}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <><img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" /><span className="absolute inset-0 grid place-items-center"><span className="grid size-14 place-items-center rounded-full bg-purple-500 text-white shadow-xl transition group-hover:scale-110"><Play className="ml-1 size-6 fill-current" /></span></span></>}
    </button>
    {hasCaption && <p className="mt-3 text-sm font-medium text-white/65">{[video.mercado, video.resultado].filter(Boolean).join(" · ")}</p>}
  </article>
}

function PlanCard({ plan, index }: { plan: PropostaPlan; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const destaque = index >= 2
  const visible = expanded ? plan.entregaveis : plan.entregaveis.slice(0, 4)
  return <article className={`flex flex-col rounded-3xl border p-6 ${destaque ? "border-purple-400 bg-purple-500/10 shadow-2xl shadow-purple-950/40" : "border-white/10 bg-white/[0.03]"}`}>
    <p className="text-xs font-bold tracking-[0.18em] text-purple-300">{destaque ? "MAIS ESCOLHIDO" : `PLANO ${index + 1}`}</p>
    <h3 className="mt-4 text-2xl font-bold tracking-tight">{plan.nome}</h3>
    <p className="mt-3 min-h-16 text-sm leading-6 text-white/65">{plan.indicadoPara}</p>
    <div className="mt-6 border-y border-white/10 py-5"><p className="text-3xl font-bold">{formatBRL(plan.valor)}</p><p className="mt-1 text-sm text-white/65">12x de {formatBRL(plan.valor / 12)} sem juros</p><p className="mt-2 text-sm font-semibold text-purple-200">Pix: {formatBRL(plan.pix)} · entrega em {plan.prazo}</p></div>
    <ul className="mt-6 space-y-3 text-sm text-white/75">{visible.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-purple-300" />{item}</li>)}</ul>
    {plan.entregaveis.length > 4 && <button type="button" className="mt-5 text-left text-sm font-semibold text-purple-300 hover:text-purple-200" onClick={() => setExpanded(!expanded)}>{expanded ? "Mostrar menos" : "Ver todos os entregáveis"}</button>}
    {plan.observacao && <p className="mt-5 text-xs leading-5 text-white/50">{plan.observacao}</p>}
    <div className="mt-auto grid gap-3 pt-8"><Button asChild className="min-h-11 rounded-full bg-purple-500 hover:bg-purple-400"><a href={plan.linkCartao} onClick={() => track("checkout_card", { plan: plan.nome })}>Pagar no cartão em até 12x</a></Button><Button asChild variant="outline" className="min-h-11 rounded-full border-purple-300/40 bg-transparent text-white hover:bg-purple-500/10"><a href={plan.linkPix} onClick={() => track("checkout_pix", { plan: plan.nome })}>Pagar no Pix com 5% off</a></Button></div>
  </article>
}

export function PropostaPublica() {
  const destaque = propostaConfig.videos.filter((video) => video.destaque)
  const restantes = propostaConfig.videos.filter((video) => !video.destaque)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const perguntas = [{ pergunta: "Qual plano eu escolho?", resposta: "O que eu te indiquei na reunião. Ficou em dúvida entre dois, me chama no WhatsApp antes de pagar." }, { pergunta: "Preciso entender de e-commerce?", resposta: "Não. Você recebe a estrutura pronta e tem acompanhamento no grupo." }, ...(propostaConfig.anuncioResposta ? [{ pergunta: "A verba de anúncio está inclusa no valor?", resposta: propostaConfig.anuncioResposta }] : []), { pergunta: "Por que a proposta vale só 5 dias?", resposta: "Porque a vaga fica reservada no seu nome. E eu não seguro vaga parada." }]
  const scrollToPlans = () => { track("ver_planos"); document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" }) }
  return <main className="min-h-screen overflow-x-hidden bg-[#0e0e0e] text-white">
    <section className="bg-[radial-gradient(circle_at_top_right,#6f3db9_0%,transparent_42%)] px-5 pb-20 pt-8 sm:px-10 lg:px-20"><div className="mx-auto max-w-7xl"><header className="flex flex-col items-center justify-center gap-5 text-center"><img src={propostaConfig.logoUrl} alt="Pro Growth Global" className="h-auto w-[min(420px,82vw)] object-contain" /><div className="flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-2 text-xl" aria-label="Países atendidos">{propostaConfig.paises.map((pais) => <span key={pais.nome} title={pais.nome} aria-label={pais.nome}>{pais.bandeira}</span>)}</div></header><div className="mx-auto max-w-4xl py-24 text-center sm:py-32"><p className="text-xs font-bold tracking-[0.25em] text-purple-300">PROPOSTA DE ESTRUTURAÇÃO · MÉTODO VÉRTEBRA™</p><h1 className="mt-5 text-balance text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">A reunião acabou. A sua operação começa aqui.</h1><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/70">Na reunião eu te indiquei um caminho.<br />Ele está aqui embaixo, com plano, investimento, prazo e garantia.</p><p className="mt-5 text-sm text-white/50">{propostaConfig.validade}</p><Button className="mt-8 min-h-12 rounded-full bg-purple-500 px-7 hover:bg-purple-400" onClick={scrollToPlans}>Ver os planos <ArrowDown data-icon="inline-end" /></Button></div></div></section>
    <section className="bg-[#151019] px-5 py-20 sm:px-10 lg:px-20"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold tracking-[0.2em] text-purple-300">PROVA REAL</p><h2 className="mt-3 max-w-3xl text-balance text-3xl font-bold sm:text-5xl">Antes de decidir, ouça quem já esteve onde você está agora.</h2><div className="mt-10 grid gap-6 text-center sm:grid-cols-3"><div><AnimatedMetric value={15} /><p className="mt-2 text-sm font-semibold text-white/65">anos de experiência</p></div><div><AnimatedMetric value={2157} prefix="+" /><p className="mt-2 text-sm font-semibold text-white/65">operações estruturadas</p></div><div><AnimatedMetric value={67} prefix="R$" suffix="MM" /><p className="mt-2 text-sm font-semibold text-white/65">gerados para clientes</p></div></div><p className="mt-5 text-white/60">Número você já ouviu na reunião.<br />Aqui são eles falando.</p><div className="mt-10 grid gap-5 sm:grid-cols-3">{destaque.map((video) => <VideoCard key={video.id} video={video} />)}</div></div></section>
    <section className="px-5 py-24 sm:px-10 lg:px-20"><div className="mx-auto max-w-3xl space-y-8"><h2 className="text-3xl font-bold sm:text-5xl">Dropshipping é estrutura, não loja.</h2>{["Muita gente chega até mim depois de tentar sozinha.", "Uns com uma loja genérica. Daquelas que nem o dono compraria.", "Outros sem empresa aberta, operando só com Stripe, travados na hora de escalar.", "Nos dois casos, o que faltava era estrutura por baixo.", "É isso que você contrata aqui."].map((text) => <p key={text} className="text-xl leading-9 text-white/70">{text}</p>)}</div></section>
    <section id="planos" className="bg-[#151019] px-5 py-20 sm:px-10 lg:px-20"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold tracking-[0.2em] text-purple-300">PLANOS</p><h2 className="mt-3 text-3xl font-bold sm:text-5xl">Escolha o nível de estrutura da sua operação.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">Os quatro planos seguem o Método VÉRTEBRA™.<br />O que muda é até onde a estrutura vai.</p><div className="mt-10 grid gap-5 lg:grid-cols-2">{propostaConfig.planos.map((plan, index) => <PlanCard key={plan.nome} plan={plan} index={index} />)}</div></div></section>
    <section className="px-5 py-16 sm:px-10 lg:px-20"><div className="mx-auto max-w-5xl rounded-3xl border border-purple-300/20 bg-purple-500/10 p-8 sm:p-12"><p className="text-xs font-bold tracking-[0.2em] text-purple-300">CONDIÇÃO ESPECIAL</p><h2 className="mt-3 text-3xl font-bold">5% no Pix enquanto a sua proposta estiver válida.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">Trabalho com número limitado de projetos ao mesmo tempo.<br />A sua vaga fica reservada por 5 dias depois da reunião.<br />Passou disso, ela volta pra fila.</p></div></section>
    <section className="px-5 py-20 sm:px-10 lg:px-20"><div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-purple-300/20 bg-white/[0.03] p-8 sm:flex-row sm:items-center sm:p-12"><div><p className="text-xs font-bold tracking-[0.2em] text-purple-300">GARANTIA</p><h2 className="mt-3 text-3xl font-bold">Garantia de 7 dias</h2><p className="mt-5 text-lg leading-8 text-white/70">Você recebe a estrutura pronta.<br />Tem 7 dias pra olhar tudo com calma.<br />Não gostou? Devolvo 100% no Pix. Sem complicação.<br />Em 15 anos, ninguém pediu.</p></div></div></section>
    <section className="bg-[#151019] px-5 py-20 sm:px-10 lg:px-20"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-bold sm:text-5xl">O que acontece depois do pagamento</h2><div className="mt-10 grid gap-4 sm:grid-cols-2">{["Você recebe um formulário curto: seus dados, WhatsApp, nicho e país.", "Abrimos um grupo exclusivo no WhatsApp. Acompanhamento direto, sem intermediário.", "A estrutura é entregue em 7 dias úteis. Nos planos Scale, em 10.", "A partir da entrega, começam os seus 7 dias de garantia."].map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><span className="font-mono text-sm text-purple-300">0{index + 1}</span><p className="mt-4 text-lg leading-7 text-white/75">{item}</p></div>)}</div></div></section>
    <section className="px-5 py-20 sm:px-10 lg:px-20"><div className="mx-auto max-w-7xl"><h2 className="text-3xl font-bold sm:text-5xl">Mais gente que já está rodando.</h2><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{restantes.map((video) => <VideoCard key={video.id} video={video} compact />)}</div></div></section>
    <section className="bg-[#151019] px-5 py-20 sm:px-10 lg:px-20"><div className="mx-auto max-w-4xl"><h2 className="text-3xl font-bold sm:text-5xl">O que costumam me perguntar nessa hora</h2><div className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10">{perguntas.map((item) => <div key={item.pergunta}><button type="button" className="flex w-full items-center justify-between gap-6 p-5 text-left font-semibold" onClick={() => setOpenQuestion(openQuestion === item.pergunta ? null : item.pergunta)}>{item.pergunta}<ChevronDown className={`size-5 shrink-0 text-purple-300 transition ${openQuestion === item.pergunta ? "rotate-180" : ""}`} /></button>{openQuestion === item.pergunta && <p className="px-5 pb-5 leading-7 text-white/65">{item.resposta}</p>}</div>)}</div></div></section>
    <section className="px-5 py-24 text-center sm:px-10 lg:px-20"><div className="mx-auto max-w-4xl"><h2 className="text-balance text-4xl font-bold leading-tight sm:text-6xl">Loja qualquer um monta. Estrutura é o que fica de pé quando o anúncio liga.</h2><Button className="mt-10 min-h-12 rounded-full bg-purple-500 px-8 hover:bg-purple-400" onClick={scrollToPlans}>Escolher meu plano</Button><a href={propostaConfig.whatsapp} className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300 hover:text-purple-200" onClick={() => track("whatsapp_click")}><ExternalLink className="size-4" />Ficou alguma dúvida da reunião? Me chama no WhatsApp</a></div></section>
    <footer className="border-t border-white/10 px-5 py-8 text-center text-xs leading-6 text-white/45">{propostaConfig.footer.map((line) => <span key={line} className="block">{line}</span>)}</footer>
  </main>
}
