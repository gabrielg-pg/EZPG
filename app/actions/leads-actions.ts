"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { boardKeyToPipelineStatus, type Lead } from "@/lib/leads"

// ---------- FORMULÁRIO PÚBLICO (sem auth) ----------

// Step 3: cria lead parcial com contato + Steps 1 e 2 + UTMs
export async function createPartialLead(data: {
  nome: string
  whatsapp: string
  email: string
  objetivo?: string
  situacao?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!data.nome || data.nome.trim().length < 3) {
      return { success: false, error: "Nome inválido" }
    }
    const rows = await sql`
      INSERT INTO leads (
        nome, whatsapp, email, objetivo, situacao, status,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid
      ) VALUES (
        ${data.nome.trim()},
        ${data.whatsapp},
        ${data.email.trim()},
        ${data.objetivo || null},
        ${data.situacao || null},
        'parcial',
        ${data.utm_source || null},
        ${data.utm_medium || null},
        ${data.utm_campaign || null},
        ${data.utm_content || null},
        ${data.utm_term || null},
        ${data.fbclid || null}
      )
      RETURNING id
    `
    const id = (rows as Array<{ id: string }>)[0]?.id
    return { success: true, id }
  } catch (error) {
    console.error("createPartialLead error:", error)
    return { success: false, error: "Erro ao salvar contato" }
  }
}

// Steps 4-7: atualização progressiva do lead
export async function updateLeadProgress(
  id: string,
  data: {
    experiencia?: string
    capital?: string
    prazo?: string
    status?: "parcial" | "qualificado" | "desqualificado"
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE leads SET
        experiencia = COALESCE(${data.experiencia ?? null}, experiencia),
        capital = COALESCE(${data.capital ?? null}, capital),
        prazo = COALESCE(${data.prazo ?? null}, prazo),
        status = COALESCE(${data.status ?? null}, status),
        pipeline_status = CASE
          WHEN ${data.status ?? null} = 'qualificado' THEN 'qualificado'
          ELSE pipeline_status
        END,
        updated_at = NOW()
      WHERE id = ${id}
    `
    return { success: true }
  } catch (error) {
    console.error("updateLeadProgress error:", error)
    return { success: false, error: "Erro ao atualizar lead" }
  }
}

// ---------- CRM PIPELINE (Admin + Gestor de ADS) ----------

async function requireCrmAccess() {
  const { user } = await getSession()
  if (!user) throw new Error("Não autenticado")
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())
  if (!roles.some((r) => ["admin", "gestor_ads"].includes(r))) {
    throw new Error("Sem permissão")
  }
  return user
}

export async function getPipelineLeads(): Promise<Lead[]> {
  await requireCrmAccess()
  const rows = await sql`
    SELECT * FROM leads
    WHERE status = 'qualificado'
    ORDER BY created_at DESC
  `
  return rows as Lead[]
}

export async function movePipelineLead(
  id: string,
  toBoardKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireCrmAccess()

    // Traduz a coluna do board (faixa de capital / ação) para o status persistido
    const toStatus = boardKeyToPipelineStatus(toBoardKey)

    const current = await sql`SELECT pipeline_status FROM leads WHERE id = ${id}`
    const fromStatus = (current as Array<{ pipeline_status: string }>)[0]?.pipeline_status ?? null

    await sql`
      UPDATE leads SET
        pipeline_status = ${toStatus},
        pipeline_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id}
    `

    // Registra histórico de movimentação
    await sql`
      INSERT INTO lead_pipeline_history (lead_id, de_status, para_status, movido_por)
      VALUES (${id}, ${fromStatus}, ${toStatus}, ${user.name || user.username})
    `

    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("movePipelineLead error:", error)
    return { success: false, error: "Erro ao mover lead" }
  }
}

export async function updateLeadNotes(
  id: string,
  notas: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireCrmAccess()
    await sql`UPDATE leads SET notas = ${notas}, updated_at = NOW() WHERE id = ${id}`
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("updateLeadNotes error:", error)
    return { success: false, error: "Erro ao salvar notas" }
  }
}

export type PipelineHistoryEntry = {
  id: string
  de_status: string | null
  para_status: string | null
  movido_por: string | null
  movido_em: string
}

export async function getLeadHistory(id: string): Promise<PipelineHistoryEntry[]> {
  await requireCrmAccess()
  const rows = await sql`
    SELECT id, de_status, para_status, movido_por, movido_em
    FROM lead_pipeline_history
    WHERE lead_id = ${id}
    ORDER BY movido_em DESC
  `
  return rows as PipelineHistoryEntry[]
}

export async function deletePipelineLead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireCrmAccess()
    await sql`DELETE FROM leads WHERE id = ${id}`
    revalidatePath("/crm")
    return { success: true }
  } catch (error) {
    console.error("deletePipelineLead error:", error)
    return { success: false, error: "Erro ao excluir lead" }
  }
}
