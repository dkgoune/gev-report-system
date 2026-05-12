import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(
  password: string,
  storedPassword: string
): boolean {
  const parts = storedPassword.split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    // Backward compatibility for legacy plaintext rows.
    return password === storedPassword;
  }

  const [, salt, storedHashHex] = parts;
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
  const storedKey = Buffer.from(storedHashHex, "hex");

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}
