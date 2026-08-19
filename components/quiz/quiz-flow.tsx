"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Loader2,
  CheckCircle2,
  Target,
} from "lucide-react"
import {
  QUIZ_QUESTIONS,
  MAX_SCORE,
  PROFILE_META,
  computeScore,
  getProfile,
  type QuizAnswers,
} from "@/lib/quiz"

const VSL_URL = process.env.NEXT_PUBLIC_VSL_URL || "https://progrowth-execucao.vercel.app/quem-somos"

type Screen = "start" | "warning" | "question" | "form" | "result"

export function QuizFlow() {
  const [screen, setScreen] = useState<Screen>("start")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "" })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const totalQuestions = QUIZ_QUESTIONS.length
  const currentQuestion = QUIZ_QUESTIONS[questionIndex]
  const progress = Math.round(((questionIndex + 1) / totalQuestions) * 100)

  function selectOption(value: string) {
    const updated = { ...answers, [currentQuestion.id]: value }
    setAnswers(updated)
    // Avança automaticamente após pequena pausa para feedback visual
    setTimeout(() => {
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((i) => i + 1)
      } else {
        setScreen("form")
      }
    }, 220)
  }

  function goBackFromQuestion() {
    if (questionIndex === 0) {
      setScreen("warning")
    } else {
      setQuestionIndex((i) => i - 1)
    }
  }

  function formatWhatsapp(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  async function handleSubmit() {
    setError("")
    if (form.nome.trim().length < 2) {
      setError("Digite seu nome completo.")
      return
    }
    const digits = form.whatsapp.replace(/\D/g, "")
    if (digits.length < 10) {
      setError("Digite um WhatsApp válido com DDD.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Digite um e-mail válido.")
      return
    }

    setSubmitting(true)
    const score = computeScore(answers)

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          whatsapp: digits,
          email: form.email.trim(),
          respostas: answers,
        }),
      })
    } catch {
      // Não bloqueia o lead caso o envio falhe — segue para o resultado
    }

    setFinalScore(score)
    setScreen("result")

    // Redireciona para a VSL em 2 segundos
    setTimeout(() => {
      window.location.href = VSL_URL
    }, 2000)
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
      {/* Marca */}
      <div className="mb-8 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        PRO GROWTH GLOBAL
      </div>

      {/* TELA INICIAL */}
      {screen === "start" && (
        <div className="w-full rounded-2xl border border-border bg-card/60 p-8 text-center backdrop-blur-sm md:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-500 text-white shadow-lg shadow-primary/25">
            <Target className="h-7 w-7" />
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Será que a Pro Growth é para você?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Responda 7 perguntas rápidas e descubra em menos de 2 minutos o seu nível de prontidão para construir uma
            operação de e-commerce lucrativa com a Pro Growth.
          </p>
          <Button
            size="lg"
            className="mt-8 w-full bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-blue-500/90 sm:w-auto sm:px-10"
            onClick={() => setScreen("warning")}
          >
            Começar Avaliação
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">Leva menos de 2 minutos • 100% gratuito</p>
        </div>
      )}

      {/* TELA DE AVISO */}
      {screen === "warning" && (
        <div className="w-full rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm md:p-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Antes de começar, seja honesto(a)</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
            <p>
              A Pro Growth <span className="font-semibold text-foreground">não promete dinheiro rápido</span> nem
              esquemas milagrosos. Construímos operações de e-commerce reais, que exigem capital, dedicação e execução
              consistente.
            </p>
            <p>
              Esta avaliação existe para entendermos o seu momento e verificar se faz sentido seguirmos juntos. Não há
              resposta certa ou errada — responda com sinceridade.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="border-border bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground sm:flex-1"
              onClick={() => setScreen("start")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-blue-500/90 sm:flex-1"
              onClick={() => {
                setQuestionIndex(0)
                setScreen("question")
              }}
            >
              Continuar
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* TELA DAS PERGUNTAS */}
      {screen === "question" && (
        <div className="w-full">
          {/* Progresso */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Pergunta {questionIndex + 1} de {totalQuestions}
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm md:p-8">
            <h2 className="text-balance text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {currentQuestion.title}
            </h2>
            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((opt) => {
                const selected = answers[currentQuestion.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => selectOption(opt.value)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-4 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                        : "border-border bg-white/[0.02] hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground md:text-base">{opt.label}</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        selected ? "border-primary bg-primary text-white" : "border-border text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-6">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:bg-white/5 hover:text-foreground"
                onClick={goBackFromQuestion}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TELA DO FORMULÁRIO */}
      {screen === "form" && (
        <div className="w-full rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm md:p-10">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">Quase lá!</h2>
          <p className="mx-auto mt-2 max-w-sm text-center leading-relaxed text-muted-foreground">
            Preencha seus dados para ver o seu resultado e liberar o próximo passo.
          </p>

          <div className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-sm text-muted-foreground">
                Nome completo
              </Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Seu nome"
                className="border-border bg-white/[0.03] text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="text-sm text-muted-foreground">
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: formatWhatsapp(e.target.value) }))}
                placeholder="(11) 99999-9999"
                className="border-border bg-white/[0.03] text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="voce@email.com"
                className="border-border bg-white/[0.03] text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              disabled={submitting}
              className="border-border bg-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground sm:flex-1"
              onClick={() => {
                setQuestionIndex(totalQuestions - 1)
                setScreen("question")
              }}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Voltar
            </Button>
            <Button
              size="lg"
              disabled={submitting}
              className="bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-blue-500/90 sm:flex-[2]"
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Ver meu resultado
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* TELA DE RESULTADO */}
      {screen === "result" && (
        <ResultScreen score={finalScore} />
      )}
    </div>
  )
}

function ResultScreen({ score }: { score: number }) {
  const profile = PROFILE_META[getProfile(score)]
  const pct = Math.round((score / MAX_SCORE) * 100)

  return (
    <div className="w-full rounded-2xl border border-border bg-card/60 p-8 text-center backdrop-blur-sm md:p-10">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Seu resultado</p>

      <div className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={profile.hex}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 276.46} 276.46`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">de {MAX_SCORE}</span>
        </div>
      </div>

      <div
        className={`mx-auto mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${profile.color} ${profile.bg}`}
      >
        <span className={`h-2 w-2 rounded-full ${profile.dot}`} />
        {profile.label}
      </div>

      <p className="mx-auto mt-4 max-w-sm text-pretty leading-relaxed text-muted-foreground">{profile.description}</p>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecionando para o próximo passo...
      </div>
    </div>
  )
}
