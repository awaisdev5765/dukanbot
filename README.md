# DukanBot

SaaS WhatsApp order bot for Pakistani small businesses.

## Phase 1 (done)

- Next.js 14 App Router + TypeScript + Tailwind
- Design tokens (deep teal accent, light/dark)
- Minimal shadcn-style UI (`Button`, `Input`, `Label`)
- Supabase Auth (email + Google OAuth callback)
- Login / Signup / Onboarding stubs + middleware protection
- Postgres schema in `supabase/schema.sql`
- LLM wrapper stub: `src/lib/llm.ts` (`gpt-4o-mini`)

## Setup

```bash
cd ~/dukanbot
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Then paste `supabase/schema.sql` into the Supabase SQL Editor and run it.

Enable Email + Google providers under Authentication → Providers.

## Next

Phase 2 — marketing landing page. Reply **continue** when ready.
