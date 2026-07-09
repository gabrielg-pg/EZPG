"use client"

import type { ReactNode } from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Check, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react"
import { createPartialLead, updateLeadProgress } from "@/app/actions/leads-actions"

const WHATSAPP_LINK = "https://wa.link/a571wz"
const SITE_LINK = "https://progrowthglobal.com.br/"
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
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [shake, setShake] = useState(false)
  const [showWhats, setShowWhats] = useState(false)
  const [disqualifying, setDisqualifying] = useState(false)
  const formStarted = useRef(false)

  // FormStart (uma vez)
  useEffect(() => {
    if (!formStarted.current) {
      formStarted.current = true
      track("trackCustom", "FormStart")
    }
  }, [])

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
  const handleCapital = async (value: string, disqualify?: boolean) => {
    setForm((f) => ({ ...f, capital: value }))
    if (disqualify) {
      setDisqualifying(true)
      track("trackCustom", "LeadDesqualificado")
      if (leadId) {
        await updateLeadProgress(leadId, { capital: "sem_capital", status: "desqualificado" })
      }
      setTimeout(() => {
        window.location.href = SITE_LINK
      }, 1500)
      return
    }
    if (leadId) await updateLeadProgress(leadId, { capital: value })
    setStep(6)
  }

  // Step 4: experiência
  const handleExperiencia = async (value: string) => {
    setForm((f) => ({ ...f, experiencia: value }))
    if (leadId) await updateLeadProgress(leadId, { experiencia: value })
    setStep(5)
  }

  // Step 6 → 7: prazo + qualificação final
  const handlePrazo = async (value: string) => {
    setForm((f) => ({ ...f, prazo: value }))
    setSaving(true)
    if (leadId) await updateLeadProgress(leadId, { prazo: value, status: "qualificado" })
    setSaving(false)
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
