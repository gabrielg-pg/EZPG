"use client"

import { useEffect, useRef, useState } from "react"

// Vimeo Player SDK é carregado via <Script> no layout desta rota.
type VimeoPlayer = {
  on: (event: string, cb: (data: { seconds: number }) => void) => void
  setMuted: (muted: boolean) => Promise<boolean>
  setVolume: (volume: number) => Promise<number>
  play: () => Promise<void>
}
declare global {
  interface Window {
    Vimeo?: {
      Player: new (el: HTMLIFrameElement | HTMLElement) => VimeoPlayer
    }
  }
}

const REVEAL_AT_SECONDS = 330 // 5:30

// Contador animado (count-up) que dispara ao entrar na viewport.
function StatCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  target: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let raf = 0
    let started = false

    const run = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        // easeOutExpo para um crescimento rápido que desacelera no fim.
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setValue(Math.round(eased * target))
        if (progress < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [target, duration])

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString("pt-BR")}
      {suffix}
    </span>
  )
}

export default function QuemSomosPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [ctaVisible, setCtaVisible] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Aguarda o SDK do Vimeo ficar disponível (o script é afterInteractive).
    function init() {
      if (cancelled) return
      const iframe = iframeRef.current
      if (!window.Vimeo || !iframe) {
        window.setTimeout(init, 250)
        return
      }
      const player = new window.Vimeo.Player(iframe)
      playerRef.current = player
      let shown = false
      player.on("timeupdate", (data) => {
        if (!shown && data.seconds >= REVEAL_AT_SECONDS) {
          shown = true
          setCtaVisible(true)
        }
      })
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  // Ativa o som (o autoplay só é permitido pelos navegadores quando iniciado mudo).
  const enableSound = () => {
    const player = playerRef.current
    if (!player) return
    Promise.resolve(player.setMuted(false))
      .then(() => player.setVolume(1))
      .then(() => player.play())
      .then(() => setMuted(false))
      .catch(() => {
        // Ignora: se falhar, o usuário pode tentar novamente.
      })
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      {/* Barra superior mínima — apenas o logo centralizado */}
      <header className="w-full flex items-center justify-center py-6 border-b border-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://i.imgur.com/jfNDVLp.png" alt="Pro Growth Global" className="h-8 w-auto" />
      </header>

      <div className="flex-1 w-full max-w-[960px] mx-auto px-4 sm:px-6 flex flex-col items-center">
        {/* Headline */}
        <section className="text-center pt-12 sm:pt-16 pb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-balance leading-tight">
            Quem é a Pro Growth — e o que a gente faz de verdade.
          </h1>
          {/* Linha fina dourada sob a headline */}
          <div className="mx-auto mt-5 h-px w-16 bg-[#C9A227]" aria-hidden="true" />
          <p className="mt-5 text-sm sm:text-base text-[#A1A1AA] text-pretty">
            5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.
          </p>
        </section>

        {/* Vídeo — elemento central e dominante */}
        <section className="w-full max-w-[900px]">
          <div
            className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10"
            style={{ paddingTop: "56.25%" }}
          >
            <iframe
              ref={iframeRef}
              src="https://player.vimeo.com/video/1214853650?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&pip=0&keyboard=0&playsinline=1"
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Quem é a Pro Growth"
            />

            {/* Overlay para ativar o som (autoplay exige início mudo nos navegadores) */}
            {muted && (
              <button
                type="button"
                onClick={enableSound}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-[2px] transition-opacity hover:bg-black/55"
                aria-label="Ativar o som do vídeo"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/40 ring-4 ring-white/10">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor" aria-hidden="true">
                    <path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1Z" />
                    <path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-white">Toque para ativar o som</span>
              </button>
            )}
          </div>
        </section>

        {/* CTA WhatsApp — aparece somente aos 5:30 (sem reservar espaço enquanto oculto) */}
        <section
          className={`w-full flex flex-col items-center justify-center ${ctaVisible ? "py-10" : "py-0"}`}
        >
          {ctaVisible && (
            <div className="cta-reveal flex flex-col items-center text-center">
              <a
                href="https://wa.link/r8jz4y"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-4 text-base font-semibold text-[#0A0A0A] transition-transform hover:scale-[1.02]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
                Falar com a equipe no WhatsApp
              </a>
              <p className="mt-3 text-xs text-[#A1A1AA]">Resposta em horário comercial. Sem robô.</p>
            </div>
          )}
        </section>

        {/* Faixa de prova — números animados (count-up) em destaque */}
        <section className="w-full pb-16 pt-2">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-7 text-center">
              <div className="text-4xl font-extrabold tracking-tight text-[#8B5CF6] sm:text-5xl tabular-nums">
                <StatCounter target={15} />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#A1A1AA] sm:text-sm">
                anos de mercado
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-7 text-center">
              <div className="text-4xl font-extrabold tracking-tight text-[#8B5CF6] sm:text-5xl tabular-nums">
                <StatCounter target={67} prefix="R$" suffix="MM" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#A1A1AA] sm:text-sm">
                gerados para clientes
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-7 text-center">
              <div className="text-4xl font-extrabold tracking-tight text-[#8B5CF6] sm:text-5xl tabular-nums">
                <StatCounter target={2157} suffix="+" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#A1A1AA] sm:text-sm">
                operações estruturadas
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Rodapé mínimo */}
      <footer className="w-full border-t border-white/5 py-6">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-[#71717A]">
          <span>Pro Growth Global</span>
          <span className="hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span>CNPJ 39.980.588/0001-22</span>
          <span className="hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <a
            href="https://progrowthglobal.com.br/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#C9A227]"
          >
            Política de privacidade
          </a>
        </div>
      </footer>

      {/* Animações: pulso do botão e fade-in do CTA */}
      <style>{`
        @keyframes pg-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55); }
          70%  { box-shadow: 0 0 0 18px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        @keyframes pg-fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .btn-whatsapp { animation: pg-pulse 2s infinite; }
        .cta-reveal { animation: pg-fade-in-up .6s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .btn-whatsapp { animation: none; }
          .cta-reveal { animation: none; }
        }
      `}</style>
    </main>
  )
}
