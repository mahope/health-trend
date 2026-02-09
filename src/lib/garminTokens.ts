import type { GarminAccount } from "@prisma/client";
import { decryptJSON, encryptJSON } from "@/lib/crypto";

export type GarminTokens = {
  oauth1?: unknown;
  oauth2?: unknown;
  dumpedAt?: string;
  source?: string;
};

export function encryptGarminTokens(tokens: GarminTokens): string {
  return encryptJSON(tokens);
}

export function decryptGarminTokens(
  tokensEncrypted: GarminAccount["tokensEncrypted"],
): GarminTokens {
  return decryptJSON<GarminTokens>(tokensEncrypted);
}
