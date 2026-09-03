"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  VERTEBRA_QUESTIONS,
  VERTEBRA_QUESTION_ORDER,
  type VertebraAnswerKey,
  type VertebraAnswers,
  type VertebraQuestion,
} from "@/lib/metodo-vertebra"
import { submitVertebraLead } from "@/app/actions/metodo-vertebra-actions"
import {
  trackFunnelEntry,
  trackFunnelStep,
  trackQuizAnswer,
  trackVideoStart,
  trackLeadCapture,
  trackFunnelComplete,
} from "@/lib/tracking"

const VSL_URL = "https://progrowth-execucao.vercel.app/quem-somos"
const PURPLE = "#6B21A8"

// Identificação do funil no GA4 / Meta Pixel
const FUNNEL_NAME = "Funil 4 - Método VÉRTEBRA"
const FUNNEL_NUMBER = 4

// Rótulos legíveis de cada pergunta (para os eventos de etapa)
const QUESTION_STEP_LABELS: Record<VertebraAnswerKey, string> = {
  target_income: "Meta de renda",
  gender: "Gênero",
  employment_status: "Situação atual",
  current_income: "Renda atual",
  affirmation_1: "Afirmação 1",
  affirmation_2: "Afirmação 2",
  affirmation_3: "Afirmação 3",
  available_time: "Tempo disponível",
  main_blocker: "Maior trava",
  income_use_case: "Uso da renda",
}

// Nome legível de cada tela (mapeamento completo do funil para o GA4)
function stepLabel(step: StepKind): string {
  switch (step.kind) {
    case "question": {
      const n = VERTEBRA_QUESTION_ORDER.indexOf(step.key) + 1
      return `Pergunta ${n} - ${QUESTION_STEP_LABELS[step.key]}`
    }
    case "mecanismo":
      return "Mecanismo de Troca"
    case "method":
      return "Método VÉRTEBRA"
    case "social":
      return "Prova Social"
    case "authority":
      return "Autoridade"
    case "approval":
      return "Aprovação"
    case "result":
      return "Resultado Personalizado"
    case "contact":
      return "Captura de Contato"
    case "redirect":
      return "Redirect VSL"
  }
}

// Sequência completa das 16 telas
type StepKind =
  | { kind: "question"; key: VertebraAnswerKey } // telas de escolha
  | { kind: "mecanismo" } // tela do mecanismo de troca (antes do método)
  | { kind: "method" } // tela 5
  | { kind: "social" } // tela 9
  | { kind: "authority" } // tela 13
  | { kind: "approval" } // tela 14
  | { kind: "result" } // tela 15
  | { kind: "contact" } // tela extra (antes da VSL)
  | { kind: "redirect" } // tela 16

const STEPS: StepKind[] = [
  { kind: "question", key: "target_income" }, // 1
  { kind: "question", key: "gender" }, // 2
  { kind: "question", key: "employment_status" }, // 3
  { kind: "question", key: "current_income" }, // 4
  { kind: "mecanismo" }, // mecanismo de troca
  { kind: "method" }, // 5
  { kind: "question", key: "affirmation_1" }, // 6
  { kind: "question", key: "affirmation_2" }, // 7
  { kind: "question", key: "affirmation_3" }, // 8
  { kind: "social" }, // 9
  { kind: "question", key: "available_time" }, // 10
  { kind: "question", key: "main_blocker" }, // 11
  { kind: "question", key: "income_use_case" }, // 12
  { kind: "authority" }, // 13
  { kind: "approval" }, // 14
  { kind: "result" }, // 15
  { kind: "contact" }, // contato
  { kind: "redirect" }, // 16
]

export function VertebraFlow() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<VertebraAnswers>({})
  const [animKey, setAnimKey] = useState(0)

  const step = STEPS[stepIndex]
  const totalSteps = STEPS.length

  // progresso visual (1..100)
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100)

  // Entrada no funil (dispara uma única vez)
  useEffect(() => {
    trackFunnelEntry(FUNNEL_NAME, FUNNEL_NUMBER)
  }, [])

  // Visualização de cada tela — mapeia todas as etapas no GA4, sem furos
  useEffect(() => {
    trackFunnelStep(FUNNEL_NAME, FUNNEL_NUMBER, stepIndex + 1, stepLabel(STEPS[stepIndex]))
  }, [stepIndex])

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    setAnimKey((k) => k + 1)
  }, [])

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0))
    setAnimKey((k) => k + 1)
  }, [])

  const handleAnswer = useCallback(
    (key: VertebraAnswerKey, value: string) => {
      setAnswers((prev) => ({ ...prev, [key]: value }))
      // evento de resposta (quiz_answer) com o número da pergunta na sequência
      const questionNumber = VERTEBRA_QUESTION_ORDER.indexOf(key) + 1
      trackQuizAnswer(FUNNEL_NAME, questionNumber, value)
      // pequeno atraso para o usuário ver a seleção antes de avançar
      window.setTimeout(() => goNext(), 220)
    },
    [goNext],
  )

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-white to-violet-50 text-slate-900">
      {/* Barra de topo com logo + progresso */}
      <header className="sticky top-0 z-20 border-b border-violet-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <Image
            src="https://i.imgur.com/jfNDVLp.png"
            alt="Pro Growth Global"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%`, backgroundColor: PURPLE }}
              />
            </div>
          </div>
          <span className="w-10 text-right text-xs font-semibold tabular-nums text-violet-700">
            {progress}%
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-4 pb-16 pt-8">
        <div key={animKey} className="animate-vertebra-in">
          {step.kind === "question" && (
            <QuestionScreen
              question={VERTEBRA_QUESTIONS[step.key]}
              selected={answers[step.key]}
              onSelect={handleAnswer}
              onBack={stepIndex > 0 ? goBack : undefined}
            />
          )}
          {step.kind === "mecanismo" && <MecanismoScreen onNext={goNext} onBack={goBack} />}
          {step.kind === "method" && <MethodScreen onNext={goNext} onBack={goBack} />}
          {step.kind === "social" && <SocialProofScreen onNext={goNext} onBack={goBack} />}
          {step.kind === "authority" && <AuthorityScreen onNext={goNext} onBack={goBack} />}
          {step.kind === "approval" && <ApprovalScreen onNext={goNext} />}
          {step.kind === "result" && (
            <ResultScreen answers={answers} onNext={goNext} />
          )}
          {step.kind === "contact" && (
            <ContactScreen answers={answers} onDone={goNext} />
          )}
          {step.kind === "redirect" && <RedirectScreen />}
        </div>
      </main>

      <style jsx global>{`
        @keyframes vertebraIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-vertebra-in {
          animation: vertebraIn 380ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}

/* ---------------- Telas de pergunta ---------------- */

function QuestionScreen({
  question,
  selected,
  onSelect,
  onBack,
}: {
  question: VertebraQuestion
  selected?: string
  onSelect: (key: VertebraAnswerKey, value: string) => void
  onBack?: () => void
}) {
  return (
    <div>
      {onBack && <BackButton onClick={onBack} />}
      <h1 className="text-balance font-poppins text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
        {question.title}
      </h1>
      {question.subtitle && (
        <p className="mt-2 text-pretty text-sm text-slate-500">{question.subtitle}</p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        {question.options.map((opt) => {
          const isActive = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(question.key, opt.value)}
              className={`group flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-violet-600 bg-violet-50 shadow-md shadow-violet-200"
                  : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
              }`}
            >
              {opt.emoji && <span className="text-2xl leading-none">{opt.emoji}</span>}
              <span className="flex-1 font-medium text-slate-800">{opt.label}</span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  isActive ? "border-violet-600 bg-violet-600" : "border-slate-300 group-hover:border-violet-400"
                }`}
              >
                {isActive && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Tela: Mecanismo de Troca ---------------- */

function MecanismoScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [playing, setPlaying] = useState(false)
  const videoId = "iO8NRnadk9g"

  return (
    <div>
      <BackButton onClick={onBack} />

      <p className="text-pretty text-sm font-semibold text-slate-500">
        7 a cada 10 pessoas vão se aposentar ganhando{" "}
        <span className="text-violet-700">menos de 2 salários mínimos</span>.
      </p>
      <p className="mt-4 text-sm text-slate-400">E isso tem um nome...</p>
      <h1 className="mt-1 text-balance font-poppins text-3xl font-extrabold leading-tight tracking-tight text-violet-700">
        MECANISMO DE TROCA
      </h1>
      <p className="mt-3 text-pretty text-[15px] leading-relaxed text-slate-600">
        Você passa a vida toda trocando o ativo mais valioso da sua vida{" "}
        <span className="italic">(seu tempo)</span> por{" "}
        <span className="font-semibold text-slate-800">migalhas</span>.
      </p>

      {/* Ilustração do mecanismo */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-lg shadow-violet-100">
        <Image
          src="/mecanismo-de-troca.png"
          alt="Ilustração do Mecanismo de Troca: tempo entrando na esteira e saindo em migalhas"
          width={1280}
          height={720}
          className="h-auto w-full"
          priority
        />
      </div>

      <p className="mt-6 text-pretty text-[15px] leading-relaxed text-slate-600">
        Mas existe um jeito real de{" "}
        <span className="font-bold text-slate-900">sair desse mecanismo</span>. É exatamente isso que
        você vai entender com seu <span className="font-bold text-violet-700">plano personalizado</span>.
      </p>

      {/* Depoimento em vídeo (YouTube inline, não expande) */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Depoimento de um dos nossos clientes que usa o{" "}
          <span className="text-violet-700">Método VÉRTEBRA</span> 👇
        </p>
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-violet-100 bg-black shadow-lg shadow-violet-100">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&fs=0&playsinline=1`}
              title="Depoimento de aluno — Sistema de Repasse"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setPlaying(true)
                trackVideoStart("Depoimento Aluno - Método VÉRTEBRA", FUNNEL_NAME)
              }}
              aria-label="Reproduzir depoimento"
              className="group absolute inset-0 h-full w-full"
            >
              <Image
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Miniatura do depoimento em vídeo"
                fill
                className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                sizes="(max-width: 640px) 100vw, 576px"
                unoptimized
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/15">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 text-violet-700" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      <PrimaryButton onClick={onNext} className="mt-8">
        QUERO SAIR DESSE MECANISMO →
      </PrimaryButton>
    </div>
  )
}

/* ---------------- Tela 5: Método ---------------- */

function MethodScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <h1 className="font-poppins text-3xl font-extrabold leading-tight tracking-tight">
        MÉTODO VÉRTEBRA™
      </h1>
      <p className="mt-2 text-pretty text-sm text-slate-500">
        O sistema que estrutura sua operação para gerar renda consistente — mesmo começando do zero.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100">
        <div className="bg-gradient-to-br from-violet-700 to-violet-900 px-6 py-8 text-center text-white">
          <p className="text-xs uppercase tracking-widest text-violet-200">Total de vendas</p>
          <p className="mt-1 font-poppins text-4xl font-extrabold">R$ 3.197,37</p>
          <p className="mt-1 text-xs text-violet-200">em um único dia de operação estruturada</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {[
            { t: "Renda consistente", d: "Previsibilidade no seu faturamento" },
            { t: "Apenas 2h/dia", d: "Sem abrir mão da sua rotina" },
            { t: "Sem sair de casa", d: "100% online, do seu jeito" },
          ].map((item) => (
            <li key={item.t} className="flex items-center gap-3 px-6 py-4">
              <CheckBadge />
              <div>
                <p className="font-semibold text-slate-800">{item.t}</p>
                <p className="text-xs text-slate-500">{item.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <PrimaryButton onClick={onNext} className="mt-8">
        CONTINUAR →
      </PrimaryButton>
    </div>
  )
}

/* ---------------- Tela 9: Prova social ---------------- */

function SocialProofScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="text-center">
      <div className="flex justify-start">
        <BackButton onClick={onBack} />
      </div>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
        📈
      </div>
      <h1 className="mt-5 text-balance font-poppins text-2xl font-bold leading-tight sm:text-3xl">
        Suas respostas batem com{" "}
        <span className="text-violet-700">+2.157 operações estruturadas</span>
      </h1>
      <div className="mt-6 rounded-3xl bg-gradient-to-br from-violet-700 to-violet-900 px-6 py-10 text-white">
        <p className="text-xs uppercase tracking-widest text-violet-200">Gerados pelo MÉTODO VÉRTEBRA™</p>
        <p className="mt-1 font-poppins text-5xl font-extrabold">+R$ 67M</p>
      </div>
      <PrimaryButton onClick={onNext} className="mt-8">
        SIM! FALA LOGO →
      </PrimaryButton>
    </div>
  )
}

/* ---------------- Tela 13: Autoridade ---------------- */

function AuthorityScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100">
        <div className="flex items-center gap-4 p-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
            <Image
              src="/alisson-founder.jpg"
              alt="Alisson Jordi Wisenteiner, founder da Pro Growth Global"
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-poppins text-xl font-bold leading-tight tracking-tight">
              Alisson Jordi Wisenteiner
            </h1>
            <p className="text-sm text-slate-500">Founder — Pro Growth Global</p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat big="+2.157" small="alunos" />
            <Stat big="+R$ 67M" small="gerados" />
            <Stat big="+15 anos" small="experiência" />
          </div>
        </div>
      </div>

      {/* Bloco de história */}
      <div className="mt-5 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
          Minha história
        </span>
        <div className="mt-4 space-y-4 text-pretty text-[15px] leading-relaxed text-slate-600">
          <p>
            Comecei a trabalhar aos 14 anos. Montador de calçado numa esteira, chão de fábrica.
            Enquanto os amigos jogavam bola, eu cumpria turno.
          </p>
          <p>
            Decidi estudar comércio exterior. Saí da esteira. Entrei em empresas de importação e
            exportação.
          </p>
          <p>
            Foi ali que descobri o dropshipping, numa época em que ninguém falava nisso no Brasil.
            Sem curso. Sem mentor. Só o mesmo raciocínio que me tirou da linha de produção.
          </p>
          <p>
            Anos operando, testando, ajustando. Até entender que o problema nunca foi o modelo. Era
            quem operava sem entender o próprio processo. Igual eu, antes, na esteira.
          </p>
        </div>

        <blockquote className="mt-5 rounded-2xl border-l-4 border-violet-500 bg-violet-50 px-5 py-4">
          <p className="text-pretty text-[15px] font-medium italic leading-relaxed text-violet-900">
            &quot;Quem não entende o processo, nunca sai da linha de produção. Quem entende, constrói a
            própria esteira.&quot;
          </p>
          <cite className="mt-2 block text-sm font-semibold not-italic text-violet-700">
            Alisson Jordi
          </cite>
        </blockquote>

        <p className="mt-5 text-pretty text-[15px] font-medium leading-relaxed text-slate-700">
          Foi daí que nasceu o <span className="font-bold text-violet-700">Método VÉRTEBRA™</span>. E
          foi daí que nasceu a <span className="font-bold text-violet-700">Pro Growth Global</span>.
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Sua jornada</span>
          <span className="text-violet-700">77%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
          <div className="h-full rounded-full bg-violet-700 transition-all duration-700" style={{ width: "77%" }} />
        </div>
      </div>

      <PrimaryButton onClick={onNext} className="mt-8">
        CONTINUAR →
      </PrimaryButton>
    </div>
  )
}

/* ---------------- Tela 14: Aprovação automática ---------------- */

function ApprovalScreen({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<"loading" | "done">("loading")

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("done"), 2000)
    const t2 = window.setTimeout(() => onNext(), 3600)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [onNext])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {phase === "loading" ? (
        <>
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
          <p className="mt-6 font-poppins text-xl font-semibold text-slate-700">
            Analisando suas respostas...
          </p>
          <p className="mt-1 text-sm text-slate-400">Cruzando seu perfil com o Método VÉRTEBRA™</p>
        </>
      ) : (
        <div className="animate-vertebra-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-6 py-4">
            <p className="font-poppins text-lg font-bold text-green-800">
              ✓ Seu perfil foi APROVADO
            </p>
          </div>
          <p className="mt-5 text-pretty text-slate-600">
            Você está entre os <span className="font-bold text-violet-700">TOP 3%</span>
          </p>
          <p className="text-sm text-slate-500">
            O <span className="font-semibold">MÉTODO VÉRTEBRA™</span> é o seu match.
          </p>
        </div>
      )}
    </div>
  )
}

/* ---------------- Tela 15: Resultado personalizado ---------------- */

function ResultScreen({ answers, onNext }: { answers: VertebraAnswers; onNext: () => void }) {
  const cards = useMemo(() => {
    const nicho = "E-commerce estruturado"
    const meta =
      answers.target_income === "acima_25k"
        ? "Acima de R$ 25k/dia"
        : answers.target_income === "10k_25k"
          ? "R$ 10k – 25k/dia"
          : answers.target_income === "5k_10k"
            ? "R$ 5k – 10k/dia"
            : "R$ 2.5k – 5k/dia"
    const sonho =
      answers.income_use_case === "largar_clt"
        ? "Largar o CLT"
        : answers.income_use_case === "viajar"
          ? "Viajar mais"
          : answers.income_use_case === "comprar_casa"
            ? "Comprar a casa"
            : answers.income_use_case === "ajudar_familia"
              ? "Ajudar a família"
              : "Liberdade financeira"
    return [
      { label: "Nicho", value: nicho, emoji: "🎯" },
      { label: "Meta", value: meta, emoji: "🚀" },
      { label: "Sonho", value: sonho, emoji: "✨" },
      { label: "Possibilidade", value: "Alta compatibilidade", emoji: "🔓" },
    ]
  }, [answers])

  return (
    <div>
      <h1 className="text-balance font-poppins text-2xl font-bold leading-tight sm:text-3xl">
        Você já sente o peso do 🔐 MÉTODO VÉRTEBRA™ 🔐
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <MiniMetric big="62%" small="Score" />
        <MiniMetric big="+R$ 3.242" small="por semana" />
        <MiniMetric big="7 dias" small="de aplicação" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.emoji}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                {c.label}
              </span>
            </div>
            <p className="mt-2 text-pretty font-semibold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext} className="mt-8">
        CONTINUAR →
      </PrimaryButton>
    </div>
  )
}

/* ---------------- Tela de contato (antes da VSL) ---------------- */

function ContactScreen({ answers, onDone }: { answers: VertebraAnswers; onDone: () => void }) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = nome.trim().length >= 2 && whatsapp.replace(/\D/g, "").length >= 10

  function formatWhatsapp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  async function handleSubmit() {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const utm = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
    const res = await submitVertebraLead({
      nome: nome.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      respostas: answers,
      utm_source: utm?.get("utm_source") ?? null,
      utm_medium: utm?.get("utm_medium") ?? null,
      utm_campaign: utm?.get("utm_campaign") ?? null,
    })
    if (res.ok) {
      // conversão: lead capturado via formulário (GA generate_lead + Meta Lead)
      trackLeadCapture(FUNNEL_NAME, FUNNEL_NUMBER)
      onDone()
    } else {
      setError(res.error ?? "Erro ao enviar. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div>
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
        Último passo
      </span>
      <h1 className="mt-3 text-balance font-poppins text-2xl font-bold leading-tight sm:text-3xl">
        Para onde enviamos seu acesso?
      </h1>
      <p className="mt-2 text-pretty text-sm text-slate-500">
        Preencha para liberar sua apresentação personalizada do Método VÉRTEBRA™.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Field label="Seu nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-violet-500"
          />
        </Field>
        <Field label="Seu melhor e-mail (opcional)">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="email@dominio.com"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-violet-500"
          />
        </Field>
        <Field label="WhatsApp">
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
            inputMode="tel"
            placeholder="(11) 99999-9999"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-colors focus:border-violet-500"
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <PrimaryButton onClick={handleSubmit} disabled={!canSubmit || loading} className="mt-6">
        {loading ? "ENVIANDO..." : "LIBERAR MINHA APRESENTAÇÃO →"}
      </PrimaryButton>
      <p className="mt-3 text-center text-xs text-slate-400">
        🔒 Seus dados estão seguros e não serão compartilhados.
      </p>
    </div>
  )
}

/* ---------------- Tela 16: Redirect VSL ---------------- */

function RedirectScreen() {
  useEffect(() => {
    // conclusão do funil: usuário concluiu e será levado para a VSL
    trackFunnelComplete(FUNNEL_NAME, FUNNEL_NUMBER)
    const t = window.setTimeout(() => {
      window.location.href = VSL_URL
    }, 1500)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-200 border-t-violet-700" />
      <p className="mt-6 font-poppins text-xl font-semibold text-slate-700">
        Preparando sua apresentação...
      </p>
      <p className="mt-1 text-sm text-slate-400">Você será redirecionado em instantes.</p>
      <a
        href={VSL_URL}
        className="mt-8 inline-flex w-full max-w-sm items-center justify-center rounded-2xl px-6 py-4 font-poppins font-bold text-white shadow-lg shadow-violet-300 transition-transform active:scale-[0.98]"
        style={{ backgroundColor: PURPLE }}
      >
        VER VSL E PLANO →
      </a>
    </div>
  )
}

/* ---------------- Componentes auxiliares ---------------- */

function PrimaryButton({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 font-poppins text-base font-bold text-white shadow-lg shadow-violet-300 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ backgroundColor: PURPLE }}
    >
      {children}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-violet-700"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Voltar
    </button>
  )
}

function CheckBadge() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-700" fill="none" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="rounded-xl bg-violet-50 px-2 py-3">
      <p className="font-poppins text-base font-extrabold text-violet-800">{big}</p>
      <p className="text-[11px] text-slate-500">{small}</p>
    </div>
  )
}

function MiniMetric({ big, small }: { big: string; small: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-violet-900 px-2 py-4 text-center text-white">
      <p className="font-poppins text-lg font-extrabold leading-none">{big}</p>
      <p className="mt-1 text-[11px] text-violet-200">{small}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}
