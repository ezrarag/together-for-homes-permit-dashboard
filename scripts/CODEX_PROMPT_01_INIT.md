# Codex Prompt 01 — Project Init & Data Layer

## Project
Together For Homes Coalition — Permit Dashboard
Client: Solana Patterson-Ramos, Advocacy Manager
Stack: Next.js 14 App Router, Tailwind CSS, Recharts, Leaflet/React-Leaflet, Firebase/Firestore

---

## Task
Scaffold the full project structure and build the data layer for a public-facing permit dashboard.

## Steps

### 1. Init Next.js App
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### 2. Install Dependencies
```bash
npm install recharts leaflet react-leaflet @types/leaflet firebase papaparse @types/papaparse lucide-react
```

### 3. Create the following folder structure:
```
app/
  page.tsx               # Dashboard landing (redirects to /dashboard)
  dashboard/
    page.tsx             # Main permit dashboard
  layout.tsx
components/
  PermitMap.tsx          # Leaflet map with permit pins
  PermitTable.tsx        # Sortable, searchable table
  FilterSidebar.tsx      # Filters: type, status, date range, ZIP/neighborhood
  StatBar.tsx            # Summary stats across top
  PermitCard.tsx         # Mobile card view per permit
lib/
  permits.ts             # Data fetching + normalization functions
  types.ts               # TypeScript types
  milwaukee-open-data.ts # Milwaukee open data API client
data/
  sample-permits.json    # Seeded sample data for development
```

### 4. Define Types in `lib/types.ts`
```typescript
export type PermitStatus = 'open' | 'closed' | 'expired' | 'pending';

export type PermitType =
  | 'new_construction'
  | 'renovation'
  | 'demolition'
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'other';

export interface Permit {
  id: string;
  address: string;
  neighborhood: string;
  zipCode: string;
  permitType: PermitType;
  status: PermitStatus;
  issuedDate: string;        // ISO date string
  expirationDate?: string;
  contractor?: string;
  owner?: string;
  description?: string;
  value?: number;            // Estimated project value in USD
  lat: number;
  lng: number;
}

export interface PermitFilters {
  type?: PermitType | 'all';
  status?: PermitStatus | 'all';
  zipCode?: string;
  neighborhood?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
```

### 5. Build Milwaukee Open Data Client in `lib/milwaukee-open-data.ts`

Milwaukee's open data portal (data.milwaukee.gov) exposes permit data via Socrata API.
Endpoint: `https://data.milwaukee.gov/resource/4uui-hhe4.json`

Fetch, normalize to our `Permit` type, and export:
```typescript
export async function fetchMilwaukeePermits(limit = 500): Promise<Permit[]>
```

Map these Socrata fields to our type:
- `permit_no` → id
- `address` → address
- `permit_type` → permitType (normalize to our enum)
- `status` → status
- `issue_date` → issuedDate
- `expire_date` → expirationDate
- `estimated_value` → value
- `latitude`, `longitude` → lat, lng
- `neighborhood` → neighborhood
- `zip` → zipCode

If lat/lng are missing, skip the record.

### 6. Seed `data/sample-permits.json`
Create 20 realistic Milwaukee permit records using the `Permit` type. Spread across neighborhoods: Walker's Point, Bay View, Riverwest, Harambee, Bronzeville. Mix of types and statuses.

### 7. Env Setup
Create `.env.local.example`:
```
NEXT_PUBLIC_MILWAUKEE_OPEN_DATA_URL=https://data.milwaukee.gov/resource/4uui-hhe4.json
```

---

## Output Expected
- Full scaffolded Next.js 14 app
- Types defined
- Milwaukee open data client built
- Sample data seeded
- App runs with `npm run dev` without errors
