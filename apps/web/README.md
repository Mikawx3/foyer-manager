# @foyer/web

React 18 frontend for Foyer Manager (Vite + TypeScript + Tailwind CSS v4).

## Prerequisites

Build shared types from the monorepo root (or rely on `predev`):

```bash
npm run build -w @foyer/types
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview production build |

## API proxy

During development, requests to `/api/*` are proxied to the API at `http://localhost:3000` (path prefix stripped).

## From monorepo root

```bash
npm run dev
```

Starts both web and API.
