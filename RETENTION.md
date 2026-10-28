# Data backup & retention (P1)

## What we store
- Merchant accounts, catalog, orders (keep)
- Conversation `messages` jsonb (chat transcripts)
- `wa_send_log` / `notification_log` (ops)

## Backup
Use Supabase dashboard **Database → Backups** (Pro) or nightly `pg_dump` of the project.

Suggested schedule: daily logical backup, 14–30 day retention.

## Retention (chat bodies)
Run periodically (cron / Supabase scheduled function) with the service role:

```sql
-- Clear message bodies older than 365 days; prune send logs
select public.purge_old_chat_payloads(365);
```

Orders and customer phone/name stay; only bulky chat JSON is cleared.

Default policy for paying merchants: **365 days** of chat payload. Adjust per contract.

## Merchant deletion
Deleting a user cascades `merchants` → products/orders/conversations (see schema FKs).

## Compliance note
Share this policy on `/privacy`. Update if you contract shorter retention for clinics/health data.
