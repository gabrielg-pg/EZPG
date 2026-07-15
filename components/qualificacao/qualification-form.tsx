"use client"

import type { ReactNode } from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ArrowLeft, ArrowRight, ShieldCheck, BadgeCheck } from "lucide-react"
import { createPartialLead, updateLeadProgress } from "@/app/actions/leads-actions"

const WHATSAPP_LINK = "https://wa.link/a571wz"
const BLOG_LINK = "https://progrowthglobal.com.br/blog/"
const HOME_LINK = "https://progrowthglobal.com.br"
const PRIVACY_LINK = "https://progrowthglobal.com.br/politica-de-privacidade/"
const LOGO = "https://progrowthglobal.com.br/wp-content/uploads/2025/07/logo-pro-growth-horizontal.svg"

const TOTAL_STEPS = 7

// ---------- Pixel helper ----------
type Fbq = (...args: unknown[]) => void
function track(type: "track" | "trackCustom", event: string) {
  if (typeof window !== "undefined" && (window as unknown as { fbq?: Fbq }).fbq) {
    ;(window as unknown as { fbq: Fbq }).fbq(type, event)
  }
}

// ---------- Options ----------
const OBJETIVOS = [
  "Ter uma renda complementar consistente",
  "Substituir minha renda atual",
  "Faturar em dólar ou euro",
  "Ter um negócio próprio rodando",
]
const SITUACOES = [
  "Trabalho com CLT",
  "Sou autônomo ou freelancer",
  "Tenho meu próprio negócio",
  "Estou em transição profissional",
]
const EXPERIENCIAS = [
  "Nunca tentei — quero começar do jeito certo",
  "Já tentei, mas não obtive os resultados que esperava",
  "Já tenho uma operação rodando e quero escalar",
]
const CAPITAIS: { value: string; label: string; disqualify?: boolean }[] = [
  { value: "2k_5k", label: "Tenho entre R$ 2.000 e R$ 5.000 disponível" },
  { value: "5k_10k", label: "Tenho entre R$ 5.000 e R$ 10.000 disponível" },
  { value: "acima_10k", label: "Tenho acima de R$ 10.000 disponível" },
  { value: "sem_capital", label: "No momento não tenho capital disponível", disqualify: true },
]
const PRAZOS = ["O mais rápido possível", "Nos próximos 30 dias", "Em 2 a 3 meses"]

type FormData = {
  objetivo: string
  situacao: string
  nome: string
  whatsapp: string
  email: string
  experiencia: string
  capital: string
  prazo: string
}

const EMPTY: FormData = {
  objetivo: "",
  situacao: "",
  nome: "",
  whatsapp: "",
  email: "",
  experiencia: "",
  capital: "",
  prazo: "",
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function QualificationForm() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [shake, setShake] = useState(false)
  const [showWhats, setShowWhats] = useState(false)
  const [disqualifying, setDisqualifying] = useState(false)
  // Gate de idade (fora da contagem das 7 etapas): "none" | "gate" | "rejected"
  const [ageStep, setAgeStep] = useState<"none" | "gate" | "rejected">("none")
  const formStarted = useRef(false)

  // Tela de entrada → dispara FormStart e abre a verificação de idade
  const startQualification = () => {
    if (!formStarted.current) {
      formStarted.current = true
      track("trackCustom", "FormStart")
    }
    setAgeStep("gate")
  }

  // Verificação de idade
  const handleAgeYes = () => {
    setAgeStep("none")
    setStep(1)
  }
  const handleAgeNo = () => {
    setAgeStep("rejected")
  }

  // Redireciona para a home 8s após recusa por idade
  useEffect(() => {
    if (ageStep === "rejected") {
      const t = setTimeout(() => {
        window.location.href = HOME_LINK
      }, 8000)
      return () => clearTimeout(t)
    }
  }, [ageStep])

  // Captura UTMs
  const getUtms = useCallback(() => {
    const p = searchParams
    return {
      utm_source: p.get("utm_source") || undefined,
      utm_medium: p.get("utm_medium") || undefined,
      utm_campaign: p.get("utm_campaign") || undefined,
      utm_content: p.get("utm_content") || undefined,
      utm_term: p.get("utm_term") || undefined,
      fbclid: p.get("fbclid") || undefined,
    }
  }, [searchParams])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  // Step 3: salvar lead parcial
  const handleContactSubmit = async () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (form.nome.trim().length < 3) newErrors.nome = "Informe seu nome completo."
    if (form.whatsapp.replace(/\D/g, "").length !== 11) newErrors.whatsapp = "Informe um WhatsApp válido com DDD."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = "Informe um e-mail válido."
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      triggerShake()
      return
    }
    setErrors({})
    setSaving(true)
    const result = await createPartialLead({
      nome: form.nome,
      whatsapp: form.whatsapp,
      email: form.email,
      objetivo: form.objetivo,
      situacao: form.situacao,
      ...getUtms(),
    })
    setSaving(false)
    if (result.success && result.id) {
      setLeadId(result.id)
      track("trackCustom", "ContactCaptured")
      setStep(4)
    } else {
      setErrors({ email: result.error || "Erro ao salvar. Tente novamente." })
      triggerShake()
    }
  }

  // Step 5: capital (bifurcação)
  const handleCapital = (value: string, disqualify?: boolean) => {
    setForm((f) => ({ ...f, capital: value }))
    if (disqualify) {
      setDisqualifying(true)
      track("trackCustom", "LeadDesqualificado")
      if (leadId) {
        void updateLeadProgress(leadId, { capital: "sem_capital", status: "desqualificado" })
      }
      setTimeout(() => {
        window.location.href = BLOG_LINK
      }, 1500)
      return
    }
    // Avança imediatamente; salva em segundo plano
    if (leadId) void updateLeadProgress(leadId, { capital: value })
    setStep(6)
  }

  // Step 4: experiência
  const handleExperiencia = (value: string) => {
    setForm((f) => ({ ...f, experiencia: value }))
    if (leadId) void updateLeadProgress(leadId, { experiencia: value })
    setStep(5)
  }

  // Step 6 → 7: prazo + qualificação final
  const handlePrazo = (value: string) => {
    setForm((f) => ({ ...f, prazo: value }))
    if (leadId) void updateLeadProgress(leadId, { prazo: value, status: "qualificado" })
    track("track", "Lead")
    track("trackCustom", "LeadQualificado")
    setStep(7)
  }

  // Mostrar botão WhatsApp após 1s no step 7
  useEffect(() => {
    if (step === 7) {
      const t = setTimeout(() => setShowWhats(true), 1000)
      return () => clearTimeout(t)
    }
  }, [step])

  if (disqualifying) {
    return <TransitionScreen />
  }

  if (ageStep === "rejected") {
    return <AgeRejectedScreen />
  }

  if (ageStep === "gate") {
    return <AgeGateScreen onYes={handleAgeYes} onNo={handleAgeNo} />
  }

  if (step === 0) {
    return <StartScreen onStart={startQualification} />
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-center border-b border-[#2A2A2A] px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO || "/placeholder.svg"} alt="Pro Growth Global" className="h-6 w-auto" />
      </header>

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-[#141414]">
        <div
          className="h-full bg-[#16A34A] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-[120px] pt-8">
        <div key={step} className="animate-[slideIn_0.35s_ease-out]">
          <p className="mb-2 text-sm font-medium text-[#525252]">
            {step === 7 ? "Concluído" : `Etapa ${step} de ${TOTAL_STEPS}`}
          </p>

          {step === 1 && (
            <StepSelection
              title="Qual é o seu principal objetivo com uma operação de e-commerce?"
              options={OBJETIVOS}
              selected={form.objetivo}
              onSelect={(v) => setForm((f) => ({ ...f, objetivo: v }))}
            />
          )}

          {step === 2 && (
            <StepSelection
              title="Como você se descreve hoje?"
              options={SITUACOES}
              selected={form.situacao}
              onSelect={(v) => setForm((f) => ({ ...f, situacao: v }))}
            />
          )}

          {step === 3 && (
            <ContactStep
              form={form}
              errors={errors}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
          )}

          {step === 4 && (
            <StepSelection
              title="Você já tentou vender online ou montar uma loja antes?"
              options={EXPERIENCIAS}
              selected={form.experiencia}
              onSelect={handleExperiencia}
              autoAdvance
            />
          )}

          {step === 5 && (
            <div>
              <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-balance">
                Para montar uma operação estruturada, é necessário um investimento inicial. Qual é a sua
                disponibilidade de capital hoje?
              </h1>
              <div className="flex flex-col gap-2.5">
                {CAPITAIS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleCapital(c.value, c.disqualify)}
                    className={cardClass(form.capital === c.value)}
                  >
                    <span className="text-[15px] font-medium leading-snug">{c.label}</span>
                    {form.capital === c.value && <CheckDot />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <StepSelection
              title="Quando você pretende iniciar sua operação?"
              options={PRAZOS}
              selected={form.prazo}
              onSelect={handlePrazo}
              autoAdvance
            />
          )}

          {step === 7 && <ConfirmationStep showWhats={showWhats} />}
        </div>
      </div>

      {/* Bottom actions (fixed) — só para steps com botão Continuar */}
      {(step === 1 || step === 2 || step === 3) && (
        <div className="fixed inset-x-0 bottom-0 border-t border-[#2A2A2A] bg-[#0B0B0B]/95 px-5 pb-6 pt-4 backdrop-blur">
          <div className="mx-auto w-full max-w-lg">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (step === 1) {
                  if (!form.objetivo) return triggerShake()
                  setStep(2)
                } else if (step === 2) {
                  if (!form.situacao) return triggerShake()
                  setStep(3)
                } else if (step === 3) {
                  handleContactSubmit()
                }
              }}
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#15803D] disabled:opacity-60 ${
                shake ? "animate-[shake_0.4s]" : ""
              }`}
            >
              {saving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  Continuar <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            {step >= 2 && (
              <button
                type="button"
                onClick={goBack}
                className="mx-auto mt-3 flex items-center gap-1.5 text-sm text-[#A3A3A3] transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voltar para steps de auto-advance (4,5,6) */}
      {(step === 4 || step === 5 || step === 6) && (
        <div className="fixed inset-x-0 bottom-0 px-5 pb-6 pt-4">
          <div className="mx-auto w-full max-w-lg">
            <button
              type="button"
              onClick={goBack}
              className="mx-auto flex items-center gap-1.5 text-sm text-[#A3A3A3] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}

// ---------- Helpers de UI ----------

function cardClass(selected: boolean): string {
  return [
    "flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left transition-all duration-100",
    selected
      ? "border-[#16A34A] bg-[rgba(22,163,74,0.15)]"
      : "border-[#2A2A2A] bg-[#1A1A1A] hover:bg-[#222222]",
  ].join(" ")
}

function CheckDot() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#16A34A]">
      <Check className="h-4 w-4 text-white" />
    </span>
  )
}

function StepSelection({
  title,
  options,
  selected,
  onSelect,
  autoAdvance,
}: {
  title: string
  options: string[]
  selected: string
  onSelect: (v: string) => void
  autoAdvance?: boolean
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-balance">{title}</h1>
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onSelect(opt)} className={cardClass(selected === opt)}>
            <span className="text-[15px] font-medium leading-snug">{opt}</span>
            {selected === opt && !autoAdvance && <CheckDot />}
          </button>
        ))}
      </div>
    </div>
  )
}

function ContactStep({
  form,
  errors,
  onChange,
}: {
  form: FormData
  errors: Partial<Record<string, string>>
  onChange: (patch: Partial<FormData>) => void
}): ReactNode {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-balance">
        Antes de continuar, precisamos de algumas informações.
      </h1>
      <p className="mb-6 flex items-center gap-1.5 text-sm text-[#A3A3A3]">
        <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
        Seus dados são protegidos e não serão compartilhados.
      </p>

      <div className="flex flex-col gap-4">
        <Field label="Nome completo" error={errors.nome}>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            placeholder="Seu nome completo"
            className={inputClass(!!errors.nome)}
          />
        </Field>
        <Field label="WhatsApp" error={errors.whatsapp}>
          <input
            type="tel"
            inputMode="tel"
            value={form.whatsapp}
            onChange={(e) => onChange({ whatsapp: maskPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            className={inputClass(!!errors.whatsapp)}
          />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <input
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="seu@email.com"
            className={inputClass(!!errors.email)}
          />
        </Field>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-[#525252]">
        Ao continuar, você concorda com nossa{" "}
        <a href={PRIVACY_LINK} target="_blank" rel="noopener noreferrer" className="text-[#16A34A] underline">
          Política de Privacidade
        </a>
        .
      </p>
    </div>
  )
}

function inputClass(hasError: boolean): string {
  return [
    "h-[52px] w-full rounded-xl border bg-[#1A1A1A] px-4 text-[15px] text-white placeholder:text-[#525252] outline-none transition-colors",
    hasError ? "border-[#EF4444]" : "border-[#2A2A2A] focus:border-[#16A34A]",
  ].join(" ")
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#A3A3A3]">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
}

function ConfirmationStep({ showWhats }: { showWhats: boolean }) {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(22,163,74,0.15)]">
        <svg className="h-12 w-12" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="25" stroke="#16A34A" strokeWidth="2" />
          <path
            d="M16 27l7 7 13-15"
            stroke="#22C55E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: "drawCheck 0.6s ease-out 0.2s forwards",
            }}
          />
        </svg>
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Perfil aprovado.</h1>
      <p className="mb-2 max-w-sm text-[15px] leading-relaxed text-[#A3A3A3]">
        Um especialista da Pro Growth Global vai entrar em contato com você agora pelo WhatsApp.
      </p>
      <p className="mb-8 text-sm text-[#525252]">
        Enquanto isso, clique abaixo para falar diretamente com nossa equipe.
      </p>

      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("trackCustom", "WhatsAppClick")}
        className={`flex h-[56px] w-full max-w-sm items-center justify-center gap-2.5 rounded-xl bg-[#16A34A] text-sm font-semibold uppercase tracking-wide text-white transition-all duration-500 hover:bg-[#15803D] ${
          showWhats ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 0 0 3.8.97h.004a7.94 7.94 0 0 0 5.6-13.55zM12.05 18.5a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25a6.59 6.59 0 1 1 5.59 3.09zm3.62-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.5.64-.62.77-.11.13-.23.15-.43.05a5.4 5.4 0 0 1-1.59-.98 6 6 0 0 1-1.1-1.37c-.12-.2 0-.3.09-.4l.3-.35c.1-.12.13-.2.2-.34.07-.13.03-.25-.02-.35-.05-.1-.45-1.08-.62-1.48-.16-.39-.33-.34-.45-.34l-.38-.01a.73.73 0 0 0-.53.25 2.23 2.23 0 0 0-.69 1.65c0 .98.71 1.92.81 2.05.1.13 1.4 2.13 3.38 2.99.47.2.84.33 1.13.42.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.86.12-.94-.05-.08-.18-.13-.38-.23z" />
        </svg>
        Falar com especialista no WhatsApp
      </a>

      <style>{`
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  )
}

// Contador animado (count-up) com easing
function CountUp({
  value,
  duration = 1800,
  decimals = 0,
}: {
  value: number
  duration?: number
  decimals?: number
}) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(value * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = display.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return <>{formatted}</>
}

const START_STATS = [
  { prefix: "+", value: 2157, decimals: 0, suffix: "", label: "Operações estruturadas" },
  { prefix: "R$", value: 67, decimals: 0, suffix: "M", label: "Gerados para clientes" },
  { prefix: "", value: 98, decimals: 0, suffix: "%", label: "Recomendam o método" },
]

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Logo */}
      <header className="flex h-[72px] shrink-0 items-center justify-center px-5 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO || "/placeholder.svg"} alt="Pro Growth Global" className="h-7 w-auto" />
      </header>

      {/* Conteúdo centralizado */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Selos */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A78BFA] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8B5CF6]" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#C4B5FD]">
                Processo seletivo aberto
              </span>
            </div>
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-[#3A3A3A] bg-[#1A1A1A] px-3.5 py-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Apenas maiores de 18 anos
              </span>
            </div>
          </div>

          <h1 className="text-center text-[28px] font-bold leading-[1.15] tracking-tight text-white text-balance sm:text-[32px]">
            Este formulário não é para todo mundo.
          </h1>

          <p className="mx-auto mt-5 max-w-sm text-center text-base leading-relaxed text-[#A3A3A3] text-pretty">
            É para maiores de 18 anos que já entenderam que dropshipping sem estrutura é dinheiro jogado fora — e
            querem entrar pelo caminho certo.
          </p>

          {/* Bloco de estatísticas roxo com contadores */}
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#7C3AED]/30 bg-gradient-to-br from-[#2A1650] via-[#1E1236] to-[#150C28] p-5 shadow-[0_0_40px_-12px_rgba(124,58,237,0.5)]">
            {/* brilho decorativo */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
            <div className="relative grid grid-cols-3 gap-2">
              {START_STATS.map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="text-[22px] font-bold leading-none tracking-tight text-white sm:text-[26px]">
                    <span className="text-[#C4B5FD]">{stat.prefix}</span>
                    <CountUp value={stat.value} decimals={stat.decimals} />
                    <span className="text-[#C4B5FD]">{stat.suffix}</span>
                  </div>
                  <span className="mt-2 text-[11px] font-medium leading-tight text-[#9CA3AF] text-pretty">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm leading-relaxed text-[#A3A3A3] text-pretty">
            Responda 7 perguntas rápidas. Nossa equipe analisa seu perfil e retorna pelo WhatsApp.
          </p>

          <button
            type="button"
            onClick={onStart}
            className="group mt-6 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(22,163,74,0.6)] transition-all hover:bg-[#15803D] active:scale-[0.99]"
          >
            Começar qualificação
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="mt-4 flex flex-col items-center gap-1 text-center text-[12px] text-[#525252]">
            <span className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Leva menos de 2 minutos. Seus dados estão seguros.
            </span>
            <span>Disponível apenas para maiores de 18 anos.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gate de idade — mesmo layout/estilo das etapas, porém sem barra de progresso nem contador de etapas
function AgeGateScreen({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-center border-b border-[#2A2A2A] px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO || "/placeholder.svg"} alt="Pro Growth Global" className="h-6 w-auto" />
      </header>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-16 pt-8">
        <div className="animate-[slideIn_0.35s_ease-out]">
          <div className="mb-6 flex w-fit items-center gap-1.5 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3.5 py-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-[#C4B5FD]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#C4B5FD]">
              Verificação de idade
            </span>
          </div>

          <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-balance">
            Você tem 18 anos ou mais?
          </h1>

          <div className="flex flex-col gap-2.5">
            <button type="button" onClick={onYes} className={cardClass(false)}>
              <span className="text-[15px] font-medium leading-snug">Sim, tenho 18 anos ou mais</span>
            </button>
            <button type="button" onClick={onNo} className={cardClass(false)}>
              <span className="text-[15px] font-medium leading-snug">Não, sou menor de 18 anos</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// Tela de encerramento para menores de 18 anos (redireciona à home em 8s)
function AgeRejectedScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0B0B] px-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO || "/placeholder.svg"} alt="Pro Growth Global" className="mb-8 h-6 w-auto opacity-80" />
      <p className="max-w-md text-lg font-medium leading-relaxed text-white text-balance">
        Nossa operação é destinada exclusivamente a maiores de 18 anos. Não podemos dar continuidade ao seu
        cadastro neste momento. Obrigado pelo interesse na Pro Growth Global.
      </p>
    </div>
  )
}

function TransitionScreen() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0B0B] px-8 text-center">
      <div className="mb-6 h-8 w-8 animate-spin rounded-full border-2 border-[#2A2A2A] border-t-[#16A34A]" />
      <p className="max-w-sm text-lg font-medium leading-relaxed text-white text-balance">
        Entendemos. Quando estiver pronto, nossa equipe estará aqui.
      </p>
    </div>
  )
}
