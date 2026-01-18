"use server"

import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import crypto from "crypto"

type LoginFail = { success: false; error: string }

type SessionUser = {
  id: number
  username: string
  name: string
  role: string
  roles: string[]
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * LOGIN (Server Action)
 * - Se ok: cria sessão + seta cookie + redirect("/dashboard")
 * - Se erro: retorna { success:false, error:"..." }
 *
 * IMPORTANTE: redirect() fora de try/catch.
 */
export async function login(username: string, password: string): Promise<LoginFail | void> {
  const identifier = (username ?? "").trim()
  const pass = password ?? ""

  if (!identifier || !pass) return { success: false, error: "Informe usuário e senha" }

  try {
    const usersRes: any = await sql`
      SELECT id, username, password_hash, name, role, status
      FROM users
      WHERE (username = ${identifier} OR email = ${identifier})
        AND status = 'ativo'
      LIMIT 1
    `
    const users = (usersRes?.rows ?? usersRes) as any[]

    if (!users || users.length === 0) {
      return { success: false, error: "Usuário não encontrado ou inativo" }
    }

    const user = users[0]
    const isValid = await verifyPassword(pass, user.password_hash)

    if (!isValid) {
      return { success: false, error: "Senha incorreta" }
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // cookies(): em alguns setups o TS reclama. Runtime funciona.
    const cookieStore: any = cookies()
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })
  } catch (err) {
    console.error("Login error:", err)
    return { success: false, error: "Erro ao fazer login" }
  }

  redirect("/dashboard")
}

export async function logout(): Promise<void> {
  const cookieStore: any = cookies()
  const token = cookieStore.get("session_token")?.value

  try {
    if (token) {
      await sql`DELETE FROM sessions WHERE token = ${token}`
    }
  } catch (err) {
    console.error("Logout error:", err)
  } finally {
    cookieStore.delete("session_token")
  }

  redirect("/")
}

export async function getSession(): Promise<{ user: SessionUser | null }> {
  try {
    const cookieStore: any = cookies()
    const token = cookieStore.get("session_token")?.value
    if (!token) return { user: null }

    const sessionRes: any = await sql`
      SELECT s.token, s.expires_at,
             u.id as user_id, u.username, u.name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
        AND u.status = 'ativo'
      LIMIT 1
    `
    const sessions = (sessionRes?.rows ?? sessionRes) as any[]
    if (!sessions || sessions.length === 0) return { user: null }

    const session = sessions[0]

    // user_roles pode não existir/estar vazio -> fallback pro users.role
    const rolesRes: any = await sql`
      SELECT role FROM user_roles WHERE user_id = ${session.user_id}
    `
    const userRoles = (rolesRes?.rows ?? rolesRes) as any[]

    const roles =
      userRoles && userRoles.length > 0
        ? userRoles.map((r) => String(r.role).toLowerCase())
        : [String(session.role).toLowerCase()]

    return {
      user: {
        id: Number(session.user_id),
        username: String(session.username),
        name: String(session.name),
        role: String(session.role),
        roles,
      },
    }
  } catch (err) {
    console.error("Session error:", err)
    return { user: null }
  }
}

export async function requireAuth() {
  const { user } = await getSession()
  if (!user) redirect("/")
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.roles.includes("admin")) redirect("/dashboard")
  return user
}

export async function requireComercialOrAdmin() {
  const user = await requireAuth()
  if (!user.roles.includes("admin") && !user.roles.includes("comercial")) {
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
  roles?: string[]
}): Promise<{ success: boolean; error?: string; userId?: number }> {
  try {
    const passwordHash = await hashPassword(data.password)

    const res: any = await sql`
      INSERT INTO users (username, email, password_hash, name, role, status)
      VALUES (${data.username}, ${data.email}, ${passwordHash}, ${data.name}, ${data.role}, 'ativo')
      RETURNING id
    `
    const rows = (res?.rows ?? res) as any[]
    const userId = rows?.[0]?.id

    if (!userId) return { success: false, error: "Erro ao criar usuário" }

    const rolesToInsert = data.roles && data.roles.length > 0 ? data.roles : [data.role]
    for (const role of rolesToInsert) {
      await sql`
        INSERT INTO user_roles (user_id, role)
        VALUES (${userId}, ${String(role).toLowerCase()})
        ON CONFLICT DO NOTHING
      `
    }

    return { success: true, userId: Number(userId) }
  } catch (error: any) {
    console.error("Create user error:", error)
    if (error?.code === "23505") return { success: false, error: "Usuário ou email já existe" }
    return { success: false, error: "Erro ao criar usuário" }
  }
}

export async function initializeAdminUser(): Promise<void> {
  try {
    const gabrielRes: any = await sql`SELECT id FROM users WHERE username = 'GabrielPG' LIMIT 1`
    const rows = (gabrielRes?.rows ?? gabrielRes) as any[]

    if (!rows || rows.length === 0) {
      const passwordHash = await hashPassword("Gab211223@")

      await sql`
        INSERT INTO users (username, email, password_hash, name, role, status)
        VALUES ('GabrielPG', 'gabriel@progrowth.com', ${passwordHash}, 'Gabriel', 'admin', 'ativo')
        ON CONFLICT (username) DO NOTHING
      `
    }

    await sql`DELETE FROM users WHERE username = 'admin'`
  } catch (err) {
    console.error("Initialize admin error:", err)
  }
}
