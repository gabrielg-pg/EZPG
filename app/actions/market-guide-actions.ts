"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export type Market = {
  id: number; name: string; slug: string; flag: string; language: string; currency: string; status: "active" | "archived"; sort_order: number; updated_at: string; updated_by_name: string | null; section_count: number
}
export type MarketSection = { id: number; title: string; section_key: string | null; section_type: "text" | "key_value" | "table"; content: Record<string, unknown>; sort_order: number; visible: boolean }

const DEFAULT_SECTIONS = [
  ["Método de Envio", "shipping", "key_value"], ["Códigos de Desconto Shopify", "discounts", "table"], ["Termos Utilizados", "terms", "table"], ["Domínio", "domain", "key_value"], ["E-mail", "email", "key_value"], ["Pagamentos", "payments", "key_value"], ["Páginas Legais", "legal", "table"], ["Observações Gerais", "notes", "text"],
] as const

async function access() {
  const session = await getSession()
  if (!session.user) redirect("/login")
  const roles = new Set([session.user.role, ...(session.user.roles ?? [])].map((r) => r.toLowerCase()))
  const admin = roles.has("admin")
  if (!admin && !roles.has("zona_execucao")) redirect("/dashboard")
  return { user: session.user, admin }
}

async function admin() { const result = await access(); if (!result.admin) redirect("/dashboard"); return result.user }
function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 130) }

export async function getMarkets(query = ""): Promise<Market[]> {
  await access(); const q = `%${query.trim()}%`
  return await sql`SELECT m.id, m.name, m.slug, m.flag, m.language, m.currency, m.status, m.sort_order, m.updated_at, u.name AS updated_by_name, COUNT(s.id)::int AS section_count FROM pg_market_guides m LEFT JOIN users u ON u.id = m.updated_by LEFT JOIN pg_market_guide_sections s ON s.market_id = m.id AND s.visible = true WHERE m.status = 'active' AND (m.name ILIKE ${q} OR m.language ILIKE ${q} OR m.currency ILIKE ${q} OR EXISTS (SELECT 1 FROM pg_market_guide_sections sx WHERE sx.market_id=m.id AND sx.content::text ILIKE ${q})) GROUP BY m.id, u.name ORDER BY m.sort_order, m.name` as Market[]
}

export async function getMarket(slug: string) {
  await access(); const rows = await sql`SELECT m.id, m.name, m.slug, m.flag, m.language, m.currency, m.status, m.sort_order, m.updated_at, u.name AS updated_by_name FROM pg_market_guides m LEFT JOIN users u ON u.id=m.updated_by WHERE m.slug=${slug} LIMIT 1`
  if (!rows[0]) return null
  const sections = await sql`SELECT id, title, section_key, section_type, content, sort_order, visible FROM pg_market_guide_sections WHERE market_id=${rows[0].id} AND (visible=true OR ${await isAdmin()}=true) ORDER BY sort_order, id`
  return { market: rows[0] as Market, sections: sections as MarketSection[] }
}

async function isAdmin() { const s=await getSession(); return !!s.user && new Set([s.user.role,...(s.user.roles??[])]).has("admin") }

export async function createMarket(input: { name: string; flag: string; language: string; currency: string }) { const user=await admin(); const name=input.name.trim(); if(!name) return {error:"Informe o nome do mercado."}; const slug=slugify(name); try { const r=await sql`INSERT INTO pg_market_guides (name,slug,flag,language,currency,updated_by) VALUES (${name},${slug},${input.flag||"🌐"},${input.language.trim()},${input.currency.trim()},${user.id}) RETURNING slug`; const marketId=(await sql`SELECT id FROM pg_market_guides WHERE slug=${r[0].slug}`)[0].id; for(const [i,s] of DEFAULT_SECTIONS.entries()) await sql`INSERT INTO pg_market_guide_sections (market_id,title,section_key,section_type,sort_order) VALUES (${marketId},${s[0]},${s[1]},${s[2]},${i})`; revalidatePath("/guia-de-mercados"); return {slug:r[0].slug} } catch { return {error:"Já existe um mercado com esse nome."} } }

export async function updateMarket(id:number, input:{name:string;flag:string;language:string;currency:string}) { const user=await admin(); const name=input.name.trim(); const slug=slugify(name); await sql`UPDATE pg_market_guides SET name=${name},slug=${slug},flag=${input.flag},language=${input.language.trim()},currency=${input.currency.trim()},updated_by=${user.id},updated_at=NOW() WHERE id=${id}`; revalidatePath("/guia-de-mercados"); return {slug} }

export async function archiveMarket(id:number) { const user=await admin(); await sql`UPDATE pg_market_guides SET status='archived',updated_by=${user.id},updated_at=NOW() WHERE id=${id}`; revalidatePath("/guia-de-mercados"); revalidatePath("/guia-de-mercados/[slug]", "page") }

export async function duplicateMarket(id: number) {
  const user = await admin()
  const source = await sql`SELECT name, flag, language, currency FROM pg_market_guides WHERE id=${id} LIMIT 1`
  if (!source[0]) return { error: "Mercado não encontrado." }
  const name = `${source[0].name} (cópia)`
  const slug = `${slugify(String(source[0].name))}-${Date.now().toString(36)}`
  const created = await sql`INSERT INTO pg_market_guides (name,slug,flag,language,currency,updated_by) VALUES (${name},${slug},${source[0].flag},${source[0].language},${source[0].currency},${user.id}) RETURNING id, slug`
  await sql`INSERT INTO pg_market_guide_sections (market_id,title,section_key,section_type,content,sort_order,visible) SELECT ${created[0].id},title,section_key,section_type,content,sort_order,visible FROM pg_market_guide_sections WHERE market_id=${id}`
  revalidatePath("/guia-de-mercados")
  return { slug: created[0].slug }
}

export async function updateSection(id:number, input:{title:string;content:Record<string,unknown>;visible:boolean}) { const user=await admin(); await sql`UPDATE pg_market_guide_sections SET title=${input.title.trim()},content=${JSON.stringify(input.content)}::jsonb,visible=${input.visible},updated_at=NOW() WHERE id=${id}`; await sql`UPDATE pg_market_guides SET updated_by=${user.id},updated_at=NOW() WHERE id=(SELECT market_id FROM pg_market_guide_sections WHERE id=${id})`; revalidatePath("/guia-de-mercados", "layout") }

export async function createSection(marketId:number, input:{title:string;sectionType:"text"|"key_value"|"table"}) { await admin(); const r=await sql`SELECT COALESCE(MAX(sort_order),-1)+1 AS next FROM pg_market_guide_sections WHERE market_id=${marketId}`; await sql`INSERT INTO pg_market_guide_sections (market_id,title,section_type,sort_order) VALUES (${marketId},${input.title.trim()},${input.sectionType},${r[0].next})`; revalidatePath("/guia-de-mercados", "layout") }

export async function reorderSections(ids:number[]) { await admin(); for(const [i,id] of ids.entries()) await sql`UPDATE pg_market_guide_sections SET sort_order=${i} WHERE id=${id}`; revalidatePath("/guia-de-mercados", "layout") }

export async function deleteSection(id:number) { await admin(); await sql`DELETE FROM pg_market_guide_sections WHERE id=${id}`; revalidatePath("/guia-de-mercados", "layout") }

export async function getAdminAccess() { return (await access()).admin }
