# Nana Fruit Dashboard

React (Vite) frontend + Node/Express backend. Employees log in with email +
password; a JWT carries their role. Two sections — **Office** (sales) and
**Factory** (production/cost) — with role-based access. All data is currently
**mock** (no external API calls).

```
Dashboard/
├─ client/                     React + Vite + React Router + Recharts
│  └─ src/
│     ├─ auth/AuthContext.jsx   login state, token, permissions
│     ├─ components/            Layout (nav), ProtectedRoute, ui.jsx (KpiCard, Progress, TopList)
│     ├─ pages/
│     │  ├─ Login.jsx
│     │  ├─ OfficePage.jsx      sales KPI vs target, top sales/spenders, orders
│     │  ├─ FactoryPage.jsx     per-room cost + yield, room tabs (each links to its detail page)
│     │  ├─ DryRoomPage.jsx     dry-room lot detail
│     │  ├─ FreshRoomPage.jsx   fresh-room lot detail
│     │  ├─ SortingRoomPage.jsx sorting-room lot detail (grade composition, foreign objects)
│     │  └─ PackingRoomPage.jsx packing-room lot detail (bags/boxes, destination)
│     └─ api.js                 fetch wrapper, attaches JWT
├─ server/
│  ├─ .env / .env.example
│  ├─ scripts/                  seed-users.js, generate-mock*.js
│  └─ src/
│     ├─ index.js               mounts /api/auth, /api/office, /api/factory, /api/dry-room, /api/fresh-room, /api/sorting-room, /api/packing-room
│     ├─ auth/                   roles.js, users.js, middleware.js, routes.js
│     ├─ data/store.js          reads/writes editable config (targets, labor rates)
│     ├─ routes/                office.js, factory.js, dryRoom.js, freshRoom.js, sortingRoom.js, packingRoom.js
│     ├─ api/                   factoryApi.js (dry-room), freshRoomApi.js, sortRoomApi.js (sorting + packing) — each mock/real toggle
│     └─ mock/                   batches, freshRoomBatches, sortingRecords, packingRecords, salesOrders, factoryRooms, config (JSON fixtures)
└─ package.json                 workspace root
```

## Setup

```bash
npm install
npm --workspace server run seed:users   # creates server/src/auth/users.json
npm --workspace server run mock:gen      # (re)generates all mock fixtures
```

## Run (dev)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:4000/api/health

## Login / roles

Dev accounts (from `server/scripts/seed-users.js` — change before real use):

| email | password | role | access |
|---|---|---|---|
| admin@nanafruit.com | admin1234 | `admin` | ดู + แก้ไข ทั้งหมด |
| audit@nanafruit.com | audit1234 | `audit` | ดูได้ทั้งหมด (แก้ไม่ได้) |
| office@nanafruit.com | office1234 | `office` | เฉพาะ Office |
| factory@nanafruit.com | factory1234 | `factory` | เฉพาะโรงงาน |

**Dev auto-login:** `npm run dev` signs in automatically using
`client/.env.development` (`VITE_DEV_AUTOLOGIN_EMAIL` / `_PASSWORD`, default
`audit@nanafruit.com`). Clear those vars or delete the file for the normal login
screen. It's stripped from production builds (`import.meta.env.DEV` guard).

Only `admin` can edit — currently: **monthly sales target** (Office page) and
**labor rate per hour per room** (Factory page). Edits are saved to
`server/src/mock/config.json`.

## API endpoints

| Endpoint | Role | Returns |
|---|---|---|
| `POST /api/auth/login` | — | `{ token, user }` |
| `GET /api/auth/me` | any | current user + permissions |
| `GET /api/office/summary?month=YYYY-MM` | office | target vs actual, % achieved, remaining, domestic/international split, top spenders, top products (by quantity, from order line items), monthly trend |
| `GET /api/office/orders?month=&market=` | office | sales order list (endpoint kept; not shown in UI) |
| `PUT /api/office/target` | admin | `{ month, domestic, international }` |
| `GET /api/factory/summary?from=&to=` | factory | per-room input/output/yield/hours/labor cost + totals |
| `GET /api/factory/rooms/:room?from=&to=` | factory | one room: `byProduct` summary (RM in, output, weight-weighted yield), `extremes` (highest/lowest-yield product), `totals`, plus daily `records` |
| `PUT /api/factory/labor-rates` | admin | `{ fresh, sorting, drying, packing }` |
| `GET /api/dry-room/dashboard` | factory | dry-room lot summary + charts |
| `GET /api/fresh-room/dashboard?product=&from=&to=` | factory | fresh-room lot summary (input/output/yield trend, by-product) + charts |
| `GET /api/sorting-room/dashboard?product=&from=&to=` | factory | sorting-room lot summary (grade composition, foreign-object %, by-product) + charts |
| `GET /api/packing-room/dashboard?product=&destination=&from=&to=` | factory | packing-room lot summary (bags/boxes/weight, by destination, by-product) + charts |

"office" role = audit + admin + office. "factory" role = audit + admin + factory.

## Mock data

| Fixture | Generator | Shape |
|---|---|---|
| `mock/batches.json` | `generate-mock.js` | dry-room lots (matches the real API) |
| `mock/freshRoomBatches.json` | `generate-mock-fresh-room.js` | fresh-room lots (matches the real API) |
| `mock/sortingRecords.json` | `generate-mock-sort-room.js` | sorting-room records (matches the real API) |
| `mock/packingRecords.json` | `generate-mock-sort-room.js` | packing-room records (matches the real API) |
| `mock/salesOrders.json` | `generate-mock-office.js` | matches the real API: `{ id, po_number, customer_name, order_type: "domestic"\|"international"\|"safety_stock", total_amount, opened_at, items: [{ sku, unit, quantity }] }` (normalized by `server/src/api/officeApi.js` before reaching routes; `safety_stock` orders are stock reserved for online channels, not real sales, so `getAllSalesOrders()` filters them out) |
| `mock/onlineOrders.json` | `generate-mock-online.js` | placeholder for online-channel sales (TikTok Shop / Shopee / Lazada / LINE OA) - no upstream API yet, not wired into any route: `{ id, order_no, channel, opened_at, items: [{ sku, product_name, quantity }], free_items: [{ sku, product_name, quantity }], promotion_name, gross_amount, net_amount }` |
| `mock/factoryRooms.json` | `generate-mock-factory.js` | `{ date, room, productName, inputWeightKg, outputWeightKg, yieldPercent, employees, workingHours }` (used only by the Factory overview tabs) |
| `mock/config.json` | (hand-edited / admin UI) | `monthlySalesTargets`, `laborRatePerHour` |

`npm --workspace server run mock:gen` runs all generators.

## Wiring real APIs later

1. Dry-room / fresh-room / sorting-room / packing-room: set `USE_MOCK_FACTORY=false` + `FACTORY_API_BASE_URL` + `FACTORY_API_KEY` in `server/.env` — all four share the same upstream Factory API and toggle together.
2. Sales orders: set `USE_MOCK_OFFICE=false` + `OFFICE_API_BASE_URL` + `OFFICE_API_KEY` in
   `server/.env`. `server/src/api/officeApi.js` already calls
   `callOfficeApi("/external/v1/sales-orders", { page, limit })` (page-based pagination, confirmed
   with upstream - also supports `from`/`to`/`order_type` filters if a bounded fetch is ever
   needed) and normalizes the response for `routes/office.js` - no route changes needed.
3. Factory rooms: same idea in `server/src/routes/factory.js` (replace `loadRecords()`) using
   the Factory API (`server/src/api/factoryApi.js`).

## UI

- English-first UI; number/date formatting is `en-US`, currency shown as `฿`.
- Colours follow the `dataviz` skill reference palette — Domestic = blue
  (`--series-1`), International = orange (`--series-2`). Tokens (light + dark) are
  defined at the top of `client/src/styles.css`; dark mode follows the OS setting.
- Charts are single-axis only (no dual-axis): Factory shows "Labor cost by room"
  and "Yield by room" as two separate charts.

## Notes

- `SERVER_PORT` (not `PORT`) sets the API port so frontend tooling can't collide.
- `JWT_SECRET` must be set to a long random string before deploying.
- Yield figures are weight-weighted (Σoutput / Σinput), not row averages.
- `server/src/auth/users.json` is gitignored — re-run `seed:users` after clone.
