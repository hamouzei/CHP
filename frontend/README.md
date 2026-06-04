# CHP Maturity Platform — Frontend

Next.js 16 app with React 19, TailwindCSS 4, TanStack Query, Zustand, and Recharts.

## Pages

- **(auth)** — Login, Forgot Password, Reset Password
- **(platform)** — Dashboard (admin+), Assessments, Organizations (super_admin), Users (admin+), Settings

## Key Directories

- `src/services/api.ts` — API client with automatic token refresh
- `src/store/authStore.ts` — Zustand auth state with persist
- `src/app/(platform)/` — All authenticated routes with sidebar layout
