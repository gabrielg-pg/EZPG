// Este módulo é usado apenas por server actions ("use server") — nunca importe no cliente.
import crypto from "node:crypto"

// Criptografia das credenciais dos Acessos (AES-256-GCM).
//
// A chave é derivada de um segredo do servidor via scrypt. Preferimos
// NEXUS_CRED_SECRET quando disponível; caso contrário derivamos de DATABASE_URL
// (nunca exposto ao cliente). O texto puro da senha JAMAIS é enviado ao frontend
// nem gravado em logs.

const SALT = "nexus-growth::cred::v1"

function getKey(): Buffer {
  const secret =
    process.env.NEXUS_CRED_SECRET ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  if (!secret) {
    throw new Error("Nenhum segredo disponível para criptografar credenciais")
  }
  return crypto.scryptSync(secret, SALT, 32)
}

// Formato de saída: v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [
    "v1",
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":")
}

export function decryptSecret(payload: string): string {
  if (!payload) return ""
  const parts = payload.split(":")
  if (parts.length !== 4 || parts[0] !== "v1") {
    // Não é um payload válido — retorna vazio em vez de vazar dado bruto.
    return ""
  }
  try {
    const key = getKey()
    const iv = Buffer.from(parts[1], "base64")
    const authTag = Buffer.from(parts[2], "base64")
    const ciphertext = Buffer.from(parts[3], "base64")
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString("utf8")
  } catch (error) {
    console.error("[nexus-crypto] Falha ao descriptografar credencial")
    return ""
  }
}
