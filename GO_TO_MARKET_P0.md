# DukanBot — P0 go-to-market checklist

Ship these before charging customers.

## 1. Database (run in Supabase SQL Editor)

1. `supabase/schema.sql` (if not already)
2. `supabase/bot_hooks.sql`
3. `supabase/merchant_whatsapp.sql`
4. **`supabase/p0_market.sql`** ← multi-tenant resolve + bot FAQ columns

Then set each merchant’s `whatsapp_phone_number_id` (Settings → WhatsApp) so the webhook routes to the right shop.

## 2. Production env (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # prefer legacy eyJ… anon JWT
SUPABASE_SERVICE_ROLE_KEY=             # required for webhook persist + tenant resolve
OPENAI_API_KEY=
LLM_MAX_CALLS_PER_HOUR=200             # soft cost guard
WHATSAPP_TOKEN=                        # fallback only; prefer per-merchant DB token
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
ENFORCE_AUTH=true                      # default in production anyway
NEXT_PUBLIC_DEMO_SEED=false            # never seed fake catalog/orders
```

Do **not** set `NEXT_PUBLIC_DEMO_SEED=true` in production.

## 3. Meta WhatsApp (production number)

- [ ] Move off Meta test number to a **real Business number** customers can message
- [ ] Create a **System User** permanent token (not a 24h user token)
- [ ] Callback URL: `https://YOUR_DOMAIN/api/whatsapp/webhook`
- [ ] Verify token matches merchant / env
- [ ] Subscribe app to **messages** on the WABA
- [ ] Stable domain (Vercel) — not a trycloudflare quick tunnel

## 4. Product gates (implemented in code)

| Item | Status |
|------|--------|
| Multi-tenant webhook via `phone_number_id` | Done |
| Bot designer → Supabase merchants columns | Done |
| Demo seeds off in production | Done |
| Auth enforce on `/dashboard` in prod | Done |
| Forgot password | Done |
| Privacy / Terms pages | Done |
| LLM hourly call budget | Done |
| Real billing (JazzCash / Stripe / etc.) | **Still manual / TODO** |
| Embedded Signup (Meta) | **Ops TODO** |
| Monitoring (Sentry / logs alerts) | **Ops TODO** |

## 5. Smoke test before first invoice

1. Fresh signup → empty catalog (no demo products)
2. Add 2 products → save bot welcome + FAQ → reload (values from DB)
3. Save WA phone number ID + token → send test template
4. Customer messages production number → order appears under **that** merchant
5. Escalate / takeover in inbox still works
6. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set (else persist silently no-ops under RLS)

## 6. Billing note

Until card/JazzCash is wired, charge via invoice and flip `merchants.plan` manually. Do not enable public “Start paid plan” checkout until a payment provider is live.
