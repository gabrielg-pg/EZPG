import type { Metadata } from "next"
import { PesquisaJogosForm } from "@/components/pesquisa-jogos-form"

export const metadata: Metadata = {
  title: "Pesquisa de Jogos 2026 | AEESJB",
  description:
    "Vote nos jogos que você quer ver no campeonato municipal de São João Batista em 2026.",
}

export default function PesquisaJogosPublicPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <PesquisaJogosForm />
    </main>
  )
}
