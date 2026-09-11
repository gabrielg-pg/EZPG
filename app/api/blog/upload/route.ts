import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"

const ALLOWED = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  // Garante acesso ao módulo Blog (admin ou permissão "blog").
  const user = await requireAuth()
  const roles = (user.roles ?? [user.role]).map((r) => (r ?? "").toLowerCase())
  if (!roles.some((r) => ["admin", "blog"].includes(r))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo maior que 5MB." }, { status: 400 })
    }

    const blob = await put(`blog/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url, filename: file.name })
  } catch (error) {
    console.error("[v0] Blog upload error:", error)
    return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
  }
}
