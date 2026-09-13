"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  CONTRACT_STATUSES,
  PAYMENT_STATUSES,
  DEFAULT_RESPONSIBLE,
  type GrowthClient,
  type ClientCycle,
  type ContractStatus,
  type PaymentStatus,
} from "@/lib/growth-clients"

const PATH = "/zona-de-execucao/growth-clientes"

// Neon pode retornar DATE como objeto Date ou string; normaliza para meia-noite local
function parseCycleDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

// Somente Admin gerencia Growth Clientes
async function isAdmin() {
  const { user } = await getSession()
  if (!user) return false
  return user.roles.includes("admin")
}

export async function createGrowthClientsTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_growth_clients (
      id SERIAL PRIMARY KEY,
      brand_name TEXT NOT NULL,
      cycle_start DATE NOT NULL,
      cycle_end DATE NOT NULL,
      monthly_value NUMERIC(12,2) NOT NULL DEFAULT 0,
      current_cycle INTEGER NOT NULL DEFAULT 1,
      contract_status TEXT NOT NULL DEFAULT 'ativo',
      payment_status TEXT NOT NULL DEFAULT 'aguardando',
      responsible TEXT NOT NULL DEFAULT 'PG | Alisson Jordi',
      tab_status TEXT NOT NULL DEFAULT 'ativos',
      paused_at DATE,
      paused_days_remaining INTEGER,
      exit_date DATE,
      exit_reason TEXT,
      completed_cycles INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pg_growth_client_cycles (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES pg_growth_clients(id) ON DELETE CASCADE,
      cycle_number INTEGER NOT NULL,
      cycle_start DATE NOT NULL,
      cycle_end DATE NOT NULL,
      monthly_value NUMERIC(12,2) NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'aguardando',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function getGrowthClients(): Promise<GrowthClient[]> {
  if (!(await isAdmin())) return []
  try {
    // Ordenação padrão: término mais próximo primeiro
    const rows = await sql`
      SELECT * FROM pg_growth_clients
      ORDER BY cycle_end ASC, created_at ASC
    `
    return rows as GrowthClient[]
  } catch {
    return []
  }
}

export async function getClientHistory(clientId: number): Promise<ClientCycle[]> {
  if (!(await isAdmin())) return []
  try {
    const rows = await sql`
      SELECT * FROM pg_growth_client_cycles
      WHERE client_id = ${clientId}
      ORDER BY cycle_number ASC
    `
    return rows as ClientCycle[]
  } catch {
    return []
  }
}

type ClientInput = {
  brandName: string
  cycleStart: string
  cycleEnd: string
  monthlyValue: number
  currentCycle?: number
  contractStatus?: ContractStatus
  paymentStatus?: PaymentStatus
  responsible?: string
}

export async function createGrowthClient(
  data: ClientInput
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  if (!data.brandName?.trim()) return { success: false, error: "Informe o nome da marca" }
  if (!data.cycleStart || !data.cycleEnd) return { success: false, error: "Informe as datas do ciclo" }

  try {
    const contract = data.contractStatus && CONTRACT_STATUSES.includes(data.contractStatus) ? data.contractStatus : "ativo"
    const payment = data.paymentStatus && PAYMENT_STATUSES.includes(data.paymentStatus) ? data.paymentStatus : "aguardando"
    await sql`
      INSERT INTO pg_growth_clients (
        brand_name, cycle_start, cycle_end, monthly_value, current_cycle,
        contract_status, payment_status, responsible, tab_status
      ) VALUES (
        ${data.brandName.trim()},
        ${data.cycleStart},
        ${data.cycleEnd},
        ${data.monthlyValue || 0},
        ${data.currentCycle || 1},
        ${contract},
        ${payment},
        ${data.responsible?.trim() || DEFAULT_RESPONSIBLE},
        'ativos'
      )
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("createGrowthClient error:", e)
    return { success: false, error: "Erro ao criar cliente" }
  }
}

export async function updateGrowthClient(
  id: number,
  data: ClientInput
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  if (!data.brandName?.trim()) return { success: false, error: "Informe o nome da marca" }

  try {
    const contract = data.contractStatus && CONTRACT_STATUSES.includes(data.contractStatus) ? data.contractStatus : "ativo"
    const payment = data.paymentStatus && PAYMENT_STATUSES.includes(data.paymentStatus) ? data.paymentStatus : "aguardando"
    await sql`
      UPDATE pg_growth_clients SET
        brand_name = ${data.brandName.trim()},
        cycle_start = ${data.cycleStart},
        cycle_end = ${data.cycleEnd},
        monthly_value = ${data.monthlyValue || 0},
        current_cycle = ${data.currentCycle || 1},
        contract_status = ${contract},
        payment_status = ${payment},
        responsible = ${data.responsible?.trim() || DEFAULT_RESPONSIBLE},
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("updateGrowthClient error:", e)
    return { success: false, error: "Erro ao atualizar cliente" }
  }
}

export async function deleteGrowthClient(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    await sql`DELETE FROM pg_growth_clients WHERE id = ${id}`
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("deleteGrowthClient error:", e)
    return { success: false, error: "Erro ao excluir cliente" }
  }
}

// Renovar: arquiva ciclo atual no histórico, soma +30 dias, incrementa ciclo, reseta pagamento
export async function renewGrowthClient(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    const rows = (await sql`SELECT * FROM pg_growth_clients WHERE id = ${id} LIMIT 1`) as GrowthClient[]
    const client = rows[0]
    if (!client) return { success: false, error: "Cliente não encontrado" }

    // Arquiva o ciclo que está sendo concluído
    await sql`
      INSERT INTO pg_growth_client_cycles (client_id, cycle_number, cycle_start, cycle_end, monthly_value, payment_status)
      VALUES (${id}, ${client.current_cycle}, ${client.cycle_start}, ${client.cycle_end}, ${client.monthly_value}, ${client.payment_status})
    `

    // +30 dias no início e término (novo ciclo começa no término do anterior)
    const newStart = parseCycleDate(client.cycle_end)
    const newEnd = new Date(newStart)
    newEnd.setDate(newEnd.getDate() + 30)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    await sql`
      UPDATE pg_growth_clients SET
        cycle_start = ${fmt(newStart)},
        cycle_end = ${fmt(newEnd)},
        current_cycle = ${client.current_cycle + 1},
        contract_status = 'renovado',
        payment_status = 'aguardando',
        completed_cycles = ${client.completed_cycles + 1},
        tab_status = 'ativos',
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("renewGrowthClient error:", e)
    return { success: false, error: "Erro ao renovar" }
  }
}

// Pausar: salva data da pausa e dias restantes, move para aba Pausados
export async function pauseGrowthClient(
  id: number,
  daysLeft: number
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    const today = new Date().toISOString().slice(0, 10)
    await sql`
      UPDATE pg_growth_clients SET
        tab_status = 'pausados',
        paused_at = ${today},
        paused_days_remaining = ${daysLeft},
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("pauseGrowthClient error:", e)
    return { success: false, error: "Erro ao pausar" }
  }
}

// Reativar: retoma dias restantes a partir de hoje, volta para Ativos
export async function reactivateGrowthClient(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    const rows = (await sql`SELECT * FROM pg_growth_clients WHERE id = ${id} LIMIT 1`) as GrowthClient[]
    const client = rows[0]
    if (!client) return { success: false, error: "Cliente não encontrado" }

    const daysLeft = client.paused_days_remaining ?? 0
    const newStart = new Date()
    newStart.setHours(0, 0, 0, 0)
    const newEnd = new Date(newStart)
    newEnd.setDate(newEnd.getDate() + Math.max(daysLeft, 0))
    const fmt = (d: Date) => d.toISOString().slice(0, 10)

    await sql`
      UPDATE pg_growth_clients SET
        tab_status = 'ativos',
        cycle_start = ${fmt(newStart)},
        cycle_end = ${fmt(newEnd)},
        contract_status = 'ativo',
        paused_at = NULL,
        paused_days_remaining = NULL,
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("reactivateGrowthClient error:", e)
    return { success: false, error: "Erro ao reativar" }
  }
}

// Não Renovar: registra saída, motivo e ciclos concluídos, move para Não Renovados
export async function notRenewGrowthClient(
  id: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    const rows = (await sql`SELECT * FROM pg_growth_clients WHERE id = ${id} LIMIT 1`) as GrowthClient[]
    const client = rows[0]
    if (!client) return { success: false, error: "Cliente não encontrado" }

    const today = new Date().toISOString().slice(0, 10)
    await sql`
      UPDATE pg_growth_clients SET
        tab_status = 'nao_renovados',
        exit_date = ${today},
        exit_reason = ${reason?.trim() || null},
        completed_cycles = ${client.current_cycle},
        updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("notRenewGrowthClient error:", e)
    return { success: false, error: "Erro ao registrar não renovação" }
  }
}
