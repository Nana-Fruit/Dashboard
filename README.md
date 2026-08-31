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
│     │  ├─ FactoryPage.jsx     per-room cost + yield, fresh-room detail
│     │  └─ DryRoomPage.jsx     dry-room lot detail (the original dashboard)
│     └─ api.js                 fetch wrapper, attaches JWT
├─ server/
│  ├─ .env / .env.example
│  ├─ scripts/                  seed-users.js, generate-mock*.js
│  └─ src/
│     ├─ index.js               mounts /api/auth, /api/office, /api/factory, /api/dry-room
│     ├─ auth/                   roles.js, users.js, middleware.js, routes.js
│     ├─ data/store.js          reads/writes editable config (targets, labor rates)
│     ├─ routes/                office.js, factory.js, dryRoom.js
│     ├─ externalApi.js         dry-room API + mock toggle
│     └─ mock/                   batches, salesOrders, factoryRooms, config (JSON fixtures)
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

Only `admin` can edit — currently: **monthly sales target** (Office page) and
**labor rate per hour per room** (Factory page). Edits are saved to
`server/src/mock/config.json`.

## API endpoints

| Endpoint | Role | Returns |
|---|---|---|
| `POST /api/auth/login` | — | `{ token, user }` |
| `GET /api/auth/me` | any | current user + permissions |
| `GET /api/office/summary?month=YYYY-MM` | office | target vs actual, % achieved, remaining, domestic/international split, top spenders, monthly trend |
| `GET /api/office/orders?month=&market=` | office | sales order list (endpoint kept; not shown in UI) |
| `PUT /api/office/target` | admin | `{ month, domestic, international }` |
| `GET /api/factory/summary?from=&to=` | factory | per-room input/output/yield/hours/labor cost + totals |
| `GET /api/factory/rooms/:room?from=&to=` | factory | daily records for one room (`fresh`/`sorting`/`drying`/`packing`) |
| `PUT /api/factory/labor-rates` | admin | `{ fresh, sorting, drying, packing }` |
| `GET /api/dry-room/dashboard` | factory | dry-room lot summary + charts |

"office" role = audit + admin + office. "factory" role = audit + admin + factory.

## Mock data

| Fixture | Generator | Shape |
|---|---|---|
| `mock/batches.json` | `generate-mock.js` | dry-room lots (matches the real API) |
| `mock/salesOrders.json` | `generate-mock-office.js` | `{ orderId, orderDate, market, country, customerName, salesRep, currency, amountTHB, status }` |
| `mock/factoryRooms.json` | `generate-mock-factory.js` | `{ date, room, productName, inputWeightKg, outputWeightKg, yieldPercent, employees, workingHours }` |
| `mock/config.json` | (hand-edited / admin UI) | `monthlySalesTargets`, `laborRatePerHour` |

`npm --workspace server run mock:gen` runs all three generators.

## Wiring real APIs later

1. Dry-room: set `USE_MOCK=false` + `EXTERNAL_API_KEY` in `server/.env`.
2. Sales orders: implement a fetch in `server/src/routes/office.js` (replace `loadOrders()`),
   keep the same order shape.
3. Factory rooms: same idea in `server/src/routes/factory.js` (replace `loadRecords()`).

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
