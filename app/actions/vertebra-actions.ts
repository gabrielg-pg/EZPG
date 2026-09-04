"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { VertebraLead, VertebraPipelineStatus, VertebraSinalStatus } from "@/lib/vertebra"

const PATH = "/zona-de-execucao/propostas"

// ---------- CONFIG DE VAGAS (leitura pública) ----------

export type VagasConfig = { vagas_total: number; vagas_restantes: number }

export async function getVagasConfig(): Promise<VagasConfig> {
  const rows = await sql`SELECT vagas_total, vagas_restantes FROM pg_vertebra_config WHERE id = 1`
  const row = rows[0] as VagasConfig | undefined
  return row ?? { vagas_total: 30, vagas_restantes: 8 }
}

// ---------- FORMULÁRIO PÚBLICO (sem auth) ----------

// Etapa 1: cria lead parcial (nome + WhatsApp) na coluna "Novo Lead"
export async function createVertebraLead(data: {
  nome: string
  whatsapp: string
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    if (!data.nome || data.nome.trim().length < 3) {
      return { success: false, error: "Nome inválido" }
    }
    const rows = await sql`
      INSERT INTO pg_vertebra_leads (nome, whatsapp, pipeline_status, origem, sinal_status)
      VALUES (${data.nome.trim()}, ${data.whatsapp}, 'novo_lead', 'Lista Vértebra', 'pendente')
      RETURNING id
    `
    const id = (rows[0] as { id: number })?.id
    return { success: true, id }
  } catch (error) {
    console.error("createVertebraLead error:", error)
    return { success: false, error: "Erro ao salvar contato" }
  }
}

// Etapas 2-4: atualização progressiva (plano, forma de pagamento)
export async function updateVertebraLeadProgress(
  id: number,
  data: { plano?: string; plano_preco?: string; forma_pagamento?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE pg_vertebra_leads SET
        plano = COALESCE(${data.plano ?? null}, plano),
        plano_preco = COALESCE(${data.plano_preco ?? null}, plano_preco),
        forma_pagamento = COALESCE(${data.forma_pagamento ?? null}, forma_pagamento),
        updated_at = NOW()
      WHERE id = ${id}
    `
    return { success: true }
  } catch (error) {
    console.error("updateVertebraLeadProgress error:", error)
    return { success: false, error: "Erro ao atualizar lead" }
  }
}

// ---------- PROPOSTAS (somente Admin) ----------

async function requireAdminAccess() {
  const { user } = await getSession()
  if (!user) throw new Error("Não autenticado")
  const roles = (user.roles ?? [user.role]).map((r: string) => r.toLowerCase())
  if (!roles.includes("admin")) {
    throw new Error("Sem permissão")
  }
  return user
}

export async function getVertebraLeads(): Promise<VertebraLead[]> {
  await requireAdminAccess()
  const rows = await sql`SELECT * FROM pg_vertebra_leads ORDER BY created_at DESC`
  return rows as VertebraLead[]
}

export async function moveVertebraLead(id: number, toStatus: VertebraPipelineStatus) {
  await requireAdminAccess()
  await sql`
    UPDATE pg_vertebra_leads SET pipeline_status = ${toStatus}, updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath(PATH)
}

export async function updateVertebraSinal(id: number, status: VertebraSinalStatus) {
  await requireAdminAccess()
  await sql`
    UPDATE pg_vertebra_leads SET sinal_status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath(PATH)
}

export async function updateVertebraNotes(id: number, notas: string) {
  await requireAdminAccess()
  await sql`UPDATE pg_vertebra_leads SET notas = ${notas}, updated_at = NOW() WHERE id = ${id}`
  revalidatePath(PATH)
}

export async function deleteVertebraLead(id: number) {
  await requireAdminAccess()
  await sql`DELETE FROM pg_vertebra_leads WHERE id = ${id}`
  revalidatePath(PATH)
}

export async function updateVagasConfig(total: number, restantes: number) {
  await requireAdminAccess()
  const safeTotal = Math.max(1, Math.round(total))
  const safeRestantes = Math.min(safeTotal, Math.max(0, Math.round(restantes)))
  await sql`
    UPDATE pg_vertebra_config
    SET vagas_total = ${safeTotal}, vagas_restantes = ${safeRestantes}, updated_at = NOW()
    WHERE id = 1
  `
  revalidatePath(PATH)
  return { vagas_total: safeTotal, vagas_restantes: safeRestantes }
}
