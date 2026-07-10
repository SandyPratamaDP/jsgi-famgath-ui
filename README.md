# 🎡 jsgi-famgath-ui

Frontend for the **JSGI Family Gathering 2026** event management system. Includes a mobile-optimised Gate Scanner and Wahana Scanner for day-of attendance, and a web-based Admin Panel for employee data, ticket generation, and Ancol QR management.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| ⚛️ Framework | Next.js 16 (App Router) |
| 🔷 Language | TypeScript |
| 🎨 Styling | Tailwind CSS + DaisyUI |
| 🔄 Data Fetching | SWR |
| 🔳 QR Scanning | html5-qrcode |
| 🌙 Theme | Custom dark theme (`jfe-dark`) |

## ✅ Requirements

- Node.js >= 18
- npm
- The [backend API](https://github.com/SandyPratamaDP/jsgi-famgath-api) running and reachable — this app never calls it directly from the browser; see "How API calls work" below

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set LARAVEL_INTERNAL_URL to the backend's address

# 3. Start development server
npm run dev
```

The app is served under the `/famgath` base path (see `lib/basePath.ts`), so once running it's available at `http://localhost:3000/famgath`.

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `LARAVEL_INTERNAL_URL` | Address of the Laravel API, server-side only (default `http://127.0.0.1:8000`) |

## 🔄 How API calls work

The browser only ever talks to this Next.js app's own origin. `next.config.ts` rewrites `/api/*` to `LARAVEL_INTERNAL_URL`, so the Laravel backend is never exposed directly to the client — all `fetch()` calls in `lib/api.ts` hit `${BASE_PATH}/api/...` and Next.js proxies them server-side.

🌐 The rewrite forwards the incoming request's headers as-is, including `X-Forwarded-For` set by the production nginx in front of this app — so the backend's login audit log (`login_logs`) can still resolve the real client IP through this internal hop instead of logging Next.js's own loopback address (see the backend README's Auth & Roles section).

🔑 Auth: `loginApi()` stores the returned Sanctum bearer token, role, and display name in cookies (`lib/auth.ts`); every subsequent request attaches `Authorization: Bearer <token>`. All authenticated calls go through a shared `authFetch()` helper that detects a `401` response, clears local auth, and redirects to `/login?expired=1` — so an expired or revoked session bounces the user back to login instead of leaving the page stuck on a silent error.

## 🗺️ Pages

| Route | Access | Description |
|---|---|---|
| 🔓 `/login` | Public | Username/password login |
| 🏠 `/` | Any role | Menu hub — links to the pages below (Employee List hidden for `eo` role) |
| 🎟️ `/gate-scanner` | Any role | Search an employee, view transport info, display QR, emergency bus→car switch |
| 🎢 `/wahana-scanner` | Any role | Scan/search an employee, see remaining quota per venue, and check in up to that many people to Sea World Ancol or Ocean Dream Samudra (per-person quota, repeatable — not one-time) |
| 📋 `/admin/employees` | 🛡️ `panitia` | Employee list, Excel upload, ticket generation status, blast email, per-employee ticket actions |
| 📊 `/admin/upload` | 🛡️ `panitia` | Excel import |
| 🔳 `/admin/ancol-qr` | 🛡️ `panitia` | Upload/replace the Ancol gate-entry QR per employee category (local/expat/operational) |

## ⭐ Admin Panel — Employee List features

- **Bus / Kendaraan Pribadi / Operational tabs**, with search-by-name
- 🚦 **Ticket generation progress** — a stat tile showing generated/eligible ticket count, and a status dot before each name: 🟢 green once that employee's ticket PDF/PNG has been generated, 🟡 yellow while still queued, ⚪ none if that employee never gets an individual ticket (regular bus riders)
- 🔄 **Generate Ulang** — regenerate every eligible employee's ticket in one click, or one employee at a time from their row menu; useful after data changes without a full Excel re-upload
- ✏️ **Sesuaikan Jumlah** — per-row modal to adjust participant/vehicle counts without touching the row menu, wired per employee's own category (PIC bus / private car / operational)
- ✉️ **Blast Email** — disabled until ticket generation is complete (or if there's nothing eligible yet), preventing a blast from going out with attachments not fully generated
- ✅ **Terkirim badge** — shows next to an employee's email once their ticket email has actually been sent
- 🚌 **Pindahkan ke Bus/Kendaraan Pribadi** — reassign an employee's transport category
- 👶 **Anak <2 / <1 Tahun** (private car only) — flags a below-2yo child (gate-free at Ancol) and whether they're also below 1yo (rides-free too); below-2-but-not-below-1 automatically shows a **+1 Wahana** badge, matching the extra seat the wahana scanner adds to that family's ride quota without touching their stored passenger count
- ⚡ Per-employee actions: download PDF/image/QR, send/resend ticket email, regenerate ticket, adjust counts

## 🖼️ Assets

```text
public/images/logo.webp            # app header logo
public/images/sea-world-logo.png   # Sea World Ancol button logo (wahana-scanner)
public/images/samudera-logo.png    # Ocean Dream Samudra button logo (wahana-scanner)
```

Per-category Ancol gate-entry QR images are managed at runtime through `/admin/ancol-qr` and stored on the backend, not bundled as static assets here.

## 🔗 Related

- 🎫 **Backend API:** [jsgi-famgath-api](https://github.com/SandyPratamaDP/jsgi-famgath-api)
