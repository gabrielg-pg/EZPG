"use server"

import { getSession } from "@/lib/auth"
import {
  ensureVertebraLeadsTable,
  insertVertebraLead,
  listVertebraLeads,
  updateVertebraLeadStatus,
  type InsertVertebraLeadInput,
  type MetodoVertebraLead,
} from "@/lib/vertebra-db"
import { isVertebraStatus, type VertebraStatus } from "@/lib/metodo-vertebra"

// ---- Público: submissão do funil ----
export async function submitVertebraLead(
  input: InsertVertebraLeadInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    if (!input?.nome?.trim() || !input?.whatsapp?.trim()) {
      return { ok: false, error: "Nome e WhatsApp são obrigatórios." }
    }
    await ensureVertebraLeadsTable()
    const { id } = await insertVertebraLead(input)
    return { ok: true, id }
  } catch (error) {
    console.error("[v0] Falha ao salvar lead VÉRTEBRA:", error)
    return { ok: false, error: "Não foi possível salvar seus dados. Tente novamente." }
  }
}

// ---- Protegido: dashboard ----
async function requireVertebraAccess() {
  const { user } = await getSession()
  if (!user) throw new Error("Não autenticado")
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())
  if (!roles.some((r) => ["admin", "gestor_ads"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

export async function refreshVertebraLeads(): Promise<MetodoVertebraLead[]> {
  await requireVertebraAccess()
  await ensureVertebraLeadsTable()
  return listVertebraLeads()
}

export async function setVertebraLeadStatus(
  id: string,
  status: VertebraStatus,
): Promise<{ ok: boolean }> {
  await requireVertebraAccess()
  if (!isVertebraStatus(status)) return { ok: false }
  await updateVertebraLeadStatus(id, status)
  return { ok: true }
}
