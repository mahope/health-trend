import crypto from "node:crypto";

function keyFromEnv(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("Missing ENCRYPTION_KEY");

  // Accept either:
  // - 32+ chars string (we sha256 it)
  // - base64 of 32 bytes
  try {
    const raw = Buffer.from(key, "base64");
    if (raw.length === 32) return raw;
  } catch {
    // ignore
  }

  return crypto.createHash("sha256").update(key, "utf8").digest();
}

export function encryptJSON(data: unknown): string {
  const key = keyFromEnv();
  const iv = crypto.randomBytes(12); // GCM recommended 12 bytes

  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  // v1:<base64(iv)>.<base64(tag)>.<base64(ciphertext)>
  return `v1:${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptJSON<T = unknown>(payload: string): T {
  const key = keyFromEnv();
  if (!payload.startsWith("v1:")) throw new Error("Unsupported encryption payload");

  const rest = payload.slice(3);
  const [ivB64, tagB64, encB64] = rest.split(".");
  if (!ivB64 || !tagB64 || !encB64) throw new Error("Invalid encryption payload");

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(encB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
