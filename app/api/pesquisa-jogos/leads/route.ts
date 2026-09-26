import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

const POR_PAGINA = 20

export async function GET(request: Request) {
  try {
    // Somente usuários logados podem listar os leads
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const pagina = Math.max(1, Number.parseInt(searchParams.get("pagina") ?? "1", 10) || 1)
    const busca = (searchParams.get("busca") ?? "").trim().toLowerCase()
    const filtroJogo = (searchParams.get("filtro_jogo") ?? "").trim()
    const ordenar = searchParams.get("ordenar") ?? "data"
    const direcao = searchParams.get("direcao") === "asc" ? "asc" : "desc"
    const offset = (pagina - 1) * POR_PAGINA

    const buscaLike = busca ? `%${busca}%` : null

    // Total filtrado
    const totalRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM pesquisa_jogos_2026
      WHERE (${buscaLike}::text IS NULL OR LOWER(nome) LIKE ${buscaLike} OR LOWER(email) LIKE ${buscaLike})
        AND (${filtroJogo || null}::text IS NULL OR ${filtroJogo} = ANY(jogos_selecionados))
    `
    const total = totalRows[0]?.total ?? 0

    // Ordenação segura (whitelist)
    const orderCol =
      ordenar === "nome" ? "nome" : ordenar === "email" ? "email" : "data_resposta"

    // neon serverless não parametriza ORDER BY, então montamos com valores já validados
    const leads = await sql.query(
      `SELECT id, nome, email, telefone, jogos_selecionados, data_resposta, status
       FROM pesquisa_jogos_2026
       WHERE ($1::text IS NULL OR LOWER(nome) LIKE $1 OR LOWER(email) LIKE $1)
         AND ($2::text IS NULL OR $2 = ANY(jogos_selecionados))
       ORDER BY ${orderCol} ${direcao.toUpperCase()}
       LIMIT $3 OFFSET $4`,
      [buscaLike, filtroJogo || null, POR_PAGINA, offset],
    )

    return NextResponse.json({
      total,
      pagina,
      por_pagina: POR_PAGINA,
      total_paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
      leads,
    })
  } catch (error) {
    console.error("[v0] Erro GET leads pesquisa-jogos:", error)
    return NextResponse.json({ error: "Erro ao carregar respostas" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    await sql`DELETE FROM pesquisa_jogos_2026 WHERE id = ${id}::uuid`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro DELETE lead pesquisa-jogos:", error)
    return NextResponse.json({ error: "Erro ao excluir resposta" }, { status: 500 })
  }
}
