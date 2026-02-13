type JsonObject = Record<string, unknown>;

export async function openaiJson(
  prompt: string,
  opts?: { model?: string; temperature?: number },
): Promise<JsonObject> {
  const apiKey = process.env.ORDBOGEN_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ORDBOGEN_API_KEY (or OPENAI_API_KEY)");
  }

  const res = await fetch("https://api.ordbogen.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts?.model || process.env.ORDBOGEN_MODEL || "odin-medium",
      temperature: opts?.temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du er en sundhedsassistent. Svar altid i JSON, på dansk, og vær konkret. Ingen disclaimers.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI error (${res.status}): ${text.slice(0, 500)}`);
  }

  const json = JSON.parse(text) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI response missing message.content");
  }
  return JSON.parse(content) as JsonObject;
}
