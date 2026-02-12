import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json(
        { error: "Configuração de upload não encontrada. Verifique a integração Blob." },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validate file type (images and common reference formats)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use imagens, PDF ou ZIP." },
        { status: 400 },
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo: 10MB" }, { status: 400 })
    }

    const blob = await put(`logo-references/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Upload error message:", errorMessage)
    return NextResponse.json({ error: `Erro ao fazer upload: ${errorMessage}` }, { status: 500 })
  }
}
