# Life RPG Tracker

A gamified habit and life-tracking app built with Next.js, Supabase Auth, and Prisma (PostgreSQL).

## Features

- Habit tracking with streaks, XP, levels, and achievements
- Courses with lesson progress and weekly boss challenges
- Meditation and reading logs
- Weekly reviews, todos, stats, and reward vault

## Prerequisites

- Node.js 20+
- A Supabase project (Auth + PostgreSQL)
- npm

## Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase database URLs and auth keys from the Supabase dashboard.

3. Apply the database schema:

```bash
# For local development (no migration history yet)
npx prisma db push

# Or create a baseline migration once DIRECT_URL is configured
npx prisma migrate dev --name init
```

4. Optional: seed demo data (requires an existing Supabase user or seed script user):

```bash
npm run db:seed
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up via Supabase email/password on the login page.

## Architecture notes

- **Server Actions** handle mutations (habits, courses, mind, review, settings). Legacy REST routes under `app/api` were removed.
- **Page data loaders** in `lib/page-data/` provide cached Prisma reads for SSR pages.
- **Auth** uses Supabase client-side sign-in; the app resolves the viewer via `lib/viewer.ts`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run prisma:migrate` | Create/apply Prisma migrations |
| `npm run db:seed` | Seed demo data |

## Deploy

Deploy to Vercel (or similar) and set the same environment variables. Use the Supabase connection pooler URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`.
