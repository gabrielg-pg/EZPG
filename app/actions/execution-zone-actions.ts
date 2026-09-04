"use server"

import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export type ExecutionZoneCard = {
  id: number
  title: string
  subtitle: string
  description: string
  link: string
  icon_key: string
  color_key: string
  sort_order: number
}

const DEFAULT_CARDS: Omit<ExecutionZoneCard, "id">[] = [
  {
    title: "PG | TUTORIAIS",
    subtitle: "Base interna de conhecimento operacional",
    description:
      "Aqui ficam tutoriais práticos criados conforme demandas reais da operação. Esse banco serve para padronizar processos e acelerar a execução, além de facilitar o onboarding de novos colaboradores dentro da PRO GROWTH GLOBAL.",
    link: "https://drive.google.com/drive/u/0/folders/1u9mhu7Ud42Puo7uYPnUQs_lbtndk3ewU",
    icon_key: "book",
    color_key: "blue",
    sort_order: 0,
  },
  {
    title: "PG | TEMAS",
    subtitle: "Estruturas dos planos PRO GROWTH GLOBAL",
    description:
      "Repositório dos temas utilizados nos planos da PRO GROWTH GLOBAL: START GROWTH, PRO VÉRTEBRA, SCALE VÉRTEBRA e SCALE GLOBAL. Cada tema segue a estrutura validada de cada plano, garantindo consistência, padrão e replicabilidade das operações.",
    link: "https://drive.google.com/drive/u/0/folders/1FhdDr0GcgvmYMhdAiJibRYVP-HIc-x0s",
    icon_key: "palette",
    color_key: "purple",
    sort_order: 1,
  },
  {
    title: "PG | SCRIPTS",
    subtitle: "Comunicação operacional padronizada",
    description:
      "Zona dedicada aos scripts usados na execução diária da operação: boas-vindas em grupos, entrega de logotipo, logotipo aprovado/reprovado, entrega da loja. Comunicação com clientes em cada etapa do projeto. Tudo padronizado para manter clareza, profissionalismo e escala.",
    link: "https://drive.google.com/drive/u/0/folders/1H9XDD8wprHUC55obITqJV0v-RH8htRZP",
    icon_key: "message",
    color_key: "emerald",
    sort_order: 2,
  },
  {
    title: "PG | MINERAÇÃO DE PRODUTOS",
    subtitle: "Produtos e nichos já validados",
    description:
      "Estrutura em nuvem organizada por pastas, separadas por nichos validados. Aqui ficam processos, listas e materiais de mineração já testados, reduzindo risco e eliminando tentativas aleatórias.",
    link: "https://drive.google.com/drive/u/0/folders/1IamIrpizA3krNAkBlo33sKrSLM9VunMx",
    icon_key: "search",
    color_key: "amber",
    sort_order: 3,
  },
  {
    title: "PG | CÓDIGOS HTML",
    subtitle: "Recursos técnicos para Shopify",
    description:
      "Repositório de códigos HTML úteis para implementação em lojas Shopify. Utilizado para otimizações, ajustes técnicos e melhorias de conversão sem depender de desenvolvimento externo.",
    link: "https://drive.google.com/drive/u/0/folders/1IUZnZoziM576OAq99_Xcppq1BrbbVD_K",
    icon_key: "code",
    color_key: "rose",
    sort_order: 4,
  },
  {
    title: "PG | CRIATIVOS",
    subtitle: "Criação e organização de criativos para tráfego pago",
    description:
      "Área dedicada à criação, armazenamento e organização dos criativos utilizados nas campanhas. Criativos validados, variações por nicho, estruturas criativas usadas em escala e base histórica de anúncios para análise e melhoria de performance.",
    link: "https://drive.google.com/drive/u/0/folders/1UaLtpLBsUkOQzKzglRFp6SXjSdBKc2-3",
    icon_key: "target",
    color_key: "indigo",
    sort_order: 5,
  },
]

// Garante a tabela e a semeia (uma única vez) com os cards padrão
export async function createExecutionZoneCardsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_execution_zone_cards (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(500) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      link VARCHAR(1000) NOT NULL,
      icon_key VARCHAR(50) NOT NULL DEFAULT 'book',
      color_key VARCHAR(50) NOT NULL DEFAULT 'blue',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  const existing = await sql`SELECT COUNT(*)::int AS count FROM pg_execution_zone_cards`
  const count = (existing[0] as { count: number }).count
  if (count === 0) {
    for (const c of DEFAULT_CARDS) {
      await sql`
        INSERT INTO pg_execution_zone_cards (title, subtitle, description, link, icon_key, color_key, sort_order)
        VALUES (${c.title}, ${c.subtitle}, ${c.description}, ${c.link}, ${c.icon_key}, ${c.color_key}, ${c.sort_order})
      `
    }
  }
}

export async function getExecutionZoneCards(): Promise<ExecutionZoneCard[]> {
  const rows = await sql`
    SELECT id, title, subtitle, description, link, icon_key, color_key, sort_order
    FROM pg_execution_zone_cards
    ORDER BY sort_order ASC, id ASC
  `
  return rows as ExecutionZoneCard[]
}

export async function createExecutionZoneCard(data: {
  title: string
  subtitle: string
  description: string
  link: string
  icon_key?: string
  color_key?: string
}): Promise<{ success: boolean; error?: string; card?: ExecutionZoneCard }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }
  if (!data.title?.trim() || !data.subtitle?.trim() || !data.link?.trim()) {
    return { success: false, error: "Preencha título, subtítulo e link." }
  }

  try {
    const orderRows = await sql`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM pg_execution_zone_cards
    `
    const nextOrder = (orderRows[0] as { next_order: number }).next_order
    const rows = await sql`
      INSERT INTO pg_execution_zone_cards (title, subtitle, description, link, icon_key, color_key, sort_order)
      VALUES (
        ${data.title.trim()},
        ${data.subtitle.trim()},
        ${data.description?.trim() ?? ""},
        ${data.link.trim()},
        ${data.icon_key?.trim() || "book"},
        ${data.color_key?.trim() || "blue"},
        ${nextOrder}
      )
      RETURNING id, title, subtitle, description, link, icon_key, color_key, sort_order
    `
    revalidatePath("/zona-de-execucao")
    return { success: true, card: rows[0] as ExecutionZoneCard }
  } catch (error: unknown) {
    console.error("Create execution zone card error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao adicionar card: ${errorMessage}` }
  }
}

export async function updateExecutionZoneCard(data: {
  id: number
  title: string
  subtitle: string
  description: string
  link: string
  icon_key?: string
  color_key?: string
}): Promise<{ success: boolean; error?: string; card?: ExecutionZoneCard }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }
  if (!data.title?.trim() || !data.subtitle?.trim() || !data.link?.trim()) {
    return { success: false, error: "Preencha título, subtítulo e link." }
  }

  try {
    const rows = await sql`
      UPDATE pg_execution_zone_cards
      SET
        title = ${data.title.trim()},
        subtitle = ${data.subtitle.trim()},
        description = ${data.description?.trim() ?? ""},
        link = ${data.link.trim()},
        icon_key = COALESCE(${data.icon_key?.trim() || null}, icon_key),
        color_key = COALESCE(${data.color_key?.trim() || null}, color_key)
      WHERE id = ${data.id}
      RETURNING id, title, subtitle, description, link, icon_key, color_key, sort_order
    `
    if (rows.length === 0) {
      return { success: false, error: "Card não encontrado." }
    }
    revalidatePath("/zona-de-execucao")
    return { success: true, card: rows[0] as ExecutionZoneCard }
  } catch (error: unknown) {
    console.error("Update execution zone card error:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { success: false, error: `Erro ao editar card: ${errorMessage}` }
  }
}

export async function deleteExecutionZoneCard(id: number): Promise<{ success: boolean; error?: string }> {
  const { user } = await getSession()
  if (!user) {
    return { success: false, error: "Não autenticado" }
  }

  try {
    await sql`DELETE FROM pg_execution_zone_cards WHERE id = ${id}`
    revalidatePath("/zona-de-execucao")
    return { success: true }
  } catch (error) {
    console.error("Delete execution zone card error:", error)
    return { success: false, error: "Erro ao excluir card" }
  }
}
