"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface Empresa {
  id: number
  nome: string
  login: string
  senha: string
  data_abertura: string | Date
  apresentacao: string
  ativo: boolean
  created_at: string | Date
  updated_at: string | Date | null
}

export interface EmpresaInput {
  nome: string
  login: string
  senha: string
  dataAbertura: string
  apresentacao?: string
  ativo?: boolean
}

// Acesso: Admin e membros da Zona de Execução.
async function canManageEmpresas() {
  const { user } = await getSession()
  if (!user) return false
  return user.roles.includes("admin") || user.roles.includes("zona_execucao")
}

export async function createEmpresasTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_empresas (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      login TEXT NOT NULL,
      senha TEXT NOT NULL DEFAULT '',
      data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
      apresentacao TEXT NOT NULL DEFAULT '',
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    )
  `
}

// Validação compartilhada (servidor). Retorna mensagem de erro ou null.
function validate(data: EmpresaInput): string | null {
  const nome = (data.nome ?? "").trim()
  const login = (data.login ?? "").trim()
  const senha = data.senha ?? ""
  const apresentacao = (data.apresentacao ?? "").trim()

  if (nome.length < 3 || nome.length > 100) {
    return "O nome da empresa deve ter entre 3 e 100 caracteres."
  }
  if (login.length === 0) {
    return "Informe o login da empresa."
  }
  if (senha.length === 0) {
    return "Informe a senha da empresa."
  }
  if (!data.dataAbertura) {
    return "Informe a data de abertura."
  }
  const abertura = new Date(data.dataAbertura)
  if (Number.isNaN(abertura.getTime())) {
    return "Data de abertura inválida."
  }
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (abertura.getTime() > today.getTime()) {
    return "A data de abertura deve estar no passado."
  }
  if (apresentacao.length > 500) {
    return "A apresentação deve ter no máximo 500 caracteres."
  }
  return null
}

export async function getEmpresas(): Promise<Empresa[]> {
  if (!(await canManageEmpresas())) return []
  try {
    const rows = await sql`
      SELECT * FROM pg_empresas
      ORDER BY created_at DESC, id DESC
    `
    return rows as Empresa[]
  } catch {
    return []
  }
}

export async function createEmpresa(
  data: EmpresaInput,
): Promise<{ success: boolean; error?: string; empresa?: Empresa }> {
  if (!(await canManageEmpresas())) {
    return { success: false, error: "Não autorizado" }
  }
  const validationError = validate(data)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const nome = data.nome.trim()
  const login = data.login.trim()
  const apresentacao = (data.apresentacao ?? "").trim()
  const ativo = data.ativo ?? true

  try {
    // Login único.
    const existing = await sql`SELECT id FROM pg_empresas WHERE LOWER(login) = LOWER(${login}) LIMIT 1`
    if ((existing as unknown[]).length > 0) {
      return { success: false, error: "Já existe uma empresa com esse login." }
    }

    const rows = await sql`
      INSERT INTO pg_empresas (nome, login, senha, data_abertura, apresentacao, ativo)
      VALUES (${nome}, ${login}, ${data.senha}, ${data.dataAbertura}, ${apresentacao}, ${ativo})
      RETURNING *
    `
    revalidatePath("/zona-de-execucao/empresas")
    return { success: true, empresa: (rows as Empresa[])[0] }
  } catch (error) {
    console.error("Create empresa error:", error)
    return { success: false, error: "Erro ao criar empresa." }
  }
}

export async function updateEmpresa(
  id: number,
  data: EmpresaInput,
): Promise<{ success: boolean; error?: string; empresa?: Empresa }> {
  if (!(await canManageEmpresas())) {
    return { success: false, error: "Não autorizado" }
  }
  const validationError = validate(data)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const nome = data.nome.trim()
  const login = data.login.trim()
  const apresentacao = (data.apresentacao ?? "").trim()
  const ativo = data.ativo ?? true

  try {
    // Login único (ignorando a própria empresa).
    const existing = await sql`
      SELECT id FROM pg_empresas WHERE LOWER(login) = LOWER(${login}) AND id <> ${id} LIMIT 1
    `
    if ((existing as unknown[]).length > 0) {
      return { success: false, error: "Já existe uma empresa com esse login." }
    }

    const rows = await sql`
      UPDATE pg_empresas
      SET nome = ${nome}, login = ${login}, senha = ${data.senha},
          data_abertura = ${data.dataAbertura}, apresentacao = ${apresentacao},
          ativo = ${ativo}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    revalidatePath("/zona-de-execucao/empresas")
    return { success: true, empresa: (rows as Empresa[])[0] }
  } catch (error) {
    console.error("Update empresa error:", error)
    return { success: false, error: "Erro ao salvar alterações." }
  }
}

export async function duplicateEmpresa(
  id: number,
): Promise<{ success: boolean; error?: string; empresa?: Empresa }> {
  if (!(await canManageEmpresas())) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    const source = (await sql`SELECT * FROM pg_empresas WHERE id = ${id} LIMIT 1`) as Empresa[]
    if (source.length === 0) {
      return { success: false, error: "Empresa não encontrada." }
    }
    const src = source[0]

    // Gera um login único para a cópia.
    const baseLogin = `${src.login}-copia`
    let login = baseLogin
    let n = 2
    // Loop curto para evitar colisão de login.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await sql`SELECT id FROM pg_empresas WHERE LOWER(login) = LOWER(${login}) LIMIT 1`
      if ((clash as unknown[]).length === 0) break
      login = `${baseLogin}-${n}`
      n += 1
    }

    const dataAbertura =
      src.data_abertura instanceof Date
        ? src.data_abertura.toISOString().slice(0, 10)
        : String(src.data_abertura).slice(0, 10)

    const rows = await sql`
      INSERT INTO pg_empresas (nome, login, senha, data_abertura, apresentacao, ativo)
      VALUES (${`${src.nome} (Cópia)`}, ${login}, ${src.senha}, ${dataAbertura}, ${src.apresentacao}, ${src.ativo})
      RETURNING *
    `
    revalidatePath("/zona-de-execucao/empresas")
    return { success: true, empresa: (rows as Empresa[])[0] }
  } catch (error) {
    console.error("Duplicate empresa error:", error)
    return { success: false, error: "Erro ao duplicar empresa." }
  }
}

export async function deleteEmpresa(id: number): Promise<{ success: boolean; error?: string }> {
  if (!(await canManageEmpresas())) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`DELETE FROM pg_empresas WHERE id = ${id}`
    revalidatePath("/zona-de-execucao/empresas")
    return { success: true }
  } catch (error) {
    console.error("Delete empresa error:", error)
    return { success: false, error: "Erro ao excluir empresa." }
  }
}
