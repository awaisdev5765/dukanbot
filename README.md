# DukanBot

DukanBot is a multi-tenant SaaS starter for Pakistani small businesses that want to turn WhatsApp conversations into organized orders. Merchants can manage a catalog, configure a WhatsApp bot, review conversations, track orders, inspect analytics, and use an AI assistant to understand customer requests.

The project is built for real merchant workflows: a customer chats on WhatsApp, the bot identifies intent and products, an order is persisted for the correct merchant, and the merchant can review or update it from the dashboard.

## Features

- Next.js App Router dashboard with responsive light/dark UI
- Supabase email/password authentication and Google OAuth callback
- Merchant onboarding, settings, admin console, and invitation flow
- Product catalog management with CSV import support
- WhatsApp Cloud API webhook, configuration, test, and simulation routes
- Conversation inbox with customer threads and order context
- Order table, Kanban view, status badges, detail drawer, and WhatsApp thread view
- Bot designer, default replies, live simulator, runtime configuration, and tenant isolation
- AI-assisted message handling through an OpenAI-compatible LLM wrapper
- Dashboard analytics for orders, revenue, products, and conversations
- SQL migrations for the base schema, bot hooks, WhatsApp merchant settings, and P0/P1 marketplace features
- Rate limiting, auth gates, Supabase server/client helpers, and service-role separation

## Tech stack

- **Framework:** Next.js 14, React 18, TypeScript
- **UI:** Tailwind CSS, Radix Slot, Lucide icons, Recharts
- **Data and auth:** Supabase Auth, PostgreSQL, Row Level Security
- **Messaging:** WhatsApp Cloud API webhook integration
- **AI:** OpenAI-compatible chat completion wrapper (`src/lib/llm.ts`)
- **Testing:** Vitest

## Repository layout

```text
src/app/              Public pages, auth routes, dashboard, and API routes
src/components/       Dashboard, bot, catalog, order, analytics, and UI components
src/lib/              Supabase clients, storage, bot runtime, LLM, analytics, and helpers
supabase/              Schema and incremental SQL migrations
scripts/               Local development helpers
GO_TO_MARKET_P0.md    Product launch priorities
V1_P1.md              V1 follow-up roadmap
RETENTION.md          Retention and lifecycle notes
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A Supabase project
- A Meta WhatsApp Business / Cloud API app for real message delivery
- An OpenAI-compatible API key if AI replies are enabled

## Local development

```bash
git clone https://github.com/awaisdev5765/dukanbot.git
cd dukanbot
npm install
cp .env.example .env.local
```

Fill in the required values in `.env.local`, then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run build       # Production build
npm run start       # Serve the production build
npm run lint        # Next.js lint checks
npm test            # Vitest suite
```

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and public anon/publishable key into `.env.local`.
3. Run the SQL files in the Supabase SQL Editor in this order:

   ```text
   supabase/schema.sql
   supabase/p0_market.sql
   supabase/p1_market.sql
   supabase/merchant_whatsapp.sql
   supabase/bot_hooks.sql
   ```

4. Keep Row Level Security enabled. The application resolves the authenticated merchant tenant server-side; never expose the service-role key to browser code.
5. Configure email and Google providers under **Authentication → Providers**.

## Environment variables

Start from `.env.example`. Important variables include:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only webhook/database operations |
| `OPENAI_API_KEY` | Optional AI reply and analysis provider |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API fallback token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp sending number |
| `WHATSAPP_VERIFY_TOKEN` | Meta webhook verification secret |
| `ADMIN_EMAILS` | Comma-separated platform admin emails |
| `NEXT_PUBLIC_DEMO_SEED` | Demo seed switch; keep `false` in production |

Never commit `.env.local`, access tokens, service-role keys, or production database exports.

## WhatsApp integration

1. Create/configure a Meta WhatsApp Business app.
2. Set the webhook URL to:

   ```text
   https://YOUR_DOMAIN/api/whatsapp/webhook
   ```

3. Use the verify token from `.env.local` when Meta verifies the webhook.
4. Configure the merchant phone number and access token from the dashboard’s **Connect WhatsApp** page, or use the server fallback variables for development.
5. Use `/api/whatsapp/test` and `/api/whatsapp/simulate` before sending real customer messages.

See the source under `src/app/api/whatsapp/` and `src/lib/whatsapp/` for payload handling and sending behavior.

## Security and tenancy

- Keep Supabase RLS policies active and test them with multiple merchants.
- Treat the service-role key, WhatsApp tokens, and AI keys as server-only secrets.
- Keep authentication enforcement enabled with `ENFORCE_AUTH=true`.
- Do not enable demo seeding in production.
- Review webhook signature/verification and rate limits before public launch.

## Deployment

The app can be deployed to Vercel or any Node-compatible Next.js host:

```bash
npm run build
npm run start
```

Set all production environment variables in the host’s secret manager and configure the production domain as an allowed Supabase redirect URL and Meta webhook URL.

## License

No open-source license has been published yet. All rights are reserved unless a license file is added to this repository.
