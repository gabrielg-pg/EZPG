import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL)

async function updatePasswords() {
  // Generate bcrypt hash for the new password
  const newPassword = "#Eusoupro76"
  const passwordHash = await bcrypt.hash(newPassword, 10)
  
  console.log("Generated hash:", passwordHash)
  
  // Update passwords for the specified users
  const usernames = ["GuilhermePG", "LuisPG", "LuizGabrielPG"]
  
  for (const username of usernames) {
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE username = ${username}
    `
    console.log(`Updated password for ${username}`)
  }
  
  console.log("All passwords updated successfully!")
}

updatePasswords().catch(console.error)
