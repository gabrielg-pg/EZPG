"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function ensureAdmin() {
  const user = await requireAuth()
  const isAdmin = Array.isArray(user.role) ? user.role.includes("admin") : user.role === "admin"
  if (!isAdmin) throw new Error("Sem permissão")
}

export async function createCrmTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_crm_leads (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      plano VARCHAR(100),
      origem VARCHAR(100),
      data_reuniao DATE,
      responsavel VARCHAR(255),
      observacoes TEXT,
      etapa VARCHAR(50) NOT NULL DEFAULT 'reuniao_agendada',
      motivo_perda VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function getCrmLeads() {
  return await sql`SELECT * FROM pg_crm_leads ORDER BY created_at DESC`
}

export async function createCrmLead(data: {
  nome: string
  plano: string
  origem: string
  data_reuniao: string | null
  responsavel: string
  observacoes: string
  etapa: string
}) {
  await ensureAdmin()
  const result = await sql`
    INSERT INTO pg_crm_leads (nome, plano, origem, data_reuniao, responsavel, observacoes, etapa)
    VALUES (
      ${data.nome},
      ${data.plano},
      ${data.origem},
      ${data.data_reuniao || null},
      ${data.responsavel},
      ${data.observacoes},
      ${data.etapa}
    )
    RETURNING *
  `
  revalidatePath("/crm")
  return result
}

export async function updateCrmLead(
  id: number,
  data: {
    nome: string
    plano: string
    origem: string
    data_reuniao: string | null
    responsavel: string
    observacoes: string
  },
) {
  await ensureAdmin()
  const result = await sql`
    UPDATE pg_crm_leads SET
      nome=${data.nome},
      plano=${data.plano},
      origem=${data.origem},
      data_reuniao=${data.data_reuniao || null},
      responsavel=${data.responsavel},
      observacoes=${data.observacoes},
      updated_at=NOW()
    WHERE id=${id}
    RETURNING *
  `
  revalidatePath("/crm")
  return result
}

export async function moveCrmLead(id: number, etapa: string, motivoPerda?: string | null) {
  await ensureAdmin()
  const result = await sql`
    UPDATE pg_crm_leads SET
      etapa=${etapa},
      motivo_perda=${etapa === "perdido" ? motivoPerda || null : null},
      updated_at=NOW()
    WHERE id=${id}
    RETURNING *
  `
  revalidatePath("/crm")
  return result
}

export async function deleteCrmLead(id: number) {
  await ensureAdmin()
  await sql`DELETE FROM pg_crm_leads WHERE id=${id}`
  revalidatePath("/crm")
}
