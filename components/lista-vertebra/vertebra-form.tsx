"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ArrowLeft, ArrowRight, ShieldCheck, Check, Lock } from "lucide-react"
import {
  createVertebraLead,
  updateVertebraLeadProgress,
} from "@/app/actions/vertebra-actions"
import { PLANOS_VERTEBRA, FORMAS_PAGAMENTO, RESERVA_CHECKOUT } from "@/lib/vertebra"

const LOGO = "https://progrowthglobal.com.br/wp-content/uploads/2025/07/logo-pro-growth-horizontal.svg"
const PURPLE = "#7B2FBE"
const TOTAL_STEPS = 4

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

type FormData = {
  nome: string
  whatsapp: string
  planoId: string
  formaId: string
}

const EMPTY: FormData = { nome: "", whatsapp: "", planoId: "", formaId: "" }

export function VertebraForm({
  vagasTotal,
  vagasRestantes,
}: {
  vagasTotal: number
  vagasRestantes: number
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [leadId, setLeadId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [shake, setShake] = useState(false)

  const plano = PLANOS_VERTEBRA.find((p) => p.id === form.planoId) ?? null
  const forma = FORMAS_PAGAMENTO.find((f) => f.id === form.formaId) ?? null

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  // Etapa 1 → salva lead parcial (nome + WhatsApp)
  const handleContactSubmit = async () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (form.nome.trim().length < 3) newErrors.nome = "Informe seu nome completo."
    if (form.whatsapp.replace(/\D/g, "").length !== 11) newErrors.whatsapp = "Informe um WhatsApp válido com DDD."
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      triggerShake()
      return
    }
    setErrors({})
    setSaving(true)
    const result = await createVertebraLead({ nome: form.nome, whatsapp: form.whatsapp })
    setSaving(false)
    if (result.success && result.id) {
      setLeadId(result.id)
      setStep(2)
    } else {
      setErrors({ whatsapp: result.error || "Erro ao salvar. Tente novamente." })
      triggerShake()
    }
  }

  const handlePlanoContinue = () => {
    if (!plano) return triggerShake()
    if (leadId) void updateVertebraLeadProgress(leadId, { plano: plano.nome, plano_preco: plano.preco })
    setStep(3)
  }

  const handleFormaContinue = () => {
    if (!forma) return triggerShake()
    if (leadId)
      void updateVertebraLeadProgress(leadId, { forma_pagamento: `${forma.titulo} — ${forma.descricao}` })
    setStep(4)
  }

  const handleReserva = () => {
    window.location.href = RESERVA_CHECKOUT
  }

  if (step === 0) {
    return (
      <ScarcityScreen
        vagasTotal={vagasTotal}
        vagasRestantes={vagasRestantes}
        onStart={() => setStep(1)}
      />
    )
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center justify-center border-b border-[#1E1E2E] px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO || "/placeholder.svg"} alt="Pro Growth Global" className="h-6 w-auto" />
      </header>

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-[#141422]">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: PURPLE }}
        />
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-[140px] pt-8">
        <div key={step} className="animate-[slideIn_0.35s_ease-out]">
          <p className="mb-2 text-sm font-medium text-[#5B5B6E]">
            Etapa {step} de {TOTAL_STEPS}
          </p>

          {step === 1 && (
            <div>
              <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-balance">
                Vamos começar.
              </h1>
              <div className="flex flex-col gap-4">
                <Field label="Nome completo" error={errors.nome}>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    placeholder="Seu nome completo"
                    className={inputClass(!!errors.nome)}
                  />
                </Field>
                <Field label="WhatsApp com DDD" error={errors.whatsapp}>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    className={inputClass(!!errors.whatsapp)}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-balance">
                Qual plano combina com sua operação?
              </h1>
              <div className="flex flex-col gap-2.5">
                {PLANOS_VERTEBRA.map((p) => {
                  const selected = form.planoId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, planoId: p.id }))}
                      className={planCardClass(selected)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[15px] font-bold leading-snug">{p.nome}</span>
                            <span className="text-[15px] font-bold" style={{ color: PURPLE }}>
                              {p.preco}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13px] leading-snug text-[#9A9AAE]">{p.descricao}</p>
                        </div>
                        {selected && <CheckDot />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-balance">
                Como você prefere pagar o restante?
              </h1>
              <div className="flex flex-col gap-2.5">
                {FORMAS_PAGAMENTO.map((f) => {
                  const selected = form.formaId === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, formaId: f.id }))}
                      className={planCardClass(selected)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[15px] font-semibold leading-snug">{f.titulo}</span>
                          <p className="mt-1 text-[13px] leading-snug text-[#9A9AAE]">{f.descricao}</p>
                        </div>
                        {selected && <CheckDot />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-balance">
                Falta um passo para garantir sua vaga.
              </h1>
              <p className="mb-6 text-[15px] leading-relaxed text-[#B4B4C4] text-pretty">
                Para assegurar seu lugar neste ciclo, é necessário um sinal de reserva no valor de R$250,00 —
                valor abatido do total do plano escolhido no momento da contratação. Sem esse passo, a vaga
                permanece disponível para outros leads em negociação.
              </p>

              <div className="rounded-2xl border border-[#26263A] bg-[#0E0E1C] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5B5B6E]">
                  Resumo da sua escolha
                </p>
                <div className="flex items-center justify-between gap-3 border-b border-[#1E1E2E] pb-3">
                  <span className="text-sm text-[#9A9AAE]">Plano selecionado</span>
                  <span className="text-right text-sm font-semibold">
                    {plano ? `${plano.nome} — ${plano.preco}` : "Não selecionado"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-3">
                  <span className="text-sm text-[#9A9AAE]">Forma de pagamento</span>
                  <span className="text-right text-sm font-semibold">{forma ? forma.titulo : "Não selecionada"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions (fixas) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-[#1E1E2E] bg-[#07070F]/95 px-5 pb-6 pt-4 backdrop-blur">
        <div className="mx-auto w-full max-w-lg">
          {step === 4 ? (
            <button
              type="button"
              onClick={handleReserva}
              className={`flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(22,163,74,0.6)] transition-colors hover:bg-[#15803D] ${
                shake ? "animate-[shake_0.4s]" : ""
              }`}
            >
              <Lock className="h-4 w-4" />
              Garantir minha vaga — R$250,00
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (step === 1) handleContactSubmit()
                else if (step === 2) handlePlanoContinue()
                else if (step === 3) handleFormaContinue()
              }}
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${
                shake ? "animate-[shake_0.4s]" : ""
              }`}
              style={{ backgroundColor: PURPLE }}
            >
              {saving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  Continuar <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
          {step >= 2 && (
            <button
              type="button"
              onClick={goBack}
              className="mx-auto mt-3 flex items-center gap-1.5 text-sm text-[#8A8A9E] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
      `}</style>
    </div>
  )
}

// ---------- Etapa 0: Escassez ----------

function ScarcityScreen({
  vagasTotal,
  vagasRestantes,
  onStart,
}: {
  vagasTotal: number
  vagasRestantes: number
  onStart: () => void
}) {
  const preenchidas = Math.max(0, vagasTotal - vagasRestantes)
  const pct = vagasTotal > 0 ? Math.round((preenchidas / vagasTotal) * 100) : 0

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex h-[72px] shrink-0 items-center justify-center px-5 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO || "/placeholder.svg"} alt="Pro Growth Global" className="h-7 w-auto" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Badge */}
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5"
            style={{ borderColor: `${PURPLE}55`, backgroundColor: `${PURPLE}1A` }}>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: PURPLE }} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#C9AEE8]">
              Vagas do próximo ciclo — Pro Growth Global
            </span>
          </div>

          <h1 className="text-center text-[28px] font-bold leading-[1.15] tracking-tight text-balance sm:text-[32px]">
            De {vagasTotal} vagas mensais, restam apenas {vagasRestantes}.
          </h1>

          <p className="mx-auto mt-5 max-w-sm text-center text-[15px] leading-relaxed text-[#9A9AAE] text-pretty">
            Realizamos apenas {vagasTotal} projetos por mês, de forma totalmente exclusiva, para manter o padrão
            de estruturação e acompanhamento em cada operação.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-center text-[15px] leading-relaxed text-[#9A9AAE] text-pretty">
            Essa é a sua chance de ter uma operação de dropshipping estruturada com o Método VÉRTEBRA™ — no
            Brasil ou globalmente. O resultado depende de você dar o próximo passo.
          </p>

          {/* Contador + barra */}
          <div className="mt-8 rounded-2xl border border-[#26263A] bg-[#0E0E1C] p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-[#9A9AAE]">Vagas disponíveis</span>
              <span className="text-lg font-bold">
                <span style={{ color: PURPLE }}>{vagasRestantes}</span>
                <span className="text-[#5B5B6E]"> de {vagasTotal}</span>
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#1E1E2E]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: PURPLE }}
              />
            </div>
            <p className="mt-2 text-xs text-[#5B5B6E]">{preenchidas} de {vagasTotal} vagas já preenchidas neste ciclo</p>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="group mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(123,47,190,0.6)] transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ backgroundColor: PURPLE }}
          >
            Quero garantir minha vaga
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#5B5B6E]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Seus dados estão seguros. Leva menos de 1 minuto.
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Helpers de UI ----------

function planCardClass(selected: boolean): string {
  return [
    "w-full rounded-xl border px-5 py-4 text-left transition-all duration-100",
    selected ? "border-[#7B2FBE] bg-[rgba(123,47,190,0.14)]" : "border-[#26263A] bg-[#12121F] hover:bg-[#181828]",
  ].join(" ")
}

function CheckDot() {
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: PURPLE }}
    >
      <Check className="h-4 w-4 text-white" />
    </span>
  )
}

function inputClass(hasError: boolean): string {
  return [
    "h-[52px] w-full rounded-xl border bg-[#12121F] px-4 text-[15px] text-white placeholder:text-[#5B5B6E] outline-none transition-colors",
    hasError ? "border-[#EF4444]" : "border-[#26263A] focus:border-[#7B2FBE]",
  ].join(" ")
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#9A9AAE]">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
}
