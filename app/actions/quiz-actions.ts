"use server"

import { getSession } from "@/lib/auth"
import { ensureQuizLeadsTable, listQuizLeads, type QuizLead } from "@/lib/quiz-db"

async function requireFunilAccess() {
  const { user } = await getSession()
  if (!user) throw new Error("Não autenticado")
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())
  if (!roles.some((r) => ["admin", "comercial", "gestor_ads"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

// Usada pelo botão "Atualizar" do painel /funil
export async function refreshQuizLeads(): Promise<QuizLead[]> {
  await requireFunilAccess()
  await ensureQuizLeadsTable()
  return listQuizLeads()
}
