# myfpl.ai

An open-source, AI-inspired Fantasy Premier League dashboard that helps managers review squad health, captaincy options, transfer ideas, and upcoming fixture pressure.

Built to feel like a modern FPL analytics platform, the project combines official FPL data with custom scoring metrics inspired by the premium tools used by top managers.

## Why this project exists

Fantasy Premier League managers need more than raw stats. They need actionable guidance:

- Which players are safe picks this week?
- Who should be captain?
- Which squad members are carrying transfer risk?
- Who is the best differential option?
- Which players have a strong next-four-fixture profile?

This project turns those questions into a clean, fast dashboard for your team.

## Features

- Team overview with points, rank, squad value and bank
- Live FPL squad sync by team ID
- Captain recommendations based on form and fixture ease
- Transfer alerts for risky or underperforming players
- Minutes security and form-based player health scoring
- Differential player table for low-ownership punts
- Fixture and form trend visuals
- AI-style summary card for team rating and priority moves
- Cron-based stats refresh support for scheduled updates

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- PostgreSQL / Neon-ready database support
- FPL official API integration

## Project structure

```bash
app/
  api/
    cron/
    dashboard/
  page.tsx
components/
  AiInsights.tsx
  CaptainPicks.tsx
  DifferentialTable.tsx
  FormTrendChart.tsx
  Navbar.tsx
  SquadGrid.tsx
  TeamOverview.tsx
  TransferAlerts.tsx
lib/
  db.ts
  fpl-api.ts
  metrics.ts
  schema.sql
  __tests__/
types/
  fpl.ts
```

## Local setup

1. Clone the repository

```bash
git clone https://github.com/MannyG3/myfpl.ai.git
cd myfpl.ai
```

2. Install dependencies

```bash
npm install
```

3. Create your local environment file

```bash
cp .env.example .env.local
```

4. Update the environment values in `.env.local` with your FPL team ID and database settings.

Example:

```env
FPL_TEAM_ID="1523974"
DATABASE_URL="postgresql://user:password@host:5432/dbname"
CRON_SECRET="your-secret"
```

5. Run the app locally

```bash
npm run dev
```

Open http://localhost:3000

## Run tests

```bash
npm test
```

## Deployment on Vercel

This project is ready to deploy on Vercel as a Next.js app.

### Option 1: GitHub + Vercel dashboard

1. Push this repository to your GitHub account.
2. Go to https://vercel.com
3. Import the repository
4. Set framework to Next.js
5. Add the same environment variables from `.env.example`
6. Deploy

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel
```

For production:

```bash
vercel --prod
```

## Environment variables

The app expects the following values:

- `FPL_TEAM_ID`: your Fantasy Premier League team ID
- `DATABASE_URL`: PostgreSQL connection string for cached data
- `CRON_SECRET`: optional secret for scheduled refreshes

## Roadmap

Planned improvements for the open-source project:

- AI predictions for upcoming fixtures and captaincy picks
- mini-league comparison and rival analysis
- smarter ranking logic and weighted transfer recommendations
- user authentication and saved team profiles
- exportable reports for weekly planning
- public API for community integrations

## Contributing

Contributions are welcome.

If you want to help:

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request with a clear summary

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

- Official Fantasy Premier League API
- The FPL community for constant innovation in team analysis
- Contributors building better data-driven football tools
