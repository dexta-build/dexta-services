import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * One-time tokens for invite and password-reset links. Only the SHA-256
 * hash is stored, so a database leak doesn't expose usable links.
 */
export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
