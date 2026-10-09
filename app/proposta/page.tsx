import type { Metadata } from "next"
import { PropostaPublica } from "@/components/proposta-publica"
export const metadata: Metadata = { title: "Sua proposta | Pro Growth Global", description: "Sua proposta de estruturação pelo Método VÉRTEBRA.", robots: { index: false, follow: false }, openGraph: { title: "Sua proposta | Pro Growth Global", description: "Escolha o nível de estrutura da sua operação." } }
export default async function PropostaPage({ searchParams }:{searchParams:Promise<{n?:string}>}) { const params=await searchParams; const nome=(params.n||"").slice(0,30).replace(/[<>"'`]/g,""); return <PropostaPublica nome={nome}/> }
