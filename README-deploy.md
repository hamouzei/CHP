# CHP Maturity Platform — Vercel Deployment Guide

This monorepo contains two apps deployed as **separate Vercel projects**:

| App | Directory | Framework | Vercel Builder |
|---|---|---|---|
| **Frontend** | `frontend/` | Next.js 16 | Auto-detected |
| **Backend** | `backend/` | Express (Node.js) | `@vercel/node` (Serverless Functions) |

---

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- The [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- This repo pushed to GitHub (`hamouzei/CHP`)

---

## Option A: Deploy via Vercel Dashboard (Recommended)

### 1. Deploy the Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `hamouzei/CHP` repository
3. Set **Root Directory** to `backend`
4. Vercel will auto-detect the `vercel.json` config
5. Add these **Environment Variables** in Settings:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon PostgreSQL connection string |
   | `JWT_SECRET` | Your JWT secret |
   | `REFRESH_TOKEN_SECRET` | Your refresh token secret |
   | `FRONTEND_URL` | *(set after deploying frontend — see step 3)* |
   | `NODE_ENV` | `production` |
   | `STORAGE_PROVIDER` | `local` |

6. Click **Deploy**
7. Note the deployment URL (e.g. `chp-backend-xxx.vercel.app`)

### 2. Deploy the Frontend

1. Go to [vercel.com/new](https://vercel.com/new) again
2. Import the **same** `hamouzei/CHP` repository
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Next.js
5. Add this **Environment Variable**:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-backend-url>/api/v1` |

6. Click **Deploy**
7. Note the frontend URL (e.g. `chp-frontend-xxx.vercel.app`)

### 3. Update Backend CORS

Go back to your **backend** Vercel project → Settings → Environment Variables:

- Set `FRONTEND_URL` to your frontend URL (e.g. `https://chp-frontend-xxx.vercel.app`)
- Redeploy the backend for the change to take effect

---

## Option B: Deploy via Vercel CLI

```bash
# Backend
cd backend
vercel --yes
# Follow prompts, then set env vars:
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add REFRESH_TOKEN_SECRET
vercel env add FRONTEND_URL
vercel env add NODE_ENV
vercel env add STORAGE_PROVIDER
# Deploy to production
vercel --prod

# Frontend
cd ../frontend
vercel --yes
vercel env add NEXT_PUBLIC_API_URL
vercel --prod
```

---

## After Deployment

### Verify the backend

```bash
curl https://<your-backend-url>/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Verify the frontend

Open `https://<your-frontend-url>` in your browser — you should see the login page.

---

## Known Limitations

### File Uploads (Evidence Documents)

Vercel serverless functions have an **ephemeral filesystem** — uploaded files disappear between invocations. The `STORAGE_PROVIDER=local` mode will not persist evidence files in production.

**To fix**: Switch to S3 or Vercel Blob storage:
1. Set `STORAGE_PROVIDER=s3` in environment variables
2. Configure `S3_BUCKET_NAME`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
3. The existing `storage.ts` service already supports S3 — no code changes needed

---

## Redeployments

Both projects auto-redeploy when you push to the `main` branch on GitHub (if connected via the dashboard). For manual redeployments:

```bash
cd backend && vercel --prod
cd frontend && vercel --prod
```
