"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

async function ensureAdmin() {
  const user = await requireAuth()
  const isAdmin = Array.isArray(user.role) ? user.role.includes("admin") : user.role === "admin"
  if (!isAdmin) throw new Error("Sem permissão")
}

export async function createFinanceiroTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_receitas (
      id SERIAL PRIMARY KEY,
      metodo VARCHAR(100),
      data DATE NOT NULL,
      nome VARCHAR(255) NOT NULL,
      plano_servico VARCHAR(255),
      operacao VARCHAR(100),
      entrada NUMERIC(10,2) DEFAULT 0,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pg_despesas (
      id SERIAL PRIMARY KEY,
      metodo VARCHAR(100),
      data DATE NOT NULL,
      descricao VARCHAR(255) NOT NULL,
      categoria VARCHAR(100),
      saida NUMERIC(10,2) DEFAULT 0,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pg_colaboradores_pagamento (
      id SERIAL PRIMARY KEY,
      colaborador VARCHAR(255) NOT NULL,
      colaborador_id INTEGER,
      marca VARCHAR(255) NOT NULL,
      plano VARCHAR(255) NOT NULL,
      valor NUMERIC(10,2) DEFAULT 0,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pg_colaboradores_perfil (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      departamento VARCHAR(255),
      chave_pix VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  // Garante a coluna colaborador_id em bancos já existentes
  await sql`ALTER TABLE pg_colaboradores_pagamento ADD COLUMN IF NOT EXISTS colaborador_id INTEGER`
}

export async function getColaboradoresPerfil() {
  return await sql`SELECT * FROM pg_colaboradores_perfil ORDER BY nome`
}

export async function createColaboradorPerfil(data: { nome: string; departamento: string; chave_pix: string }) {
  await ensureAdmin()
  return await sql`
    INSERT INTO pg_colaboradores_perfil (nome, departamento, chave_pix)
    VALUES (${data.nome}, ${data.departamento}, ${data.chave_pix})
    RETURNING *
  `
}

export async function deleteColaboradorPerfil(id: number) {
  await ensureAdmin()
  return await sql`DELETE FROM pg_colaboradores_perfil WHERE id=${id}`
}

export async function getReceitas(mes: number, ano: number) {
  return await sql`SELECT * FROM pg_receitas WHERE mes=${mes} AND ano=${ano} ORDER BY data`
}
export async function createReceita(data: {
  metodo: string
  data: string
  nome: string
  plano_servico: string
  operacao: string
  entrada: number
  mes: number
  ano: number
}) {
  await ensureAdmin()
  return await sql`INSERT INTO pg_receitas (metodo,data,nome,plano_servico,operacao,entrada,mes,ano) VALUES (${data.metodo},${data.data},${data.nome},${data.plano_servico},${data.operacao},${data.entrada},${data.mes},${data.ano}) RETURNING *`
}
export async function deleteReceita(id: number) {
  await ensureAdmin()
  return await sql`DELETE FROM pg_receitas WHERE id=${id}`
}

export async function getDespesas(mes: number, ano: number) {
  return await sql`SELECT * FROM pg_despesas WHERE mes=${mes} AND ano=${ano} ORDER BY data`
}
export async function createDespesa(data: {
  metodo: string
  data: string
  descricao: string
  categoria: string
  saida: number
  mes: number
  ano: number
}) {
  await ensureAdmin()
  return await sql`INSERT INTO pg_despesas (metodo,data,descricao,categoria,saida,mes,ano) VALUES (${data.metodo},${data.data},${data.descricao},${data.categoria},${data.saida},${data.mes},${data.ano}) RETURNING *`
}
export async function deleteDespesa(id: number) {
  await ensureAdmin()
  return await sql`DELETE FROM pg_despesas WHERE id=${id}`
}

export async function getPagamentosColaborador(mes: number, ano: number) {
  return await sql`SELECT * FROM pg_colaboradores_pagamento WHERE mes=${mes} AND ano=${ano} ORDER BY colaborador, marca`
}
export async function createPagamentoColaborador(data: {
  colaborador: string
  marca: string
  plano: string
  valor: number
  mes: number
  ano: number
}) {
  await ensureAdmin()
  return await sql`INSERT INTO pg_colaboradores_pagamento (colaborador,marca,plano,valor,mes,ano) VALUES (${data.colaborador},${data.marca},${data.plano},${data.valor},${data.mes},${data.ano}) RETURNING *`
}
export async function deletePagamentoColaborador(id: number) {
  await ensureAdmin()
  return await sql`DELETE FROM pg_colaboradores_pagamento WHERE id=${id}`
}

export async function getResumoAnual(ano: number) {
  const receitas = await sql`SELECT mes, SUM(entrada) as total FROM pg_receitas WHERE ano=${ano} GROUP BY mes`
  const despesas = await sql`SELECT mes, SUM(saida) as total FROM pg_despesas WHERE ano=${ano} GROUP BY mes`
  const colaboradores = await sql`SELECT mes, SUM(valor) as total FROM pg_colaboradores_pagamento WHERE ano=${ano} GROUP BY mes`
  return { receitas, despesas, colaboradores }
}
