# Milwaukee Permit Dashboard

Public-facing permit dashboard for the Together For Homes Coalition. The app
helps residents, advocates, and partners explore Milwaukee building permit
activity by type, status, issue date, ZIP code, and location.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- React Leaflet and Leaflet
- Recharts
- Firebase package ready for future Firestore integration
- PapaParse for CSV export

## Run Locally

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Environment Variables

Create `.env.local` from `.env.local.example`.

```bash
NEXT_PUBLIC_MILWAUKEE_OPEN_DATA_URL=https://data.milwaukee.gov/resource/4uui-hhe4.json
```

## Data Source

Permit data is fetched from the City of Milwaukee Open Data Portal through its
Socrata API endpoint:

`https://data.milwaukee.gov/resource/4uui-hhe4.json`

If the API request fails, the dashboard falls back to local sample data and
shows a cached-data banner.

## Deploy

The project includes `vercel.json` for Next.js deployment.

```bash
vercel --prod
```
