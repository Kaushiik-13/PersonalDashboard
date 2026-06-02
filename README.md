# Signal Desk

A personal developer intelligence dashboard for tracking high-signal updates across GitHub, AI tooling, open source models, design systems, and software development sources.

Reddit is intentionally skipped in this version.

## Stack

- Next.js App Router
- Supabase with Postgres
- TypeScript
- Dark black-and-white dashboard UI

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and add:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   GITHUB_TOKEN=
   ```

3. Run the SQL in `supabase/schema.sql` inside your Supabase SQL editor.

4. Start the app:

   ```bash
   npm run dev
   ```

The app uses mock dashboard signals until Supabase credentials are configured.

## GitHub pipeline

- `GET /api/github/signals` fetches live GitHub repository signals.
- `POST /api/github/refresh` fetches GitHub signals and saves them to Supabase when `SUPABASE_SERVICE_ROLE_KEY` is configured.
- `GITHUB_TOKEN` is optional, but recommended for higher GitHub API limits.

With the dev server running, test live GitHub fetch:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:3000/api/github/signals -UseBasicParsing
```

To refresh and save into Supabase:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:3000/api/github/refresh -Method POST -UseBasicParsing
```

Saving requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Keep that key private and never expose it with a `NEXT_PUBLIC_` prefix.
