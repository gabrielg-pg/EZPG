import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { TODOS_OS_JOGOS } from "@/lib/pesquisa-jogos"

export const dynamic = "force-dynamic"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 7 dias em milissegundos (rate limit por email)
const RATE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Requisição inválida" },
        { status: 400 },
      )
    }

    const nome = String(body.nome ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const telefone = body.telefone ? String(body.telefone).trim() : null
    const jogosSelecionados: unknown = body.jogos_selecionados
    const outrosJogos = body.outros_jogos ? String(body.outros_jogos).trim().slice(0, 500) : null

    // Validações
    if (nome.length < 3) {
      return NextResponse.json(
        { success: false, error: "Nome deve ter ao menos 3 caracteres", field: "nome" },
        { status: 400 },
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: "Email inválido", field: "email" },
        { status: 400 },
      )
    }

    // Aceita apenas jogos da lista oficial, sem duplicatas
    const jogos = Array.isArray(jogosSelecionados)
      ? Array.from(new Set(jogosSelecionados.map((j) => String(j)))).filter((j) =>
          TODOS_OS_JOGOS.includes(j),
        )
      : []

    // É preciso selecionar ao menos um jogo da lista OU informar outros jogos
    if (jogos.length === 0 && !outrosJogos) {
      return NextResponse.json(
        {
          success: false,
          error: "Selecione ao menos um jogo ou informe outros",
          field: "jogos_selecionados",
        },
        { status: 400 },
      )
    }

    if (telefone && telefone.replace(/\D/g, "").length < 8) {
      return NextResponse.json(
        { success: false, error: "Telefone inválido", field: "telefone" },
        { status: 400 },
      )
    }

    // Rate limit: 1 resposta por email a cada 7 dias
    const existentes = await sql`
      SELECT id, data_resposta FROM pesquisa_jogos_2026
      WHERE email = ${email}
      ORDER BY data_resposta DESC
      LIMIT 1
    `

    if (existentes.length > 0) {
      const ultima = new Date(existentes[0].data_resposta).getTime()
      if (Date.now() - ultima < RATE_LIMIT_MS) {
        return NextResponse.json(
          { success: false, error: "Este email já respondeu recentemente", field: "email" },
          { status: 400 },
        )
      }
    }

    const inseridos = await sql`
      INSERT INTO pesquisa_jogos_2026 (nome, email, telefone, jogos_selecionados, outros_jogos)
      VALUES (${nome}, ${email}, ${telefone}, ${jogos}, ${outrosJogos})
      ON CONFLICT (email) DO UPDATE
        SET nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            jogos_selecionados = EXCLUDED.jogos_selecionados,
            outros_jogos = EXCLUDED.outros_jogos,
            data_resposta = CURRENT_TIMESTAMP,
            status = 'respondido'
      RETURNING id, data_resposta
    `

    return NextResponse.json({
      success: true,
      message: "Resposta registrada com sucesso",
      id: inseridos[0].id,
      timestamp: inseridos[0].data_resposta,
    })
  } catch (error) {
    console.error("[v0] Erro POST pesquisa-jogos:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao registrar resposta" },
      { status: 500 },
    )
  }
}
