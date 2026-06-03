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
| **Testing** | Jest, ts-jest, Supertest |

## Project Structure

```
CHP/
├── backend/                 # Express API server
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── config/          # DB, keys, S3
│   │   ├── middleware/       # Auth, RBAC
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Scoring engine, PDF, Excel, audit, antivirus
│   │   ├── utils/            # MIME sniffing utilities
│   │   └── __tests__/        # Unit tests
│   └── server.ts            # Entry point
├── frontend/                # Next.js app
│   └── src/
│       ├── app/
│       │   ├── (auth)/       # Login, forgot-password, reset-password
│       │   └── (platform)/   # Dashboard, assessments, organizations, settings, users
│       ├── services/         # API client with token refresh
│       └── store/            # Zustand auth store
└── CHP_Maturity_Index_Platform_Documentation.md
```

## Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 15+ (local or hosted, e.g. Supabase, Neon)
- **S3-compatible storage** (AWS S3, MinIO, Cloudflare R2) — for evidence files

## Local Development Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd CHP

# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chpmi?schema=public"

# JWT Keys — auto-generated on first start if not provided
# Or provide your own RSA key pair as base64-encoded strings:
# JWT_PRIVATE_KEY_B64="..."
# JWT_PUBLIC_KEY_B64="..."

# Server
PORT=3001
NODE_ENV=development

# CORS — allowed origins (comma-separated)
CORS_ORIGINS="http://localhost:3000"

# S3 Storage (evidence uploads)
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_BUCKET="chpmi-evidence"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"

# Antivirus (optional — falls back to mock scan if not configured)
# CLAMAV_HOST="clamav.internal"
# CLAMAV_PORT=3310
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Initialize database

```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Start development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1

### 5. Default seed accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@chpmi.org` | `Admin@2024!` | super_admin |

## Running Tests

```bash
cd backend
npm test
```

All 51 tests across 5 suites:
- `auth.test.ts` — RS256 JWT key generation and verification
- `rbac.test.ts` — Role-based access control middleware
- `scoringEngine.test.ts` — CHPMI calculation (34 tests)
- `mimeSniffer.test.ts` — File type validation
- `antivirus.test.ts` — ClamAV integration

## Deployment

This project is set up as a monorepo. You can deploy both the frontend and backend to Vercel as two separate projects.

### Frontend → Vercel

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Create a new project and select the repository.
3. In the project settings, set **Root Directory** to `frontend`.
4. Set **Framework Preset** to `Next.js`.
5. Add the following environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed backend API URL (e.g., `https://chp-backend.vercel.app/api/v1`)
6. Click **Deploy**.

### Backend → Vercel (Express Serverless)

We have configured the backend with a `vercel.json` file and a `postinstall` script to allow serverless deployment on Vercel.

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Create a new project and select the repository.
3. In the project settings, set **Root Directory** to `backend`.
4. Set **Framework Preset** to `Other` (or let it auto-detect).
5. Add the following environment variables:
   - `DATABASE_URL` = Your Neon PostgreSQL connection URL.
   - `NODE_ENV` = `production`
   - `CORS_ORIGINS` = Your deployed Vercel frontend URL (e.g., `https://chp-frontend.vercel.app`).
   - `JWT_PRIVATE_KEY` = Your RS256 private key (copy the multiline PEM structure or single line with `\n` characters).
   - `JWT_PUBLIC_KEY` = Your RS256 public key.
   - `STORAGE_PROVIDER` = `s3` (local storage will not work in a serverless environment).
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` = Your S3 credentials.
6. Click **Deploy**.

### Backend → Standard Node.js Host (Alternative: Railway, Render, Fly.io, VPS)

If you prefer to run the backend as a persistent service instead of serverless:

```bash
cd backend
npm run build
npm start
```

Required environment variables on the host:
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Server port (default 3001)
- `NODE_ENV=production`
- `CORS_ORIGINS` — Your Vercel frontend URL
- S3 credentials (see .env template above)

After deployment, run migrations:
```bash
npx prisma migrate deploy
```

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
| GET | `/dashboard/organization/:orgId` | ✅ | Org dashboard data |
| GET | `/dashboard/platform` | SA | Platform-wide dashboard |
| GET | `/audit-logs` | Admin+ | Query audit trail |

## Roles

| Role | Permissions |
|------|------------|
| **super_admin** | Full platform access, all orgs, impersonation |
| **admin** | Manage own org users, assessments, view dashboard |
| **assessor** | Score criteria, upload evidence |
| **reviewer** | Review assessments, add comments, approve/reject |
| **viewer** | Read-only access to assessments and dashboard |

## License

Proprietary — WHO/UNICEF CHP Maturity Index Platform
