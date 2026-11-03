import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import bcrypt from "bcryptjs"

/** Salted scrypt format for staff credentials; never store submitted passwords. */
export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`
}

export async function verifyPassword(password: string, encoded: string) {
  if (/^\$2[aby]\$\d{2}\$/.test(encoded)) {
    try {
      // Older accounts in the imported database use bcrypt hashes.
      return await bcrypt.compare(
        password,
        encoded.startsWith("$2y$") ? `$2b$${encoded.slice(4)}` : encoded
      )
    } catch {
      return false
    }
  }

  const [algorithm, saltValue, hashValue] = encoded.split("$")
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false
  try {
    const expected = Buffer.from(hashValue, "base64url")
    const actual = scryptSync(
      password,
      Buffer.from(saltValue, "base64url"),
      expected.length
    )
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    )
  } catch {
    return false
  }
}
