/** Demo seed data — never auto-insert in production unless explicitly enabled. */
export function allowDemoSeed() {
  if (process.env.NEXT_PUBLIC_DEMO_SEED === "true") return true;
  if (process.env.NEXT_PUBLIC_DEMO_SEED === "false") return false;
  return process.env.NODE_ENV !== "production";
}
