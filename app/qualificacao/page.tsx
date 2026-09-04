import { Suspense } from "react"
import { QualificationForm } from "@/components/qualificacao/qualification-form"

export const dynamic = "force-dynamic"

export default function QualificacaoPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0B0B0B] text-white" style={{ backgroundImage: "none" }}>
      <Suspense
        fallback={
          <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B0B0B]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2A2A2A] border-t-[#16A34A]" />
          </div>
        }
      >
        <QualificationForm />
      </Suspense>
    </main>
  )
}
