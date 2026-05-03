# Codex Prompt 03 — Polish, Export & Deploy Prep

## Context
Continuing from CODEX_PROMPT_02. Dashboard is functional with map, table, filters, and stats.

---

## Task
Final polish pass + deploy prep for Vercel.

---

## Items

### 1. CSV Export Button
Add an "Export CSV" button to the top of `PermitTable`.
- Uses `papaparse` to convert filtered permits to CSV
- Triggers browser download: `permits-export-${Date.now()}.csv`
- Only exports currently filtered results

---

### 2. Empty States
Handle gracefully:
- No permits match filters → show message + "Clear Filters" button
- Loading state → skeleton rows in table, spinner on map
- API fetch failure → show banner "Using cached data" and fall back to sample JSON

---

### 3. Mobile Layout
- On screens < 768px:
  - FilterSidebar collapses to a "Filters" drawer (slide up from bottom or modal)
  - Map takes full width, fixed height 300px
  - Table scrolls below map
  - StatBar shows 2x2 grid instead of single row

---

### 4. Metadata & SEO
In `app/layout.tsx`:
```typescript
export const metadata = {
  title: 'Milwaukee Permit Dashboard | Together For Homes Coalition',
  description: 'Explore building permits across Milwaukee neighborhoods. Filter by type, status, date, and location.',
}
```

---

### 5. Vercel Deploy Config
Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

Create `.env.local.example` if not already done.

Update `README.md` with:
- Project description
- Stack
- How to run locally
- Environment variables needed
- Data source attribution (City of Milwaukee Open Data Portal)

---

### 6. Performance
- Memoize filter function with `useMemo`
- Memoize `StatBar` calculations with `useMemo`
- Lazy load `PermitTable` below the fold

---

## Output Expected
- Export works
- Empty/loading/error states handled
- Mobile layout functional
- README complete
- Ready to push to Vercel with `vercel --prod`
