import { getVagasConfig } from "@/app/actions/vertebra-actions"
import { VertebraForm } from "@/components/lista-vertebra/vertebra-form"

export const dynamic = "force-dynamic"

export default async function ListaVertebraPage() {
  const vagas = await getVagasConfig()
  return <VertebraForm vagasTotal={vagas.vagas_total} vagasRestantes={vagas.vagas_restantes} />
}
