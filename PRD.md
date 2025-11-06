# Product Requirements Document (PRD)

## 0. Summary

A React/Next.js application that visualizes an organization's system architecture and user journeys. It renders systems as nodes, connections as edges, highlights paths for selected journeys, supports pan/zoom/drag, multi-select, per-environment overlays with health badges, connection-group (layer) filters, mini-map, auto-fit to selection, and right-panel details. All content (systems, connections, journeys, metadata) is stored as JSON. Journeys live under the repo path `journeys/<hierarchy>/.../*.journey.json` (the folder hierarchy defines the journey organization displayed in the left panel, sorted alphabetically by filename, with an optional `label` field in each JSON file to override the display name), and the app exposes a consolidated virtual document at `journeys/all.journey.json`.

**UI tech:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui (assumption: "shaven" refers to shadcn/ui), compact-friendly components.

**Primary users:** Platform/SRE, Solution Architects, App Developers, PMs.

**Goals:**

* Give a live explorable map of systems and integrations.
* Let stakeholders load/select a journey and instantly see the involved systems and connections.
* Enable quick ownership/doc discovery for any node/edge.
* Keep data in git-friendly JSON for review/PRs.

---

## 1. Scope & Non‑Goals

### In Scope

* Visualization of systems and connections.
* Journey-based filtering/highlighting with fade for non-participants.
* Left panel (journeys, search, layers), center canvas (graph), right panel (details).
* Pan/drag, rubber-band multi-select, manual reposition, Save positions, Auto-arrange.
* Mini-map + auto-fit-to-selection.
* Per-env overlays and health badges (dev/stage/prod).
* Connection groups via tags + layer filters.
* JSON-driven with file-based routing for journeys and an aggregated `all.journey.json`.
* Basic authentication-ready skeleton (optional feature flag).
* Telemetry hooks (page views, feature usage events).

### Out of Scope (v1)

* Real-time sync with CMDB/IaC (provide importer hooks only).
* RBAC editing UI (view-first; write/edit may be v1.1).
* Multi-tenant partitioning (single org instance; can be extended later).

---

## 2. Success Metrics

* **Discovery time:** Time to find owners/docs for a connection < 15s (p75).
* **Graph usability:** Pan/zoom FPS ≥ 55 on graphs ≤ 500 nodes/800 edges on modern laptops.
* **Data friction:** PR-only changes to JSON; deploy within standard CI (no DB migrations needed).
* **Adoption:** ≥ 3 teams use journeys weekly by week 4.

---

## 3. Personas & Use Cases

* **SRE/Platform:** triage an outage → select affected journey → inspect edges and credentials aliases → find docs.
* **Architect:** communicate integration changes → drag nodes to tidy layout → save positions to repo.
* **PM:** review scope coverage for a journey → confirm owners/docs exist.
* **Developer:** confirm endpoint/port/protocol for a connection; view health per env.

Key jobs:

1. *See what matters for a journey* (filter/highlight).
2. *Answer who owns this and where's the doc* (right panel metadata).
3. *Tidy and persist layout* (drag + save positions).
4. *Navigate big graphs* (mini-map + fit-to-selection).

---

## 4. Requirements

### 4.1 Functional

1. **Load data** from JSON files:

   * Systems (`systems.json`), Connections (`connections.json`), Journeys (many `*.journey.json` under `journeys/**`).
   * Expose `/api/journeys` to list all journeys with hierarchy/path metadata.
   * Expose `/api/journeys/all` to return a consolidated journey (`all.journey.json` logic).
   * **Bootstrap on empty data:** On first run, if the `DATA_ROOT` (default `./data`) is missing or contains no JSON files, the app **auto-populates** it with deterministic sample files: `systems.json`, `connections.json`, and a small hierarchy under `journeys/` (so the app is usable out-of-the-box). Bootstrap happens once unless `SEED_OVERWRITE=true`.
2. **Journey selection** highlights participating nodes/edges and fades others.
3. **Search** over journey names/tags and system names/domain/ip/tags.
4. **Layers tab** toggles connection groups based on connection `tags`.
5. **Env overlay**: choose `dev | stage | prod`; nodes/edges show `status[env]` as badge color.
6. **Canvas interactions**:

   * Pan/zoom; shift+drag rubber-band selection; drag nodes to reposition.
   * **Save positions** persists current node coordinates into systems JSON.
   * **Auto-arrange** clears manual positions and uses layout engine (dagre fallback to grid).
   * **Mini-map** with viewport and click-to-jump.
   * **Fit** centers and scales to the selection (journey/multi-select/single).
7. **Right panel** shows details for selected system/connection including `owners[]`, `docs[]`.
8. **Credential aliases** displayed for connections; no secrets stored.
9. **All JSON is git-friendly**; no DB. Hot reload during dev.

### 4.2 Non-Functional

* **Performance:** initial render < 1500ms (p75) for medium graphs (~150 nodes/250 edges). Progressive enhancements for larger.
* **Accessibility:** keyboard focus ring on list items; WCAG AA text contrast in panels; tooltips not essential for core info.
* **Security:** no secrets in JSON; CORS restricted; optional basic auth header middleware for non-public deployments.
* **Resilience:** graceful fallback if dagre is unavailable (grid layout); file read errors surfaced with helpful messages.

---

## 5. Information Architecture & Data Model

### 5.1 File Layout (repo)

```
/data
  systems.json
  connections.json
  journeys/
    commerce/checkout/guest.journey.json
    commerce/payments/card-auth-capture.journey.json
    platform/events/order-placed.journey.json
    all.journey.json                  (virtual: served by API, optional materialized on build)
```

### 5.2 Journey JSON Schema (draft)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Journey",
  "type": "object",
  "required": ["id", "name", "connections"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "label": { "type": "string", "description": "Optional UI display name to override the default (filename or name)." },
    "description": { "type": "string" },
    "connections": { "type": "array", "items": { "type": "string" } },
    "systems": { "type": "array", "items": { "type": "string" } },
    "owners": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": { "name": {"type":"string"}, "email": {"type":"string"}, "slack": {"type":"string"} }
      }
    },
    "docs": { "type": "array", "items": { "type": "object", "properties": { "title": {"type":"string"}, "url": {"type":"string"} } } },
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}
```

**Display rules in left panel**

* **Grouping** mirrors the folder path under `data/journeys/**`.
* **Ordering** is alphabetical by **filename** within each folder.
* **Display name** is: `label` if present; otherwise `name`; otherwise the filename without extension.

**Example (`label` override):**

```json
{
  "id": "commerce/payments/card-auth-capture",
  "name": "Card Auth & Capture Flow",
  "label": "💳 Card Payment (Happy Path)",
  "connections": ["c1","c2","c6","c3"],
  "tags": ["payments"],
  "owners": [{ "name": "Pay Lead", "email": "paylead@example.com" }]
}
```

### 5.3 Systems & Connections (superset)

```ts
// System
{
  id: string;
  name: string;
  domain?: string; ip?: string; description?: string;
  tags?: string[];
  owners?: { name: string; email?: string; slack?: string }[];
  docs?: { title: string; url: string }[];
  status?: Partial<Record<"dev"|"stage"|"prod", "healthy"|"degraded"|"down"|"unknown">>;
  x?: number; y?: number; // optional manual position
}

// Connection
{
  id: string;
  from: string; to: string;
  label?: string; protocol?: string; endpoint?: string; port?: number;
  credentialAlias?: string; description?: string; tags?: string[];
  owners?: { name: string; email?: string; slack?: string }[];
  docs?: { title: string; url: string }[];
  status?: Partial<Record<"dev"|"stage"|"prod", "healthy"|"degraded"|"down"|"unknown">>;
}
```

---

## 6. Consolidation Rules (journeys/all)

* `all.journey.json` includes **every connection id** from every journey under `/data/journeys/**` with:

  * `id: "all"`, `name: "All Journeys"`.
  * `connections`: unique union of all `connections`.
  * `systems`: **derived** from connections (union of `from` / `to` IDs)
  * `owners`, `docs`, `tags`: union of metadata arrays with duplicates removed by string key (`title+url`, `name+email+slack`).
* The app provides an API route `/api/journeys/all` that computes this on the fly. On production builds, we can also pre-materialize to `/data/journeys/all.journey.json` via a build script for static fallback.

---

## 7. Interaction Design (Compact UI)

* **Left Panel (Tabs):** Journeys | Systems | Layers

  * *Journeys*: searchable list, select to highlight.
  * *Systems*: searchable, shows env health dot.
  * *Layers*: toggle group tags (Auth, Payments, Events, Data, Core, …).
* **Canvas:** pan (drag background), zoom (slider), drag nodes, Shift+Drag rubber-band selection, fit-to-selection, mini-map bottom-right.
* **Right Panel:** details of selection, metadata links, owners.
* **Header:** Search, LR/TB layout toggle, zoom slider, Load/Save JSON, Fit, Save positions, Auto-arrange, Env selector.

**Compact choices:** small paddings, xs/sm text in lists/panels, dense cards, tooltips for labels; avoid oversized chrome.

---

## 8. Architecture (Next.js App Router)

```
src/
  app/
    layout.tsx
    page.tsx                   // main explorer page
    api/
      journeys/route.ts        // GET → list with paths + metadata
      journeys/all/route.ts    // GET → consolidated JSON
    (optional) auth/
  components/
    Explorer.tsx               // graph + panels composition
    GraphCanvas.tsx            // SVG renderer + interactions
    LeftPanel.tsx              // tabs/lists
    RightPanel.tsx             // details
    MiniMap.tsx
  lib/
    data.ts                    // loaders for JSON (fs in node, fetch in browser)
    layout.ts                  // dagre/grid layout helpers
    consolidate.ts             // build all.journey logic
    schema.ts                  // zod schemas for validation
    filters.ts                 // journey/group/env utils
  styles/
    globals.css                // Tailwind base
  data/                        // (public in dev) JSON data folder as above
  shadcn/                      // generated components
```

**Runtime data loading**

* On the server (API routes): read from `process.cwd()/data/**` using `fs/promises`.
* On the client: fetch from `/api/*` endpoints; also allow local upload to override.
* Provide ENV `DATA_ROOT` to override default data path.

**Layout engine**

* Try `dagre` first; fallback to a grid layout if unavailable.

---

## 9. API Contracts

### 9.1 `GET /api/journeys`

**Query:** none
**Response:**

```json
{
  "items": [
    {
      "id": "commerce/checkout/guest",
      "name": "Guest Checkout",
      "path": "journeys/commerce/checkout/guest.journey.json",
      "tags": ["p0", "revenue"]
    }
  ]
}
```

### 9.2 `GET /api/journeys/all`

**Response:** a valid Journey object (see schema) computed by union of all.

### 9.3 (Optional) `GET /api/journeys/[...slug]`

Returns the raw journey JSON by hierarchy path.

---

## 10. Component Contracts (Props)

* `GraphCanvas`:

```ts
{
  data: { systems: SystemNode[]; connections: ConnectionEdge[] };
  journey?: Journey;
  env: "dev"|"stage"|"prod";
  activeGroups: string[];
  onSelectSystem(id?: string): void;
  onSelectConnection(id?: string): void;
  onSavePositions(coords: Record<string, {x:number;y:number}>): void;
}
```

* `LeftPanel`: lists + filters; emits `onSelectJourney`, `onToggleGroup`, `onSearch`.
* `RightPanel`: displays entity details based on selection; renders owners/docs.

---

## 11. Validation & Testing

### 11.1 JSON Validation

* Zod schemas for Systems, Connections, Journey, and Aggregated Journey.
* Build-time script validates `/data/**` and fails CI on schema errors.

### 11.2 Unit Tests (Jest + React Testing Library)

**Do not change existing tests if present.** If none exist, add:

1. **Consolidation**

   * Union of connections is unique.
   * Systems inferred from connections.
   * Metadata union deduplicates.
2. **Layout Fallback**

   * Uses grid when dagre is not present.
   * Respects manual `x,y` when provided.
3. **Filters**

   * Journey filter fades non-participants.
   * Group filter hides edges not in active tags; nodes visibility derived.
4. **Env Overlays**

   * Health dot color map per state.
5. **Interactions**

   * Rubber-band selection emits selected set.
   * Save positions writes coordinates.
6. **API**

   * `/api/journeys` lists correct items from deep hierarchy.
   * `/api/journeys/all` returns valid consolidated doc.

### 11.3 E2E (Playwright - happy path)

* Load app, pick a journey, verify highlighting and details pane.
* Toggle a layer; ensure edges filter and nodes update.
* Drag a node and Save positions; reload and assert coordinates persisted.

---

## 12. Telemetry

* `ui.view.explorer`, `ui.select.journey`, `ui.filter.layer`, `ui.env.change`, `ui.graph.fit`, `ui.graph.save_positions`.
* Pluggable provider (console in dev, send to your analytics in prod).

---

## 13. Performance & Limits

* Virtualize lists in left panel if > 1k items.
* SVG for edges; consider canvas switch if > 2k edges.
* Debounce resize/fit; memoize derived sets (journey groups).

---

## 14. Security & Compliance

* No secrets in repo; only `credentialAlias` names.
* Optional Basic Auth middleware using `AUTH_TOKEN` env for non-public deployments.
* CSP headers; no inline scripts.

---

## 15. Build & Deployment

* **Dev:** `pnpm dev` loads data from `/data`.
* **Build:** `pnpm build` runs `validate-data && build && write-all-journey` (optional pre-materialize step).
* **Runtime:** `DATA_ROOT` to point to mounted volume with JSON in prod.

### 15.1 Docker Packaging

* App is shipped as a Docker image (e.g., `ghcr.io/your-org/arch-explorer:latest`).
* **Exposed port:** `3000`.
* **Volumes:** mount a host directory at `/app/data` (or set `DATA_ROOT`).
* **Seeding:** if mounted `DATA_ROOT` is empty and `SEED_ON_EMPTY=true` (default), the container seeds sample data on startup.
* **Environment variables:**

  * `DATA_ROOT=/app/data` (default)
  * `SEED_ON_EMPTY=true|false` (default `true`)
  * `SEED_OVERWRITE=false|true` (default `false`)
  * `AUTH_TOKEN` (optional; enables basic auth middleware)

**Example: docker run**

```bash
docker run --rm -p 3000:3000 \
  -e DATA_ROOT=/app/data \
  -e SEED_ON_EMPTY=true \
  -v $(pwd)/data:/app/data \
  ghcr.io/your-org/arch-explorer:latest
```

**Example: docker-compose**

```yaml
services:
  arch-explorer:
    image: ghcr.io/your-org/arch-explorer:latest
    ports:
      - "3000:3000"
    environment:
      DATA_ROOT: /app/data
      SEED_ON_EMPTY: "true"
    volumes:
      - ./data:/app/data
```

**Dockerfile (sketch)**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm i --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_ROOT=/app/data
ENV SEED_ON_EMPTY=true
RUN adduser -D nextjs
USER nextjs
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/scripts ./scripts
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "scripts/start.js"]
```

### 15.2 Startup Script (seeding logic, sketch)

```ts
// scripts/start.ts
import fs from 'fs/promises';
import path from 'path';
import { seedSamples } from './seed';

async function ensureSeed() {
  const root = process.env.DATA_ROOT || path.join(process.cwd(), 'data');
  const seedOnEmpty = (process.env.SEED_ON_EMPTY || 'true') === 'true';
  const overwrite = (process.env.SEED_OVERWRITE || 'false') === 'true';
  try {
    await fs.mkdir(root, { recursive: true });
    const files = await fs.readdir(root);
    if (!seedOnEmpty) return;
    if (files.length === 0 || overwrite) {
      await seedSamples(root);
      console.log('[seed] sample data written to', root);
    }
  } catch (e) {
    console.error('[seed] failed:', e);
  }
}

ensureSeed().then(() => import('next/dist/bin/next')).then(next => next.start ? next.start() : require('next/dist/bin/next'));
```

---

## 16. Open Questions (need your call)

1. You wrote **"Tailwind + shaven + compact UI"** – can I confirm that **"shaven" = shadcn/ui**? (I've assumed shadcn/ui in this PRD.)
2. For **group filtering**, should non-participating nodes be **hidden** or **faded**? (Current design: hidden for groups; faded for journey filtering.)
3. Do you want a **write API** to persist positions or commit to git via a bot, or keep it local-only (download JSON) in v1?

---

## 17. Appendix

### 17.1 Example Journey File

```json
{
  "id": "commerce/checkout/guest",
  "name": "Guest Checkout",
  "description": "Anonymous user buys without signup",
  "connections": ["c1", "c2", "c4", "c3"],
  "tags": ["p0", "revenue"],
  "owners": [{ "name": "Checkout PM", "email": "checkout@example.com" }]
}
```

### 17.2 Consolidated Journey (example response)

```json
{
  "id": "all",
  "name": "All Journeys",
  "connections": ["c1","c2","c3","c4","c5","c6"],
  "systems": ["web","bff","core","auth","db","mq","pay"],
  "owners": [{"name": "Checkout PM", "email": "checkout@example.com"}],
  "docs": [{"title": "Edge → BFF", "url": "https://docs.example.com/edge-bff"}],
  "tags": ["p0","revenue","payments","events"]
}
```

### 17.3 Pseudo-code: Consolidation

```ts
export async function consolidateAllJourneys(root = path.join(process.cwd(), "data", "journeys")) {
  const files = await glob("**/*.journey.json", { cwd: root });
  const journeys = await Promise.all(files.map(f => fs.readFile(path.join(root, f), "utf-8").then(JSON.parse)));
  const connSet = new Set<string>();
  const sysSet = new Set<string>();
  const ownersMap = new Map<string, any>();
  const docsMap = new Map<string, any>();
  const tagsSet = new Set<string>();
  journeys.forEach(j => {
    j.connections.forEach((c: string) => connSet.add(c));
    (j.systems||[]).forEach((s: string) => sysSet.add(s));
    (j.owners||[]).forEach((o: any) => ownersMap.set(`${o.name}|${o.email||""}|${o.slack||""}`, o));
    (j.docs||[]).forEach((d: any) => docsMap.set(`${d.title}|${d.url}`, d));
    (j.tags||[]).forEach((t: string) => tagsSet.add(t));
  });
  return {
    id: "all",
    name: "All Journeys",
    connections: Array.from(connSet),
    systems: Array.from(sysSet),
    owners: Array.from(ownersMap.values()),
    docs: Array.from(docsMap.values()),
    tags: Array.from(tagsSet)
  };
}
```
