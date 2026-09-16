# 🌙 MindVault

A self-hosted personal diary and second-brain. A quiet room for your thoughts, feelings, and memories — not a productivity dashboard.

**Core promise:** whatever emotional state you are in, the app always feels welcoming and consistent.

## Features

- **Quick capture** — fastest action is writing a thought. Web, Telegram, or Mini App.
- **Auto-classification** — mood estimation, tags, and category are inferred from content (deterministic keyword engine, no LLM needed).
- **Journal timeline** — notes, brain dumps, ideas, promises, problems; grouped by day, filterable.
- **Memory vault** — Important / Promise / Idea / Problem cards with open → done/dropped lifecycle.
- **Mood tracker** — daily check-ins, 7/30/90-day views, averages, dominant mood, pattern detection ("anxiety trending up the last 3 days").
- **Reminders** — built-in morning check-in (default 08:00) and night reflection (default 22:00) rituals, plus custom daily reminders — all delivered to Telegram.
- **Telegram bot** — `/note /mood /dump /remind /memory /reflect /help`, plain text auto-saves, inline mood buttons, brain-dump mode.
- **Telegram Mini App** — full capture UI inside Telegram, login via initData HMAC verification.
- **Reflect** — rule-based 7-day pattern summary (no therapist claims, no LLM dependency).

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion
- API routes = backend (single process, VPS-friendly)
- Prisma + SQLite (backup = copy one file)
- Node long-poll worker (bot + reminder scheduler, no public webhook required)
- Telegram Bot API + WebApp (Mini App)

## Deploy (Docker)

```bash
cp .env.example .env
# edit .env: JWT_SECRET, TELEGRAM_BOT_TOKEN, APP_URL...
docker compose up -d --build
# app on http://127.0.0.1:8791 — put nginx/caddy/cloudflared in front
```

## Deploy (bare VPS)

```bash
cp .env.example .env
# edit .env: JWT_SECRET (required), APP_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME
npm install
npx prisma db push
npm run build
npm start            # web on :8791
npx tsx scripts/worker.ts   # bot + reminders
```

> `JWT_SECRET` is required in production — the app refuses to start (and the build fails) without it.

Suggested keep-alive cron (`/etc/cron.d/mindvault`):

```
*/2 * * * * root /path/to/mindvault/scripts/keep-alive.sh
```

## Telegram setup

1. Create a bot with @BotFather → get token.
2. Fill `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `APP_URL`, `TELEGRAM_WEBAPP_URL` in `.env`, restart worker.
3. In the web app: Settings → Telegram → **Generate link code** → send `/link CODE` to your bot.
4. Mini App: in BotFather set the menu button URL to `https://your-domain/mini` (signature-verified initData login).

Bot commands: `/note` (or just plain text) · `/mood` · `/dump` … `/done` · `/remind HH:MM msg` · `/reminders` · `/memory title | details` · `/reflect` · `/help`

Webhook alternative: set `TELEGRAM_WEBHOOK_SECRET` and point Telegram to `https://your-domain/api/telegram/hook` (secret-token header verified), then stop the poller worker.

## Security

- Passwords: bcrypt (cost 10). Sessions: JWT (HS256, 30d), secret from env.
- All data endpoints are user-scoped server-side (ownership checked per request).
- Telegram Mini App login verifies the initData HMAC per official spec + 24h freshness window.
- Webhook endpoint verifies `X-Telegram-Bot-Api-Secret-Token` when configured.
- Data stays on your server. SQLite file lives in `data/` — back it up with anything.

## Design — "Midnight Calm"

Palette: background `#0B1020` · surface `#151C32` · primary `#818CF8` · positive `#34D399` · highlight `#FBBF24`
Moods: happy `#34D399` · okay `#FBBF24` · sad `#60A5FA` · anxiety `#C084FC` · angry `#FB7185`

Glassmorphism cards, soft gradients, rounded corners, gentle motion. No pure black, no aggressive red, no corporate dashboard energy. Inter/Poppins, mobile-first, bottom nav on small screens.

## Structure

```
src/app/            web + mini pages, API routes
src/lib/            db, auth, mood engine, telegram, bot logic
scripts/worker.ts   long-poll bot + reminder scheduler
prisma/             schema (User, Entry, Memory, MoodLog, Reminder, LinkCode)
data/               SQLite database
```

## Philosophy

Whatever you feel — happy, sad, anxious, overwhelmed — opening MindVault should feel like walking into your own quiet room. Writing one line counts. Surviving today counts as a win.
