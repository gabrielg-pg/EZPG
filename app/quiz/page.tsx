import { QuizFlow } from "@/components/quiz/quiz-flow"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Será que a Pro Growth é para você? | Avaliação",
  description:
    "Responda 7 perguntas rápidas e descubra o seu nível de prontidão para construir uma operação de e-commerce com a Pro Growth.",
}

export default function QuizPage() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <QuizFlow />
    </main>
  )
}
