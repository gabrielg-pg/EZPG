"use server"

import { sql } from "@/lib/db"

export async function createCofreTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pg_cofre (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      login VARCHAR(255),
      password VARCHAR(255),
      site VARCHAR(500),
      category VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

export async function getCofreItems() {
  return await sql`SELECT * FROM pg_cofre ORDER BY category, name`
}

export async function createCofreItem(data: {
  name: string
  login: string
  password: string
  site: string
  category: string
  notes: string
}) {
  return await sql`
    INSERT INTO pg_cofre (name, login, password, site, category, notes)
    VALUES (${data.name}, ${data.login}, ${data.password}, ${data.site}, ${data.category}, ${data.notes})
    RETURNING *
  `
}

export async function updateCofreItem(
  id: number,
  data: {
    name: string
    login: string
    password: string
    site: string
    category: string
    notes: string
  },
) {
  return await sql`
    UPDATE pg_cofre SET name=${data.name}, login=${data.login}, password=${data.password}, site=${data.site}, category=${data.category}, notes=${data.notes}
    WHERE id=${id} RETURNING *
  `
}

export async function deleteCofreItem(id: number) {
  return await sql`DELETE FROM pg_cofre WHERE id=${id}`
}
