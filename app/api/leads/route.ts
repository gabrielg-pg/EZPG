import { type NextRequest, NextResponse, after } from "next/server"
import { getSession } from "@/lib/auth"
import {
  ensureQuizLeadsTable,
  insertQuizLead,
  setQuizLeadCrmId,
  forwardLeadToCrm,
  listQuizLeads,
} from "@/lib/quiz-db"
import { QUIZ_QUESTIONS, type QuizAnswers } from "@/lib/quiz"

export const dynamic = "force-dynamic"

// POST /api/leads — recebe o lead do quiz (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Corpo inválido" }, { status: 400 })
    }

    const nome = typeof body.nome === "string" ? body.nome.trim() : ""
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const respostasRaw = (body.respostas ?? {}) as Record<string, unknown>

    // Validação dos campos obrigatórios
    if (nome.length < 2) {
      return NextResponse.json({ success: false, error: "Nome inválido" }, { status: 400 })
    }
    const digits = whatsapp.replace(/\D/g, "")
    if (digits.length < 10) {
      return NextResponse.json({ success: false, error: "WhatsApp inválido" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "E-mail inválido" }, { status: 400 })
    }

    // Sanitiza respostas: aceita apenas ids de perguntas e valores de opções válidos
    const respostas: QuizAnswers = {}
    for (const q of QUIZ_QUESTIONS) {
      const val = respostasRaw[q.id]
      if (typeof val === "string" && q.options.some((o) => o.value === val)) {
        respostas[q.id] = val
      }
    }

    await ensureQuizLeadsTable()

    // Insere no Neon (fonte da verdade) — score/perfil recalculados no servidor
    const inserted = await insertQuizLead({ nome, whatsapp, email, respostas })

    // Envia ao CRM após a resposta ser enviada ao lead (best-effort, não bloqueia o redirect)
    after(async () => {
      const crmId = await forwardLeadToCrm({
        nome,
        whatsapp,
        email,
        score: inserted.score,
        perfil: inserted.perfil,
        respostas,
        pontos: inserted.pontos,
        created_at: new Date().toISOString(),
      })
      if (crmId) await setQuizLeadCrmId(inserted.id, crmId).catch(() => {})
    })

    return NextResponse.json({
      success: true,
      id: inserted.id,
      score: inserted.score,
      perfil: inserted.perfil,
    })
  } catch (error) {
    console.error("[v0] POST /api/leads error:", error)
    return NextResponse.json({ success: false, error: "Erro ao salvar lead" }, { status: 500 })
  }
}

// GET /api/leads?action=list — lista os leads (restrito, lê do Neon)
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action")
  if (action !== "list") {
    return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 })
  }

  const { user } = await getSession()
  if (!user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
  }
  const roles = (user.roles ?? [user.role]).map((r) => r.toLowerCase())
  if (!roles.some((r) => ["admin", "comercial", "gestor_ads"].includes(r))) {
    return NextResponse.json({ success: false, error: "Sem permissão" }, { status: 403 })
  }

  try {
    await ensureQuizLeadsTable()
    const leads = await listQuizLeads()
    return NextResponse.json({ success: true, leads })
  } catch (error) {
    console.error("[v0] GET /api/leads error:", error)
    return NextResponse.json({ success: false, error: "Erro ao listar leads" }, { status: 500 })
  }
}
