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
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Run the SQL in `supabase/schema.sql` inside your Supabase SQL editor.

4. Start the app:

   ```bash
   npm run dev
   ```

The app uses mock dashboard signals until Supabase credentials are configured.
