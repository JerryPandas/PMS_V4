# pms-web — Frontend Skeleton (Round 3)

## What's included in this round
- Vite + React 18 project setup
- **Google Material-style MUI theme** (`src/theme/muiTheme.js`): Google Blue `#1a73e8`, Google Sans + Roboto typography, 8px radius, flat elevation matching Google Workspace apps
- **React Router DOM v7** with `createHashRouter` (URLs look like `/#/login`, `/#/`)
- **Login** and **Register** pages, centered card layout
- **JWT dual-token session handling**:
  - `src/api/tokenStore.js` — access token kept in memory only; refresh token persisted in `localStorage`
  - `src/api/apiClient.js` — axios instance that attaches `Authorization: Bearer {accessToken}` to every call, and on `401` automatically calls `/api/auth/refresh`, retries the original request, and queues any other requests that 401'd at the same time so only one refresh call is made
  - `src/features/auth/useAuth.jsx` — `AuthProvider` + `useAuth()`: `login`, `register`, `logout`, and silent session restore on page reload
- `RoleGuard` route wrapper for protecting pages, with optional `roles={['Admin','Manager']}` restriction
- `AppLayout` shell (top bar with user avatar + sign out) and a placeholder `DashboardPage`

## Setup

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to the backend (`vite.config.js`) — update the `target` to match your `PmsApi` launch URL.

## How the token refresh flow works in the code
1. `apiClient` attaches the in-memory access token to outgoing requests.
2. If a request comes back `401` (access token expired after 30 min), the response interceptor calls `refreshRequest()`.
3. If the refresh token (localStorage, 1-day expiry) is still valid, the backend returns a new access token **and** a rotated refresh token — both are saved via `tokenStore.setSession()`, and the original request is retried transparently.
4. If the refresh token is invalid/expired, the session is cleared and the user is redirected to `/#/login`.
5. On full page reload, `AuthProvider` reads the stored refresh token and silently calls `/api/auth/refresh` once to restore the session before rendering protected routes.

## Next round (Round 4)
Kanban board module: drag-and-drop task cards, columns (Todo/In Progress/Review/Done), project-scoped view.
