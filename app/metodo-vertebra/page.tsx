import type { Metadata } from "next"
import { VertebraFlow } from "@/components/metodo-vertebra/vertebra-flow"

export const metadata: Metadata = {
  title: "Método VÉRTEBRA™ | Descubra seu potencial de renda",
  description:
    "Responda algumas perguntas rápidas e descubra se o Método VÉRTEBRA™ é o seu match para gerar renda consistente em 30 dias.",
  robots: { index: false, follow: false },
}

export default function MetodoVertebraPage() {
  return <VertebraFlow />
}
