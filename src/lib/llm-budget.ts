/**
 * Soft LLM budget guard — limits chat() calls per process hour.
 * Set LLM_MAX_CALLS_PER_HOUR (default 200 in prod, 2000 in dev).
 */
const windowMs = 60 * 60 * 1000;
let windowStart = Date.now();
let callsInWindow = 0;

function maxCalls() {
  const raw = process.env.LLM_MAX_CALLS_PER_HOUR;
  if (raw && Number.isFinite(Number(raw))) return Number(raw);
  return process.env.NODE_ENV === "production" ? 200 : 2000;
}

export function assertLlmBudget() {
  const now = Date.now();
  if (now - windowStart > windowMs) {
    windowStart = now;
    callsInWindow = 0;
  }
  if (callsInWindow >= maxCalls()) {
    throw new Error(
      `LLM budget exceeded (${maxCalls()} calls/hour). Try again later or raise LLM_MAX_CALLS_PER_HOUR.`
    );
  }
  callsInWindow += 1;
}

export function llmBudgetSnapshot() {
  return {
    callsInWindow,
    max: maxCalls(),
    windowStartedAt: new Date(windowStart).toISOString(),
  };
}
