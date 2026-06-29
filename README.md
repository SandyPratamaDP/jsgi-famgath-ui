# jsgi-famgath-ui

Frontend for the **JSGI Family Gathering 2026** event management system. Includes a mobile-optimised Gate Scanner for day-of attendance and a web-based Admin Panel for data management.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + DaisyUI |
| Data Fetching | SWR |
| Theme | Custom dark theme (`jfe-dark`) |

## Requirements

- Node.js >= 18
- npm

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_BASE_URL

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Laravel API, e.g. `http://localhost:8000/api/v1` |

## Pages

| Route | Description |
|---|---|
| `/gate-scanner` | Mobile gate scanner — search employee, display transport info & QR |
| `/admin` | Admin panel — employee list, import Excel, bulk PDF download |

## Features

- **Gate Scanner** — unified search pill, multi-result picker, transport card (Bus / Private Car), emergency transport switch, Ancol QR display
- **Admin Panel** — paginated employee table, Excel import, bulk PDF generation
- **Dark Theme** — custom JFE-branded dark palette via DaisyUI custom theme

## Assets

Place the Ancol entry QR image at:

```
public/images/ancol-qr.png
```

## Related

- **Backend API:** [jsgi-famgath-api](https://github.com/SandyPratamaDP/jsgi-famgath-api)
