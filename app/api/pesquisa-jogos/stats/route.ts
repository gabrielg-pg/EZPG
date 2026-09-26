import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const totalRows = await sql`SELECT COUNT(*)::int AS total FROM pesquisa_jogos_2026`
    const total = totalRows[0]?.total ?? 0

    // Desagrega o array de jogos e conta votos por jogo
    const topRows = await sql`
      SELECT jogo AS nome, COUNT(*)::int AS votos
      FROM pesquisa_jogos_2026, UNNEST(jogos_selecionados) AS jogo
      GROUP BY jogo
      ORDER BY votos DESC, jogo ASC
    `

    return NextResponse.json({
      total_respostas: total,
      top_jogos: topRows.map((r) => ({ nome: r.nome, votos: r.votos })),
      data_coleta: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Erro GET stats pesquisa-jogos:", error)
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 })
  }
}
