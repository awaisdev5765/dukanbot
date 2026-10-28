#!/usr/bin/env bash
# Public tunnel for Meta WhatsApp webhooks → local Next.js :3000
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -s -o /dev/null -w '' http://localhost:3000; then
  echo "Start the app first: npm run dev"
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Installing cloudflared..."
  brew install cloudflare/cloudflare/cloudflared
fi

echo ""
echo "When the URL appears, set Meta webhook to:"
echo "  https://YOUR_SUBDOMAIN.trycloudflare.com/api/whatsapp/webhook"
echo "Verify token: dukanbot_verify"
echo "Subscribe field: messages"
echo ""
exec cloudflared tunnel --url http://localhost:3000
