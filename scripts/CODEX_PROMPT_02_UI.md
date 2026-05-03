# Codex Prompt 02 — UI Components & Dashboard

## Context
Continuing from CODEX_PROMPT_01. Project is scaffolded, types are defined, data layer is built.
Run `npm run dev` and confirm it starts before proceeding.

---

## Task
Build all UI components and wire up the main dashboard page.

---

## Design Direction
- Dark background: `#0a0a0a` / `bg-zinc-950`
- Accent: `#22c55e` (green-500) for open/active permits, red for expired, amber for pending
- Clean, data-forward aesthetic — think public transparency tool, not a marketing site
- Mobile responsive: stack FilterSidebar above map on mobile, sidebar left on desktop

---

## Components to Build

### `components/StatBar.tsx`
Top bar showing summary counts:
- Total Permits
- Open
- Closed
- Expired/Pending
- Average project value (formatted as $)

Props: `permits: Permit[]`

---

### `components/FilterSidebar.tsx`
Left sidebar with filter controls:
- Text search input (searches address, contractor, description)
- Permit Type select (All, New Construction, Renovation, Demolition, Electrical, Plumbing, Mechanical, Other)
- Status select (All, Open, Closed, Expired, Pending)
- ZIP Code input
- Date Range: From / To date inputs
- "Clear Filters" button

Props:
```typescript
filters: PermitFilters
onChange: (filters: PermitFilters) => void
```

---

### `components/PermitMap.tsx`
Leaflet map (dynamic import, SSR disabled) showing permit pins.

- Default center: Milwaukee `[43.0389, -87.9065]`, zoom 12
- Pin color by status:
  - open: green
  - closed: gray
  - expired: red
  - pending: amber
- Click pin → show popup with: address, type, status, issued date, value
- Use `react-leaflet` CircleMarker for performance

Props: `permits: Permit[]`, `onSelectPermit: (permit: Permit) => void`

---

### `components/PermitTable.tsx`
Sortable table showing filtered permits.

Columns: Address, Type, Status, Issued Date, Value, Neighborhood, ZIP

- Click column header to sort asc/desc
- Status shown as colored badge
- Value formatted as currency
- Click row → highlight on map (if possible via shared state)
- Paginate: 25 per page with prev/next controls

Props: `permits: Permit[]`

---

### `app/dashboard/page.tsx`
Wire everything together:

```
Layout:
[StatBar - full width]
[FilterSidebar | PermitMap     ]  ← desktop: 280px sidebar + flex-1 map
[             | PermitTable    ]  ← table below map, same column
```

State to manage:
- `permits`: full fetched list
- `filtered`: result of applying `PermitFilters` to `permits`
- `filters`: current `PermitFilters` state
- `loading`: boolean
- `selectedPermit`: `Permit | null`

On mount: fetch from Milwaukee open data API via `fetchMilwaukeePermits()`. Fall back to sample JSON if fetch fails.

Filter logic: pure client-side filter function over the `permits` array. Apply all active filters simultaneously.

---

## Notes
- `PermitMap` must use `dynamic(() => import(...), { ssr: false })` — Leaflet breaks with SSR
- Import Leaflet CSS in the map component: `import 'leaflet/dist/leaflet.css'`
- Fix Leaflet default icon issue with:
```typescript
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: '...', iconUrl: '...', shadowUrl: '...' });
```

---

## Output Expected
- All components built and wired
- Dashboard renders with real or sample data
- Map, filters, table, and stats all functional
- No TypeScript or build errors
