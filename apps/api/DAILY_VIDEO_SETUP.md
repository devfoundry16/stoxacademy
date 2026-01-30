# Daily.co Video Meeting Setup

Live sessions use [Daily.co](https://daily.co) for in-app video meetings. The API creates a room when an admin creates a session and issues time-limited meeting tokens to enrolled participants.

## API environment

Add to `apps/api/.env`:

```env
DAILY_API_KEY=your_daily_api_key
```

Optional:

```env
DAILY_API_URL=https://api.daily.co/v1
DAILY_DOMAIN=your-domain
```

- Get `DAILY_API_KEY` from the [Daily.co dashboard](https://dashboard.daily.co/) (Developer → API keys).
- `DAILY_DOMAIN` is used only when building the room URL for the token response if `meeting_url` is not stored (e.g. legacy sessions). New sessions store the room URL from Daily when the room is created.

## Database migration

Run the migration to add video room fields to `live_sessions`:

```bash
# From project root or apps/api, run against your Supabase DB
psql $DATABASE_URL -f apps/api/migrations/add_video_room_to_live_sessions.sql
```

Or run the SQL in the Supabase SQL editor.

## Web app

Install the Daily client in the web app (if not already installed):

```bash
cd apps/web && pnpm add @daily-co/daily-js
```

No web env vars are required; the API returns the room URL and token to the client.

## Flow

1. **Admin creates session** – API creates a Daily room, stores `video_room_name` and `video_provider: 'daily'`, and saves the room URL in `meeting_url`.
2. **Participant pays** – Enrollment is recorded in `user_live_sessions`.
3. **Participant joins** – Client requests `GET /api/live-sessions/:sessionId/meeting-token` (auth required). API checks enrollment and session window, then returns a short-lived token and room URL. The client embeds Daily Prebuilt and joins with the token.
