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

## Data Source

Permit data is fetched server-side from the City of Milwaukee Open Data Portal
through CKAN:

`https://data.milwaukee.gov/api/3/action/datastore_search?resource_id=828e9630-d7cb-42e4-960e-964eae916397`

The dashboard uses a 12-hour revalidation window. The first page and summary
are rendered server-side; later table pages and filtered exports load through
`/api/permits`.

## Security Note

`npm audit --omit=dev` currently reports remaining advisories in Next.js 14 that
require a future major Next upgrade. This project is pinned to `next@14.2.35`,
the latest 14.x patch used for the MVP.

## Deploy

The project includes `vercel.json` for Next.js deployment.

```bash
vercel --prod
```
