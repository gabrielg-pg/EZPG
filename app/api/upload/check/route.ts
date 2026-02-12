import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ available: false }, { status: 503 })
  }
  return NextResponse.json({ available: true })
}
