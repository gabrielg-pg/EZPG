"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { encryptSecret, decryptSecret } from "@/lib/nexus-crypto"
import type {
  NexusContent,
  NexusCredential,
  NexusPlatform,
  NexusStatus,
} from "@/lib/nexus"

// ---------------------------------------------------------------------------
// Permissões (modelo: uma permissão "nexus_growth" + regras por papel)
// ---------------------------------------------------------------------------

type SessionUser = { id: number; name: string; role: string; roles: string[] }

function canViewNexus(user: SessionUser): boolean {
  return user.role === "admin" || user.roles.includes("admin") || user.roles.includes("nexus_growth")
}
function isAdmin(user: SessionUser): boolean {
  return user.role === "admin" || user.roles.includes("admin")
}
// Admin e parceiro Nexus podem criar/editar/excluir conteúdo.
function canManageContent(user: SessionUser): boolean {
  return canViewNexus(user)
}
// Apenas admin aprova / solicita alteração.
function canApprove(user: SessionUser): boolean {
  return isAdmin(user)
}

async function getAuthedUser(): Promise<SessionUser | null> {
  const { user } = await getSession()
  if (!user) return null
  return user as SessionUser
}

async function logActivity(userId: number, action: string, resource: string) {
  try {
    await sql`
      INSERT INTO nexus_activity_log (user_id, action, resource)
      VALUES (${userId}, ${action}, ${resource})
    `
  } catch {
    // log não pode quebrar a operação principal
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export async function ensureNexusTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS nexus_content (
      id SERIAL PRIMARY KEY,
      title VARCHAR(300) NOT NULL DEFAULT '',
      date DATE NOT NULL,
      publication_time VARCHAR(5),
      platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
      content_type VARCHAR(30),
      status VARCHAR(30) NOT NULL DEFAULT 'ideia',
      responsible_user_id INTEGER,
      pillar VARCHAR(30),
      objective TEXT NOT NULL DEFAULT '',
      briefing TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      cta TEXT NOT NULL DEFAULT '',
      "references" TEXT NOT NULL DEFAULT '',
      material_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      revision_note TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS nexus_credentials (
      id SERIAL PRIMARY KEY,
      platform_name VARCHAR(255) NOT NULL DEFAULT '',
      platform_url TEXT NOT NULL DEFAULT '',
      username VARCHAR(255) NOT NULL DEFAULT '',
      encrypted_password TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS nexus_credential_permissions (
      id SERIAL PRIMARY KEY,
      credential_id INTEGER NOT NULL REFERENCES nexus_credentials(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL,
      can_view BOOLEAN NOT NULL DEFAULT TRUE,
      can_reveal_password BOOLEAN NOT NULL DEFAULT FALSE,
      can_edit BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE (credential_id, user_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS nexus_activity_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action VARCHAR(80) NOT NULL,
      resource VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// ---------------------------------------------------------------------------
// Conteúdos
// ---------------------------------------------------------------------------

type ContentInput = {
  title: string
  date: string
  publication_time: string | null
  platforms: NexusPlatform[]
  content_type: string | null
  status: NexusStatus
  responsible_user_id: number | null
  pillar: string | null
  objective: string
  briefing: string
  caption: string
  cta: string
  references: string
  material_url: string
  notes: string
}

function mapContentRow(row: Record<string, unknown>): NexusContent {
  const platformsRaw = row.platforms
  const platforms = Array.isArray(platformsRaw)
    ? (platformsRaw as NexusPlatform[])
    : typeof platformsRaw === "string"
      ? (JSON.parse(platformsRaw || "[]") as NexusPlatform[])
      : []
  return {
    id: row.id as number,
    title: (row.title as string) ?? "",
    date: typeof row.date === "string" ? row.date.slice(0, 10) : new Date(row.date as string).toISOString().slice(0, 10),
    publication_time: (row.publication_time as string) ?? null,
    platforms,
    content_type: (row.content_type as NexusContent["content_type"]) ?? null,
    status: (row.status as NexusStatus) ?? "ideia",
    responsible_user_id: (row.responsible_user_id as number) ?? null,
    responsible_name: (row.responsible_name as string) ?? null,
    pillar: (row.pillar as NexusContent["pillar"]) ?? null,
    objective: (row.objective as string) ?? "",
    briefing: (row.briefing as string) ?? "",
    caption: (row.caption as string) ?? "",
    cta: (row.cta as string) ?? "",
    references: (row.references as string) ?? "",
    material_url: (row.material_url as string) ?? "",
    notes: (row.notes as string) ?? "",
    revision_note: (row.revision_note as string) ?? "",
    sort_order: (row.sort_order as number) ?? 0,
    created_by: (row.created_by as number) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }
}

export async function getNexusContents(
  year: number,
  month: number, // 1-12
): Promise<{ ok: boolean; contents: NexusContent[]; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canViewNexus(user)) {
    return { ok: false, contents: [], error: "Não autorizado" }
  }
  const start = `${year}-${String(month).padStart(2, "0")}-01`
  // primeiro dia do mês seguinte
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`

  const rows = await sql`
    SELECT c.*, u.name AS responsible_name
    FROM nexus_content c
    LEFT JOIN users u ON u.id = c.responsible_user_id
    WHERE c.date >= ${start} AND c.date < ${end}
    ORDER BY c.date ASC, c.sort_order ASC, c.publication_time ASC NULLS LAST, c.id ASC
  `
  return { ok: true, contents: (rows as Record<string, unknown>[]).map(mapContentRow) }
}

export async function createNexusContent(
  input: ContentInput,
): Promise<{ success: boolean; error?: string; content?: NexusContent }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    const platformsJson = JSON.stringify(input.platforms ?? [])
    const rows = await sql`
      INSERT INTO nexus_content (
        title, date, publication_time, platforms, content_type, status,
        responsible_user_id, pillar, objective, briefing, caption, cta,
        "references", material_url, notes, created_by
      ) VALUES (
        ${input.title}, ${input.date}, ${input.publication_time || null},
        ${platformsJson}::jsonb, ${input.content_type || null}, ${input.status},
        ${input.responsible_user_id || null}, ${input.pillar || null},
        ${input.objective}, ${input.briefing}, ${input.caption}, ${input.cta},
        ${input.references}, ${input.material_url}, ${input.notes}, ${user.id}
      )
      RETURNING *
    `
    await logActivity(user.id, "criar_conteudo", `content#${(rows[0] as { id: number }).id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true, content: mapContentRow(rows[0] as Record<string, unknown>) }
  } catch (error) {
    console.error("createNexusContent error:", error)
    return { success: false, error: "Erro ao criar conteúdo" }
  }
}

export async function updateNexusContent(
  id: number,
  input: ContentInput,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    const platformsJson = JSON.stringify(input.platforms ?? [])
    await sql`
      UPDATE nexus_content SET
        title = ${input.title},
        date = ${input.date},
        publication_time = ${input.publication_time || null},
        platforms = ${platformsJson}::jsonb,
        content_type = ${input.content_type || null},
        status = ${input.status},
        responsible_user_id = ${input.responsible_user_id || null},
        pillar = ${input.pillar || null},
        objective = ${input.objective},
        briefing = ${input.briefing},
        caption = ${input.caption},
        cta = ${input.cta},
        "references" = ${input.references},
        material_url = ${input.material_url},
        notes = ${input.notes},
        updated_at = NOW()
      WHERE id = ${id}
    `
    await logActivity(user.id, "editar_conteudo", `content#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("updateNexusContent error:", error)
    return { success: false, error: "Erro ao atualizar conteúdo" }
  }
}

export async function updateNexusStatus(
  id: number,
  status: NexusStatus,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`UPDATE nexus_content SET status = ${status}, updated_at = NOW() WHERE id = ${id}`
    await logActivity(user.id, "alterar_status", `content#${id}:${status}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("updateNexusStatus error:", error)
    return { success: false, error: "Erro ao alterar status" }
  }
}

export async function updateNexusResponsible(
  id: number,
  responsibleUserId: number | null,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`UPDATE nexus_content SET responsible_user_id = ${responsibleUserId || null}, updated_at = NOW() WHERE id = ${id}`
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("updateNexusResponsible error:", error)
    return { success: false, error: "Erro ao alterar responsável" }
  }
}

// Move para outro dia (drag & drop) — atualiza a data.
export async function moveNexusContent(
  id: number,
  newDate: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`UPDATE nexus_content SET date = ${newDate}, updated_at = NOW() WHERE id = ${id}`
    await logActivity(user.id, "mover_conteudo", `content#${id}:${newDate}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("moveNexusContent error:", error)
    return { success: false, error: "Erro ao mover conteúdo" }
  }
}

export async function duplicateNexusContent(
  id: number,
): Promise<{ success: boolean; error?: string; content?: NexusContent }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    const rows = await sql`
      INSERT INTO nexus_content (
        title, date, publication_time, platforms, content_type, status,
        responsible_user_id, pillar, objective, briefing, caption, cta,
        "references", material_url, notes, created_by
      )
      SELECT
        title || ' (cópia)', date, publication_time, platforms, content_type, 'ideia',
        responsible_user_id, pillar, objective, briefing, caption, cta,
        "references", material_url, notes, ${user.id}
      FROM nexus_content WHERE id = ${id}
      RETURNING *
    `
    if (rows.length === 0) return { success: false, error: "Conteúdo não encontrado" }
    await logActivity(user.id, "duplicar_conteudo", `content#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true, content: mapContentRow(rows[0] as Record<string, unknown>) }
  } catch (error) {
    console.error("duplicateNexusContent error:", error)
    return { success: false, error: "Erro ao duplicar conteúdo" }
  }
}

export async function deleteNexusContent(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`DELETE FROM nexus_content WHERE id = ${id}`
    await logActivity(user.id, "excluir_conteudo", `content#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("deleteNexusContent error:", error)
    return { success: false, error: "Erro ao excluir conteúdo" }
  }
}

// Reordena conteúdos dentro do mesmo dia.
export async function reorderNexusContents(
  orderedIds: number[],
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`UPDATE nexus_content SET sort_order = ${i} WHERE id = ${orderedIds[i]}`
    }
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("reorderNexusContents error:", error)
    return { success: false, error: "Erro ao reordenar" }
  }
}

// ---- Aprovação ----

export async function sendNexusForApproval(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canManageContent(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    await sql`UPDATE nexus_content SET status = 'aguardando_aprovacao', revision_note = '', updated_at = NOW() WHERE id = ${id}`
    await logActivity(user.id, "enviar_aprovacao", `content#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("sendNexusForApproval error:", error)
    return { success: false, error: "Erro ao enviar para aprovação" }
  }
}

export async function approveNexusContent(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canApprove(user)) {
    return { success: false, error: "Apenas administradores podem aprovar" }
  }
  try {
    await sql`UPDATE nexus_content SET status = 'aprovado', revision_note = '', updated_at = NOW() WHERE id = ${id}`
    await logActivity(user.id, "aprovar_conteudo", `content#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("approveNexusContent error:", error)
    return { success: false, error: "Erro ao aprovar conteúdo" }
  }
}

export async function requestNexusChanges(
  id: number,
  note: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canApprove(user)) {
    return { success: false, error: "Apenas administradores podem solicitar alteração" }
  }
  try {
    await sql`UPDATE nexus_content SET status = 'em_producao', revision_note = ${note}, updated_at = NOW() WHERE id = ${id}`
    await logActivity(user.id, "solicitar_alteracao", `content#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("requestNexusChanges error:", error)
    return { success: false, error: "Erro ao solicitar alteração" }
  }
}

// ---------------------------------------------------------------------------
// Acessos (credenciais)
// ---------------------------------------------------------------------------

export async function getNexusCredentials(): Promise<{
  ok: boolean
  credentials: NexusCredential[]
  error?: string
}> {
  const user = await getAuthedUser()
  if (!user || !canViewNexus(user)) {
    return { ok: false, credentials: [], error: "Não autorizado" }
  }
  const admin = isAdmin(user)

  const rows = await sql`
    SELECT c.id, c.platform_name, c.platform_url, c.username, c.notes,
           c.created_by, c.created_at, c.updated_at
    FROM nexus_credentials c
    ORDER BY c.platform_name ASC, c.id ASC
  `

  // O acesso aos acessos é controlado pela permissão "Nexus Growth" (atribuída em
  // Usuários). Qualquer pessoa que enxerga o painel pode visualizar e revelar as
  // senhas; apenas administradores criam/editam/excluem.
  const result: NexusCredential[] = (rows as Record<string, unknown>[]).map((row) => ({
    id: row.id as number,
    platform_name: (row.platform_name as string) ?? "",
    platform_url: (row.platform_url as string) ?? "",
    username: (row.username as string) ?? "",
    notes: (row.notes as string) ?? "",
    can_reveal: true,
    can_edit: admin,
    authorized_user_ids: [],
    created_by: (row.created_by as number) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }))
  return { ok: true, credentials: result }
}

type CredentialInput = {
  platform_name: string
  platform_url: string
  username: string
  password: string // texto puro vindo do form; criptografado antes de gravar
  notes: string
}

export async function createNexusCredential(
  input: CredentialInput,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !isAdmin(user)) {
    return { success: false, error: "Apenas administradores podem adicionar acessos" }
  }
  try {
    const encrypted = input.password ? encryptSecret(input.password) : ""
    const rows = await sql`
      INSERT INTO nexus_credentials (platform_name, platform_url, username, encrypted_password, notes, created_by)
      VALUES (${input.platform_name}, ${input.platform_url}, ${input.username}, ${encrypted}, ${input.notes}, ${user.id})
      RETURNING id
    `
    const credId = (rows[0] as { id: number }).id
    await logActivity(user.id, "criar_acesso", `credential#${credId}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("createNexusCredential error:", error)
    return { success: false, error: "Erro ao adicionar acesso" }
  }
}

export async function updateNexusCredential(
  id: number,
  input: CredentialInput & { changePassword: boolean },
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !isAdmin(user)) {
    return { success: false, error: "Apenas administradores podem editar acessos" }
  }
  try {
    if (input.changePassword) {
      const encrypted = input.password ? encryptSecret(input.password) : ""
      await sql`
        UPDATE nexus_credentials SET
          platform_name = ${input.platform_name}, platform_url = ${input.platform_url},
          username = ${input.username}, encrypted_password = ${encrypted},
          notes = ${input.notes}, updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE nexus_credentials SET
          platform_name = ${input.platform_name}, platform_url = ${input.platform_url},
          username = ${input.username}, notes = ${input.notes}, updated_at = NOW()
        WHERE id = ${id}
      `
    }
    await logActivity(user.id, "editar_acesso", `credential#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("updateNexusCredential error:", error)
    return { success: false, error: "Erro ao editar acesso" }
  }
}

export async function deleteNexusCredential(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !isAdmin(user)) {
    return { success: false, error: "Apenas administradores podem excluir acessos" }
  }
  try {
    await sql`DELETE FROM nexus_credentials WHERE id = ${id}`
    await logActivity(user.id, "excluir_acesso", `credential#${id}`)
    revalidatePath("/zona-de-execucao/nexus-growth")
    return { success: true }
  } catch (error) {
    console.error("deleteNexusCredential error:", error)
    return { success: false, error: "Erro ao excluir acesso" }
  }
}

// Revela a senha SOB DEMANDA (nunca enviada em massa). Só quem tem permissão.
export async function revealNexusPassword(
  id: number,
): Promise<{ success: boolean; password?: string; error?: string }> {
  const user = await getAuthedUser()
  if (!user || !canViewNexus(user)) {
    return { success: false, error: "Não autorizado" }
  }
  try {
    // Autorização já validada por canViewNexus (permissão "Nexus Growth").
    const rows = await sql`SELECT encrypted_password FROM nexus_credentials WHERE id = ${id} LIMIT 1`
    if (rows.length === 0) return { success: false, error: "Acesso não encontrado" }
    const decrypted = decryptSecret((rows[0] as { encrypted_password: string }).encrypted_password)
    // Registra QUEM visualizou (sem gravar a senha).
    await logActivity(user.id, "revelar_senha", `credential#${id}`)
    return { success: true, password: decrypted }
  } catch (error) {
    console.error("revealNexusPassword error:", error)
    return { success: false, error: "Erro ao revelar senha" }
  }
}

// Lista usuários para seletores (responsável / autorizados). Reaproveita o padrão.
export async function getNexusSelectableUsers(): Promise<
  Array<{ id: number; name: string }>
> {
  const user = await getAuthedUser()
  if (!user || !canViewNexus(user)) return []
  const rows = await sql`SELECT id, name FROM users WHERE status = 'ativo' ORDER BY name ASC`
  return (rows as Array<{ id: number; name: string }>).map((r) => ({ id: r.id, name: r.name }))
}
