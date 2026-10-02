"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export type CerebroTipo = "aprendizado" | "link" | "modelo" | "estrutura"

export type CerebroItem = {
  id: number
  tipo: CerebroTipo
  titulo: string
  conteudo: string
  url: string | null
  categoria: string | null
  tags: string[]
  fixado: boolean
  favicon: string | null
  nicho: string | null
  pais: string | null
  moeda: string | null
  created_at: string
  updated_at: string
}

export type CerebroInput = {
  tipo: CerebroTipo
  titulo: string
  conteudo?: string
  url?: string | null
  categoria?: string | null
  tags?: string[]
  favicon?: string | null
  nicho?: string | null
  pais?: string | null
  moeda?: string | null
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

type CleanInput = {
  tipo: CerebroTipo
  titulo: string
  conteudo: string
  url: string | null
  categoria: string | null
  tags: string[]
  favicon: string | null
  nicho: string | null
  pais: string | null
  moeda: string | null
}

const TIPOS: CerebroTipo[] = ["aprendizado", "link", "modelo", "estrutura"]

async function getAdminId(): Promise<number | null> {
  const { user } = await getSession()
  if (!user) return null
  const roles = new Set([user.role, ...(user.roles ?? [])].filter(Boolean).map((r) => r.toLowerCase()))
  return roles.has("admin") ? user.id : null
}

function normalizeUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    if (!parsed.hostname.includes(".")) return null
    return parsed.toString()
  } catch {
    return null
  }
}

function sanitize(input: CerebroInput): Result<CleanInput> {
  if (!TIPOS.includes(input.tipo)) return { ok: false, error: "Tipo inválido." }
  const titulo = (input.titulo ?? "").trim().slice(0, 500)
  const conteudo = (input.conteudo ?? "").trim().slice(0, 50000)
  const categoria = (input.categoria ?? "").trim().slice(0, 100) || null
  const tags = Array.from(
    new Set((input.tags ?? []).map((t) => t.trim().slice(0, 50)).filter(Boolean)),
  ).slice(0, 20)
  let url: string | null = null
  if (input.tipo === "link") {
    url = normalizeUrl(input.url ?? "")
    if (!url) return { ok: false, error: "Informe um endereço válido." }
  }
  if (input.tipo === "estrutura" && (input.url ?? "").trim()) {
    url = normalizeUrl(input.url ?? "")
    if (!url) return { ok: false, error: "Informe um link da loja válido." }
  }
  const finalTitulo = titulo || (url ? new URL(url).hostname.replace(/^www\./, "") : "")
  if (!finalTitulo) return { ok: false, error: input.tipo === "estrutura" ? "Informe o nome da loja." : "Informe um título." }
  const favicon = (input.tipo === "link" || input.tipo === "estrutura") && url ? input.favicon || faviconFor(url) : null
  const isEstrutura = input.tipo === "estrutura"
  const nicho = isEstrutura ? (input.nicho ?? "").trim().slice(0, 150) || null : null
  const pais = isEstrutura ? (input.pais ?? "").trim().slice(0, 100) || null : null
  const moeda = isEstrutura ? (input.moeda ?? "").trim().toUpperCase().slice(0, 20) || null : null
  return {
    ok: true,
    data: { tipo: input.tipo, titulo: finalTitulo, conteudo, url, categoria, tags, favicon, nicho, pais, moeda },
  }
}

function faviconFor(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
  } catch {
    return null
  }
}

export async function getCerebroItems(): Promise<Result<CerebroItem[]>> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, error: "Acesso negado." }
  try {
    const rows = await sql`
      SELECT id, tipo, titulo, conteudo, url, categoria, tags, fixado, favicon, nicho, pais, moeda, created_at, updated_at
      FROM pg_cerebro
      WHERE created_by = ${adminId}
      ORDER BY fixado DESC, created_at DESC
    `
    return { ok: true, data: rows as CerebroItem[] }
  } catch (error) {
    console.error("Cerebro list error:", error)
    return { ok: false, error: "Não foi possível carregar o Cérebro." }
  }
}

export async function createCerebroItem(input: CerebroInput): Promise<Result<CerebroItem>> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, error: "Acesso negado." }
  const clean = sanitize(input)
  if (!clean.ok) return clean
  const d = clean.data
  try {
    const rows = await sql`
      INSERT INTO pg_cerebro (tipo, titulo, conteudo, url, categoria, tags, favicon, nicho, pais, moeda, created_by)
      VALUES (${d.tipo}, ${d.titulo}, ${d.conteudo}, ${d.url}, ${d.categoria}, ${d.tags}::text[], ${d.favicon}, ${d.nicho}, ${d.pais}, ${d.moeda}, ${adminId})
      RETURNING id, tipo, titulo, conteudo, url, categoria, tags, fixado, favicon, nicho, pais, moeda, created_at, updated_at
    `
    return { ok: true, data: rows[0] as CerebroItem }
  } catch (error) {
    console.error("Cerebro create error:", error)
    return { ok: false, error: "Não foi possível salvar. Tente novamente." }
  }
}

export async function updateCerebroItem(id: number, input: CerebroInput): Promise<Result<CerebroItem>> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, error: "Acesso negado." }
  const clean = sanitize(input)
  if (!clean.ok) return clean
  const d = clean.data
  try {
    const rows = await sql`
      UPDATE pg_cerebro
      SET titulo = ${d.titulo}, conteudo = ${d.conteudo}, url = ${d.url}, categoria = ${d.categoria},
          tags = ${d.tags}::text[], favicon = ${d.favicon}, nicho = ${d.nicho}, pais = ${d.pais},
          moeda = ${d.moeda}, updated_at = NOW()
      WHERE id = ${id} AND created_by = ${adminId}
      RETURNING id, tipo, titulo, conteudo, url, categoria, tags, fixado, favicon, nicho, pais, moeda, created_at, updated_at
    `
    if (!rows[0]) return { ok: false, error: "Item não encontrado." }
    return { ok: true, data: rows[0] as CerebroItem }
  } catch (error) {
    console.error("Cerebro update error:", error)
    return { ok: false, error: "Não foi possível salvar. Tente novamente." }
  }
}

export async function toggleCerebroFixado(id: number, fixado: boolean): Promise<Result<CerebroItem>> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, error: "Acesso negado." }
  try {
    const rows = await sql`
      UPDATE pg_cerebro SET fixado = ${fixado}, updated_at = NOW()
      WHERE id = ${id} AND created_by = ${adminId}
      RETURNING id, tipo, titulo, conteudo, url, categoria, tags, fixado, favicon, nicho, pais, moeda, created_at, updated_at
    `
    if (!rows[0]) return { ok: false, error: "Item não encontrado." }
    return { ok: true, data: rows[0] as CerebroItem }
  } catch (error) {
    console.error("Cerebro pin error:", error)
    return { ok: false, error: "Não foi possível fixar o item." }
  }
}

export async function deleteCerebroItem(id: number): Promise<Result<null>> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, error: "Acesso negado." }
  try {
    await sql`DELETE FROM pg_cerebro WHERE id = ${id} AND created_by = ${adminId}`
    return { ok: true, data: null }
  } catch (error) {
    console.error("Cerebro delete error:", error)
    return { ok: false, error: "Não foi possível excluir o item." }
  }
}

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase()
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.)/.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  if (h.startsWith("[") || h.includes(":")) return true
  return false
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

export async function fetchLinkMeta(rawUrl: string): Promise<Result<{ url: string; titulo: string; favicon: string | null }>> {
  const adminId = await getAdminId()
  if (!adminId) return { ok: false, error: "Acesso negado." }
  const url = normalizeUrl(rawUrl)
  if (!url) return { ok: false, error: "Endereço inválido." }
  const parsed = new URL(url)
  const fallbackTitle = parsed.hostname.replace(/^www\./, "")
  const favicon = faviconFor(url)
  if (isPrivateHost(parsed.hostname)) return { ok: true, data: { url, titulo: fallbackTitle, favicon } }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProGrowthCerebro/1.0)", Accept: "text/html" },
      redirect: "follow",
    })
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok || !type.includes("text/html")) return { ok: true, data: { url, titulo: fallbackTitle, favicon } }
    const html = (await res.text()).slice(0, 200000)
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const title = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1]
    const titulo = decodeEntities((og || title || fallbackTitle).trim()).slice(0, 200)
    return { ok: true, data: { url, titulo, favicon } }
  } catch {
    return { ok: true, data: { url, titulo: fallbackTitle, favicon } }
  }
}
