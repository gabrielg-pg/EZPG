"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { PLANOS, type Cliente, type Compra, type Plano } from "@/lib/clientes"

const PATH = "/zona-de-execucao/clientes"

// Somente Admin gerencia Clientes
async function isAdmin() {
  const { user } = await getSession()
  if (!user) return false
  return user.roles.includes("admin")
}

export async function createClientesTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_clientes (
      id SERIAL PRIMARY KEY,
      nome_completo TEXT NOT NULL,
      cpf VARCHAR(20) NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      whatsapp VARCHAR(30) NOT NULL DEFAULT '',
      endereco TEXT NOT NULL DEFAULT '',
      estado VARCHAR(2) NOT NULL DEFAULT '',
      cidade TEXT NOT NULL DEFAULT '',
      cep VARCHAR(15) NOT NULL DEFAULT '',
      plano TEXT NOT NULL DEFAULT 'starter',
      ativo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  // CPF único (índice) — ignora falha se já existir
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS pg_clientes_cpf_key ON pg_clientes (cpf)`

  await sql`
    CREATE TABLE IF NOT EXISTS pg_cliente_compras (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES pg_clientes(id) ON DELETE CASCADE,
      valor NUMERIC(12,2) NOT NULL DEFAULT 0,
      data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
      tipo TEXT NOT NULL DEFAULT 'Plano',
      descricao TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

// Lista clientes com agregados de LTV (soma), 1ª compra, total e última compra
export async function getClientes(): Promise<Cliente[]> {
  if (!(await isAdmin())) return []
  try {
    const rows = await sql`
      SELECT
        c.id, c.nome_completo, c.cpf, c.email, c.whatsapp, c.endereco,
        c.estado, c.cidade, c.cep, c.plano, c.ativo, c.created_at,
        COALESCE(SUM(co.valor), 0) AS ltv,
        COALESCE(
          (SELECT valor FROM pg_cliente_compras
           WHERE cliente_id = c.id
           ORDER BY data_compra ASC, id ASC LIMIT 1), 0
        ) AS primeira_compra,
        COUNT(co.id)::int AS total_compras,
        MAX(co.data_compra) AS ultima_compra
      FROM pg_clientes c
      LEFT JOIN pg_cliente_compras co ON co.cliente_id = c.id
      GROUP BY c.id
      ORDER BY c.nome_completo ASC
    `
    return rows as Cliente[]
  } catch (e) {
    console.error("getClientes error:", e)
    return []
  }
}

export async function getClienteCompras(clienteId: number): Promise<Compra[]> {
  if (!(await isAdmin())) return []
  try {
    const rows = await sql`
      SELECT * FROM pg_cliente_compras
      WHERE cliente_id = ${clienteId}
      ORDER BY data_compra DESC, id DESC
    `
    return rows as Compra[]
  } catch (e) {
    console.error("getClienteCompras error:", e)
    return []
  }
}

type ClienteInput = {
  nomeCompleto: string
  cpf: string
  email: string
  whatsapp: string
  endereco: string
  estado: string
  cidade: string
  cep: string
  plano: Plano
  ativo?: boolean
}

function normalizePlano(plano: string): Plano {
  return PLANOS.includes(plano as Plano) ? (plano as Plano) : "starter"
}

// Cria cliente + primeira compra (que inicia o LTV)
export async function createCliente(
  data: ClienteInput & { valorPrimeiraCompra: number },
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  if (!data.nomeCompleto?.trim()) return { success: false, error: "Informe o nome completo" }
  if (!data.cpf?.trim()) return { success: false, error: "Informe o CPF" }

  try {
    const rows = await sql`
      INSERT INTO pg_clientes (
        nome_completo, cpf, email, whatsapp, endereco, estado, cidade, cep, plano, ativo
      ) VALUES (
        ${data.nomeCompleto.trim()},
        ${data.cpf.trim()},
        ${data.email.trim()},
        ${data.whatsapp.trim()},
        ${data.endereco.trim()},
        ${data.estado.trim()},
        ${data.cidade.trim()},
        ${data.cep.trim()},
        ${normalizePlano(data.plano)},
        ${data.ativo ?? true}
      )
      RETURNING id
    `
    const clienteId = (rows as Array<{ id: number }>)[0]?.id

    // Primeira compra inicia o LTV
    if (clienteId && data.valorPrimeiraCompra > 0) {
      await sql`
        INSERT INTO pg_cliente_compras (cliente_id, valor, tipo, descricao)
        VALUES (${clienteId}, ${data.valorPrimeiraCompra}, 'Plano', 'Primeira compra')
      `
    }

    revalidatePath(PATH)
    return { success: true }
  } catch (e: unknown) {
    console.error("createCliente error:", e)
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "23505") {
      return { success: false, error: "Já existe um cliente com este CPF" }
    }
    return { success: false, error: "Erro ao criar cliente" }
  }
}

export async function updateCliente(
  id: number,
  data: ClienteInput,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  if (!data.nomeCompleto?.trim()) return { success: false, error: "Informe o nome completo" }
  if (!data.cpf?.trim()) return { success: false, error: "Informe o CPF" }

  try {
    await sql`
      UPDATE pg_clientes SET
        nome_completo = ${data.nomeCompleto.trim()},
        cpf = ${data.cpf.trim()},
        email = ${data.email.trim()},
        whatsapp = ${data.whatsapp.trim()},
        endereco = ${data.endereco.trim()},
        estado = ${data.estado.trim()},
        cidade = ${data.cidade.trim()},
        cep = ${data.cep.trim()},
        plano = ${normalizePlano(data.plano)},
        ativo = ${data.ativo ?? true}
      WHERE id = ${id}
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e: unknown) {
    console.error("updateCliente error:", e)
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "23505") {
      return { success: false, error: "Já existe um cliente com este CPF" }
    }
    return { success: false, error: "Erro ao atualizar cliente" }
  }
}

export async function deleteCliente(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    await sql`DELETE FROM pg_clientes WHERE id = ${id}`
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("deleteCliente error:", e)
    return { success: false, error: "Erro ao excluir cliente" }
  }
}

// Adiciona uma nova compra — o LTV é recalculado automaticamente na leitura
export async function addCompra(
  clienteId: number,
  data: { valor: number; dataCompra: string; tipo: string; descricao: string },
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  if (!(data.valor > 0)) return { success: false, error: "Informe um valor válido" }

  try {
    await sql`
      INSERT INTO pg_cliente_compras (cliente_id, valor, data_compra, tipo, descricao)
      VALUES (
        ${clienteId},
        ${data.valor},
        ${data.dataCompra || new Date().toISOString().slice(0, 10)},
        ${data.tipo?.trim() || "Plano"},
        ${data.descricao?.trim() || ""}
      )
    `
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("addCompra error:", e)
    return { success: false, error: "Erro ao registrar compra" }
  }
}

export async function deleteCompra(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdmin())) return { success: false, error: "Não autorizado" }
  try {
    await sql`DELETE FROM pg_cliente_compras WHERE id = ${id}`
    revalidatePath(PATH)
    return { success: true }
  } catch (e) {
    console.error("deleteCompra error:", e)
    return { success: false, error: "Erro ao excluir compra" }
  }
}
