# Personal Dashboard Project Status

## Goal

Build a personal dashboard that brings multiple useful information sources into one clean place.

The first source we decided to build is **GitHub developer signals**:

- Trending or recently active repositories
- AI tooling repositories
- Claude / Claude Code / MCP related repositories
- Open source LLM and agent tooling repositories
- Design and developer productivity repositories

We decided to skip Reddit for now.

## What We Have Done So Far

### 1. Created the Next.js App

The project has been created in:

```text
D:\Projects\PersonalDashboard
```

The app uses:

- Next.js App Router
- TypeScript
- Supabase client
- Lucide icons
- Dark black-and-white dashboard UI

Main files:

```text
app/page.tsx
app/globals.css
lib/supabase.ts
lib/github.ts
lib/supabase-admin.ts
supabase/schema.sql
```

### 2. Built the First Dashboard UI

We created an initial dashboard screen with:

- Sidebar navigation
- Dashboard quick cards
- Dev Signals preview
- Today Focus section
- Sources section
- Dark theme styling

The current UI is only a temporary base. We agreed that the dashboard design will be improved later.

### 3. Added Supabase Configuration

The project now reads Supabase credentials from:

```text
.env.local
```

Current expected environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_TOKEN=
```

Important:

- `NEXT_PUBLIC_SUPABASE_URL` is safe for frontend use.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is safe for frontend use.
- `SUPABASE_SERVICE_ROLE_KEY` is private and must never be exposed in frontend code.
- `GITHUB_TOKEN` is optional, but useful for higher GitHub API rate limits.

### 4. Created the Supabase Schema

We created the `signals` table using:

```text
supabase/schema.sql
```

The table stores normalized dashboard signals.

Important columns:

- `provider`
- `external_id`
- `title`
- `source`
- `category`
- `url`
- `summary`
- `why_it_matters`
- `stars`
- `growth`
- `score`
- `tags`
- `published_at`

We also added a unique index:

```sql
create unique index if not exists signals_provider_external_id_idx
  on public.signals (provider, external_id);
```

This lets the app update existing GitHub repo rows instead of creating duplicates every time the pipeline runs.

### 5. Built the GitHub Pipeline

We added a GitHub fetcher in:

```text
lib/github.ts
```

It searches GitHub repositories using watch topics such as:

- `ai`
- `llm`
- `agents`
- `mcp`
- `claude`
- `developer-tools`
- `coding-agent`
- `open-source-llm`
- `design-system`
- `typescript`

The pipeline:

1. Searches GitHub repositories by topic.
2. Combines results from multiple searches.
3. Deduplicates repositories.
4. Converts each repository into a dashboard `Signal`.
5. Scores each signal.
6. Returns the top results.

### 6. Added API Routes

We added two API routes.

Fetch live GitHub signals:

```text
GET /api/github/signals
```

Refresh GitHub signals and save them to Supabase:

```text
POST /api/github/refresh
```

The refresh endpoint works like this:

1. Fetch GitHub repository signals.
2. Normalize the data.
3. Save rows into Supabase.
4. Upsert by `provider` and `external_id`.

### 7. Verified That the Pipeline Works

We tested the refresh endpoint with:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:3000/api/github/refresh -Method POST -UseBasicParsing
```

It returned:

```text
StatusCode: 200 OK
```

This confirms:

- GitHub fetch works.
- The API endpoint works.
- Supabase insert/upsert works.
- The dashboard can show real GitHub signal data.

Examples of real repos that appeared:

- `apache/doris`
- `supabase/supabase`
- `deepset-ai/haystack`
- `koala73/worldmonitor`
- `elizaOS/eliza`
- `openclaw/openclaw`

## Current Working State

### Works Now

- Next.js app runs locally.
- Dashboard page loads.
- GitHub signal pipeline fetches real repositories.
- GitHub signals can be saved into Supabase.
- Supabase schema is created.
- Dashboard shows GitHub signal preview.
- Mock fallback data exists if live data is unavailable.

### Local Run Command

Start the app:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://127.0.0.1:3000
```

Refresh GitHub data:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:3000/api/github/refresh -Method POST -UseBasicParsing
```

## What Is Still Left

### 1. Build the Dedicated Dev Signals Page

Right now GitHub results only appear in a small preview section on the dashboard.

We still need a proper `Dev Signals` page with:

- Full list of GitHub signals
- Filters by category
- Search
- Sort by score
- Sort by stars
- Sort by last updated
- Save button
- Ignore/hide button
- Repo details view

This should be the next major feature.

### 2. Improve the Dashboard Design Later

The current dashboard is functional, but not final.

We already noticed:

- It still feels visually rough.
- The spacing and hierarchy need improvement.
- The quick cards are placeholders.
- The dashboard should become a calm overview, not a dense feed.

We agreed to postpone dashboard design until the data pipelines are working.

### 3. Add More Data Sources

After GitHub is stable, possible next sources:

- Hacker News
- Hugging Face models
- arXiv papers
- Product Hunt
- OpenAI news
- Anthropic news
- GitHub releases for watched repositories

Reddit is intentionally skipped for now.

### 4. Add Saved and Ignored Items

We need database support for:

- Saved items
- Hidden/ignored items
- Maybe user notes
- Maybe manual priority labels

This will make the dashboard more personal and less noisy.

### 5. Improve GitHub Ranking

Current scoring is basic.

Future scoring should consider:

- Stars
- Recent activity
- Star growth if available
- Topic relevance
- Whether it matches personal watch keywords
- Whether it is from a trusted org
- Whether it is a repo, release, or tool announcement

### 6. Add Scheduled Refresh

Currently the GitHub pipeline runs manually through:

```text
POST /api/github/refresh
```

Later, this should run automatically:

- Daily
- Every few hours
- Or on app startup

Possible options:

- Vercel Cron
- Supabase Edge Function
- Local scheduled script
- Manual refresh button in the UI

### 7. Add Better Error and Status UI

Right now errors are mostly visible through API responses or terminal output.

We should add UI for:

- Last refresh time
- Number of rows saved
- GitHub API error
- Supabase connection status
- Empty states
- Loading states

## Important Notes

### Service Role Key

The Supabase service role key is private.

It should only be used server-side:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose it as:

```env
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
```

If the service role key is ever shared publicly, rotate it in Supabase.

### Current Dashboard Look

If the dashboard still looks mostly the same, that is expected.

The current work was focused on the GitHub data pipeline, not final dashboard design.

## Recommended Next Step

The next best step is:

```text
Build the dedicated Dev Signals page.
```

That page should make the GitHub pipeline feel real by showing all saved GitHub results properly, instead of only showing a small preview on the dashboard.
