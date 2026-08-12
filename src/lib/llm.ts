/**
 * Single LLM wrapper — swap model/provider here without touching business logic.
 */
const MODEL = "gpt-4o-mini";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  temperature?: number;
  maxTokens?: number;
};

export async function chat(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 512,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
