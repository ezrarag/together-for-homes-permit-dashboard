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

## Client Embed Snippet

Drop this `<iframe>` anywhere on the Together For Homes site. Replace
`YOUR_DOMAIN` with the deployed URL (e.g. `permits.togetherforhomes.org`):

```html
<iframe
  src="https://YOUR_DOMAIN/embed/permit-dashboard"
  width="100%"
  height="900"
  style="border:none;border-radius:8px;overflow:hidden;min-height:720px"
  title="Milwaukee Permit Dashboard – Together For Homes"
  loading="lazy"
  allowfullscreen
></iframe>
```

The embed route strips the full-page chrome and works at 360 px (mobile),
768 px (tablet), and 1200 px (desktop) without horizontal scroll. The stat bar
collapses to a 2 × 2 grid on narrow screens and expands to 4 columns above
640 px.

### Vercel environment variable

Before deploying to production, set **`EMBED_FRAME_ANCESTORS`** in the Vercel
dashboard (Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `EMBED_FRAME_ANCESTORS` | `https://togetherforhomes.org https://www.togetherforhomes.org` |

Set it for the **Production** environment only; leave it unset on Preview and
Development so local iframe testing keeps working.

**What happens if you forget:** in production without this variable the embed
route defaults to `frame-ancestors 'self'`, which blocks cross-origin framing
and prints a warning in the Vercel build log. The dashboard itself still works;
only the `<iframe>` embed is locked out.

All other routes already send `X-Frame-Options: SAMEORIGIN` to prevent
clickjacking on the standalone dashboard.

## Deploy

The project includes `vercel.json` for Next.js deployment.

```bash
vercel --prod
```

## Known Security Maintenance

`npm audit --omit=dev` reports two remaining advisories in Next.js 14
(moderate DoS + PostCSS XSS) that require upgrading to Next.js 16 — a breaking
change deferred post-MVP. The project is pinned to `next@14.2.35`, the latest
14.x patch. Schedule the Next 16 upgrade as a post-launch task and re-run
`npm audit` after upgrading.
