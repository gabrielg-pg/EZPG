"use server"

import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

// bcrypt hash (para criar usuário)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// bcrypt verify (CORRETO)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const identifier = username.trim()

    const users = await sql`
      SELECT id, username, password_hash, name, role, status
      FROM users
      WHERE (username = ${identifier} OR email = ${identifier})
        AND status = 'ativo'
    `

    if (users.length === 0) {
      return { success: false, error: "Usuário não encontrado ou inativo" }
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return { success: false, error: "Senha incorreta" }
    }

    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Erro ao fazer login" }
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session_token")?.value

  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
    cookieStore.delete("session_token")
  }
}

export async function getSession(): Promise<{
  user: { id: number; username: string; name: string; role: string } | null
}> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session_token")?.value

    if (!token) {
      return { user: null }
    }

    const sessions = await sql`
      SELECT s.*, u.id as user_id, u.username, u.name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
        AND u.status = 'ativo'
    `

    if (sessions.length === 0) {
      return { user: null }
    }

    const session = sessions[0]
    return {
      user: {
        id: session.user_id,
        username: session.username,
        name: session.name,
        role: session.role,
      },
    }
  } catch (error) {
    console.error("Session error:", error)
    return { user: null }
  }
}

export async function requireAuth() {
  const { user } = await getSession()
  if (!user) {
    redirect("/")
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== "admin") {
    redirect("/dashboard")
  }
  return user
}

export async function requireComercialOrAdmin() {
  const user = await requireAuth()
  if (user.role !== "admin" && user.role !== "comercial") {
    redirect("/dashboard")
  }
  return user
}

export async function createUser(data: {
  username: string
  email: string
  password: string
  name: string
  role: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(data.password)

    await sql`
      INSERT INTO users (username, email, password_hash, name, role, status)
      VALUES (${data.username}, ${data.email}, ${passwordHash}, ${data.name}, ${data.role}, 'ativo')
    `

    return { success: true }
  } catch (error: unknown) {
    console.error("Create user error:", error)
    if (error && typeof error === "object" && "code" in error && (error as any).code === "23505") {
      return { success: false, error: "Usuário ou email já existe" }
    }
    return { success: false, error: "Erro ao criar usuário" }
  }
}

// Initialize admin user with correct hash
export async function initializeAdminUser(): Promise<void> {
  try {
    const gabrielExists = await sql`SELECT id FROM users WHERE username = 'GabrielPG'`

    if (gabrielExists.length === 0) {
      // Senha do GabrielPG (ajuste se quiser outra)
      const passwordHash = await hashPassword("Gab211223@")

      await sql`
        INSERT INTO users (username, email, password_hash, name, role, status)
        VALUES ('GabrielPG', 'gabriel@progrowth.com', ${passwordHash}, 'Gabriel', 'admin', 'ativo')
        ON CONFLICT (username) DO NOTHING
      `
    }

    // Remove o usuário admin padrão se existir
    await sql`DELETE FROM users WHERE username = 'admin'`
  } catch (error) {
    console.error("Initialize admin error:", error)
  }
}
