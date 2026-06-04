# CHP Maturity Index Assessment Platform

A full-stack web application for assessing Community Health Program maturity across WHO/UNICEF member countries using a standardized 30-criteria scoring framework.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4, TanStack Query, Zustand, Recharts |
| **Backend** | Express.js, TypeScript, Prisma ORM, PostgreSQL |
| **Auth** | RS256 JWT (asymmetric keys), refresh tokens |
| **Storage** | AWS S3 / S3-compatible (evidence files) |
| **Reports** | PDFKit (PDF), ExcelJS (XLSX) |

## Project Structure

```
CHP/
├── backend/                 # Express API server
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── config/          # DB, keys, S3
│   │   ├── middleware/       # Auth, RBAC
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Scoring engine, PDF, Excel, audit
│   │   └── __tests__/        # Unit tests
│   └── server.ts            # Entry point
├── frontend/                # Next.js app
│   └── src/
│       ├── app/
│       │   ├── (auth)/       # Login, forgot-password, reset-password
│       │   └── (platform)/   # Dashboard, assessments, organizations, settings, users
│       ├── services/         # API client with token refresh
│       └── store/            # Zustand auth store
```

## Roles

| Role | Permissions |
|------|------------|
| **super_admin** | Full platform access, all orgs, impersonation, dashboard |
| **admin** | Manage own org users, assessments, dashboard |
| **assessor** | Score criteria, upload evidence |
| **reviewer** | Review assessments, add comments, approve/reject |
| **viewer** | Read-only access to assessments |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Login |
| POST | `/auth/logout` | ✅ | Logout |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/forgot-password` | — | Request password reset |
| POST | `/auth/reset-password` | — | Reset with token |
| GET | `/users` | Admin+ | List users |
| POST | `/users/invite` | Admin+ | Invite user |
| PATCH | `/users/profile` | ✅ | Update own profile |
| GET | `/organizations` | SA | List organizations |
| POST | `/organizations` | SA | Create organization |
| PATCH | `/organizations/:id` | SA | Update organization |
| DELETE | `/organizations/:id` | SA | Delete organization |
| GET | `/assessments` | ✅ | List assessments |
| POST | `/assessments` | Admin+ | Create assessment |
| GET | `/assessments/:id` | ✅ | Get assessment detail |
| POST | `/assessments/:id/responses` | Assessor+ | Save criterion score |
| POST | `/assessments/:id/reports/pdf` | ✅ | Download PDF report |
| POST | `/assessments/:id/reports/excel` | ✅ | Download Excel report |
| GET | `/dashboard/organization/:orgId` | Admin+ | Org dashboard data |
| GET | `/dashboard/platform` | SA | Platform-wide dashboard |

## Deployment

Deployed as two separate Vercel projects (frontend + backend). See [README-deploy.md](README-deploy.md) for full deployment instructions.

## License

Proprietary — WHO/UNICEF CHP Maturity Index Platform
