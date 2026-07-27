# PMS Frontend (`pms_web`)

React 18 + Vite 6 frontend for the PMS project management system.

## Tech stack

- **React 18** with Vite 6.3
- **MUI v7** (Material UI) — Google Material theme (Google Blue `#1a73e8`, Google Sans + Roboto)
- **MUI X-Charts** — BarChart, LineChart for the dashboard
- **MUI X-Date-Pickers** — date selection
- **@dnd-kit/core** — Kanban board drag-and-drop between columns
- **@dnd-kit/sortable** — Project sub-items drag-to-reorder
- **@dnd-kit/utilities** — CSS transform helpers for sortable
- **React Router DOM v7** — hash-based routing (`/#/login`, `/#/kanban`, etc.)
- **Axios** — HTTP client with JWT interceptor

## Routes

| Path | Page |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/` | Dashboard (charts) |
| `/kanban` | Kanban board |
| `/weekly` | Weekly board |
| `/projects` | Project list |
| `/projects/:id` | Project detail (sub-items, file upload) |
| `/users` | User list (Admin/Manager only) |
| `/users/:id` | User profile |

## Token refresh flow

1. `apiClient` attaches in-memory access token to requests.
2. On 401, the interceptor calls `/api/auth/refresh`.
3. If refresh token (localStorage, 1-day expiry) is valid, backend returns a new access token + rotated refresh token.
4. If refresh token is invalid/expired, session is cleared and user is redirected to `/login`.
5. On page reload, `AuthProvider` silently restores the session via refresh token.

## Setup

```bash
npm install
npm run dev
```

Dev server at `http://localhost:5173`, proxies `/api` to `http://localhost:5080`.
