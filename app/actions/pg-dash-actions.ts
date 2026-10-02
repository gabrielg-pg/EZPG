"use server"

import { sql } from "@/lib/db"

export async function createPgDashTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_dash_accounts (
      id SERIAL PRIMARY KEY,
      brand_name VARCHAR(255) NOT NULL,
      login VARCHAR(255),
      password VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function getPgDashAccounts() {
  return await sql`SELECT * FROM pg_dash_accounts ORDER BY brand_name`
}

export async function createPgDashAccount(data: {
  brandName: string
  login: string
  password: string
  notes: string
}) {
  return await sql`
    INSERT INTO pg_dash_accounts (brand_name, login, password, notes)
    VALUES (${data.brandName}, ${data.login}, ${data.password}, ${data.notes})
    RETURNING *
  `
}

export async function updatePgDashAccount(
  id: number,
  data: {
    brandName: string
    login: string
    password: string
    notes: string
  },
) {
  return await sql`
    UPDATE pg_dash_accounts
    SET brand_name=${data.brandName}, login=${data.login}, password=${data.password}, notes=${data.notes}
    WHERE id=${id} RETURNING *
  `
}

export async function deletePgDashAccount(id: number) {
  return await sql`DELETE FROM pg_dash_accounts WHERE id=${id}`
}
