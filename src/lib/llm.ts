/**
 * Single LLM wrapper — swap model/provider here without touching business logic.
 */
import { assertLlmBudget } from "@/lib/llm-budget";

const MODEL = "gpt-4o-mini";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  temperature?: number;
  maxTokens?: number;
};

export function isLlmConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function chat(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  assertLlmBudget();

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

/** Ask the model for JSON; strips markdown fences if present. */
export async function chatJson<T>(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<T> {
  const raw = await chat(messages, {
    ...options,
    temperature: options.temperature ?? 0.2,
  });
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned) as T;
}
