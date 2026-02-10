import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export async function GET(req: Request) {
  const rl = rateLimit(req, { name: "auth", limit: 60, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const res = await handler.GET(req);
  for (const [k, v] of Object.entries(rl.headers)) res.headers.set(k, v);
  return res;
}

export async function POST(req: Request) {
  const rl = rateLimit(req, { name: "auth", limit: 30, windowMs: 60_000 });
  if (!rl.ok) return rl.response;

  const res = await handler.POST(req);
  for (const [k, v] of Object.entries(rl.headers)) res.headers.set(k, v);
  return res;
}
