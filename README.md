# SkillConnect – Events & Training Management Platform

React + Vite + Tailwind CSS frontend, FastAPI + SQLAlchemy + Alembic backend, PostgreSQL database.

**Current status:** the existing React/FastAPI application has database-backed event, training, job, submission, messaging, and dashboard workflows. PostgreSQL is the recommended deployment database; SQLite URLs are supported for local development and tests. Discovery also includes clearly marked curated sample listings that are browse-only.

**Deployment files:** there are no application Dockerfiles in this repository. `docker-compose.yml` runs only a local PostgreSQL container; it is not a production deployment definition. Use the managed static-site and Python web-service instructions below unless you deliberately choose to build and maintain container images.

**Temporary Render demo:** the root `render.yaml` is a Render Blueprint for a free static frontend, free Python API, and free PostgreSQL database. It is for a short-lived demo only—not production. Render free web services sleep and have ephemeral filesystems, and free PostgreSQL expires after 30 days. Demo uploads can disappear on sleep/redeploy; the free database may later expire and delete its data. Do not enter real user data or rely on this demo for persistence.

## Prerequisites
- Python 3.11+ · Node.js 20.19+ (or 22.12+) · PostgreSQL 15+ **or** Docker

## Structure
```
SkillConnect/
├── docker-compose.yml        # optional PostgreSQL container
├── .env.example              # docker-compose variables
├── backend/
│   ├── app/{api/routers,core,database,models,schemas,services,dependencies,utils}, main.py
│   ├── alembic/ (+ alembic.ini)   ├── tests/   ├── scripts/check_db.py   └── uploads/
└── frontend/
    └── src/{assets,components,layouts,pages,services,hooks,context,routes,utils,test}
```

## 1. Database
PostgreSQL is recommended for demonstrations involving multiple users and for deployment.

Option A – Docker:
```bash
cp .env.example .env          # then set POSTGRES_PASSWORD
docker compose up -d db
```
Option B – existing PostgreSQL: create a database and user, then use their details in `backend/.env` as `DATABASE_URL`.

For local development only, SQLite can be configured with a file URL such as `DATABASE_URL=sqlite:///./skillconnect.db`. Do not use a local SQLite file for a multi-instance deployment.

## 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # use a real DATABASE_URL and a unique SECRET_KEY
python scripts/check_db.py         # check configured database connectivity
alembic upgrade head               # apply pending, additive schema migrations
uvicorn app.main:app --reload --port 8000
```
The backend dependency file is `requirements.txt`; run `pip install -r requirements.txt`.
- Swagger UI: http://localhost:8000/docs
- Liveness: http://localhost:8000/api/v1/health
- DB check: http://localhost:8000/api/v1/health/db (200 = connected, 503 = unavailable)

Generate a secret: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

## 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev                        # http://localhost:5173
```

## 4. Tests
```bash
cd backend && pytest               # uses in-memory SQLite; never touches PostgreSQL
cd frontend && npm test
```
Backend tests use an isolated in-memory SQLite database and do not modify the configured database. They verify API workflows, not production PostgreSQL connectivity.

## 5. Run the application
Start PostgreSQL and apply migrations before starting the API:
```powershell
Set-Location .\backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
In a second terminal:
```powershell
Set-Location .\frontend
npm run dev
```
Open http://localhost:5173. The app reads `VITE_API_URL` from `frontend/.env` (defaults to `http://localhost:8000/api/v1`). When the API is offline, curated sample listings remain browseable, but core actions require a published, database-backed opportunity and a working API.

## 6. Accounts and roles
- Public signup supports student, trainer, and organizer roles.
- Admin accounts are intentionally not self-service. After migrations, create one with `.\.venv\Scripts\python.exe -m scripts.create_admin` from `backend`; the password is entered privately at the prompt.
- API routes require bearer tokens for account-specific actions. Organizer/trainer permissions are scoped to their listings; admin routes are separately role-gated.

## 7. Implemented workflows
- Browse, search, and filter events, training programs, and jobs; open detail pages and see deadlines.
- Sign up/sign in, register/enroll/apply, and review activity in the dashboard.
- Organizer/trainer listing creation, editing, status changes, and soft deletion; role-scoped participant/application and submission review.
- Training curriculum and lesson progress persist in the database; training progress is calculated from completed lessons.
- User-to-user REST messaging, persisted history, read timestamps, submission feedback, and authenticated file uploads (10 MB default maximum; PDF, Office documents, ZIP, and common images).
- User and administrator dashboards load database-backed activity and statistics. Curated sample listings are labeled and cannot be registered for, saved, or submitted to.

Messaging uses REST requests and refreshes the open conversation every eight seconds; it is not real-time push chat. Sign-out clears the browser's JWT, but there is no server-side JWT revocation. Third-party SSO and email delivery are not configured. Uploads are stored on the API host under `backend/uploads`; configure persistent private object storage, backups, and antivirus scanning before accepting public production uploads.

## 8. API routes
The interactive API reference is available at http://localhost:8000/docs. The primary groups include `/auth`, `/opportunities`, `/participations`, `/me/activity`, `/messages`, `/submissions`, `/uploads`, and `/admin`.

## Migrations
```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
alembic downgrade -1
```
New model modules must be imported in `backend/app/models/__init__.py`.

## Security notes
`.env` files are git-ignored. `DATABASE_URL` and `SECRET_KEY` have no defaults in code; the app will not start without them. Back up the target database before applying migrations. `alembic upgrade head` applies pending migrations without replacing existing rows; do not downgrade a production database without a verified backup.

## Production deployment (managed hosting)

### Recommended simple architecture

- **Frontend:** Render Static Site (or Vercel), built from `frontend/`.
- **API:** Render Python Web Service, with its working/root directory set to `backend/`.
- **Database:** managed PostgreSQL, reachable privately from the API.
- **Uploaded files:** a persistent disk mounted on the API service. For a small single-instance deployment, mount it at `/var/data` and set `UPLOAD_DIR=/var/data/uploads`. For multiple API instances or higher availability, use private object storage, but the current application does not have an S3-compatible storage integration yet.

Keeping all three services in one provider's account simplifies setup and network configuration. Render is a practical single-provider option; Vercel static hosting with Render API/database is also supported by the same app. Compare current plans and persistence limits before choosing: do not assume a free tier includes persistent files, backups, or always-on compute. No service is provisioned or purchased by this project.

### PostgreSQL and migrations

The backend uses SQLAlchemy's PostgreSQL driver (`psycopg2-binary`), SQLAlchemy 2, and Alembic. `backend/alembic/env.py` reads `DATABASE_URL` from the backend settings and targets the registered SQLAlchemy models. The checked-in revisions use SQLAlchemy/Alembic table, index, foreign-key, JSON, date, and timestamp operations rather than SQLite-only SQL, so they are intended to run on PostgreSQL as well as SQLite.

This is a configuration and migration-source compatibility review, **not** a live PostgreSQL test. Automated tests use isolated SQLite. Before production, create a staging PostgreSQL database, take a backup, test `alembic upgrade head` there, verify the application workflows, and only then schedule production migrations. Never run migrations against production merely to check compatibility.

### Required production environment variables

Create settings in the hosting providers' private environment/secret dashboards. The files `backend/production.env.example` and `frontend/production.env.example` contain placeholders only; do not upload them as secret files or commit real `.env` files.

**Backend web service:**

| Variable | Required value |
|---|---|
| `DATABASE_URL` | Managed PostgreSQL connection URL. Prefer the private/internal URL. If the provider gives a URL beginning `postgres://`, use the exact form accepted by its SQLAlchemy/psycopg2 integration or prefix it as `postgresql+psycopg2://`. Percent-encode special characters in manually assembled usernames/passwords. |
| `SECRET_KEY` | A new, random secret of at least 32 characters, stored only in the provider's secret manager. Do not reuse the development key. |
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | Exact public frontend origin, such as `https://your-site.onrender.com`; no trailing slash. Add other trusted origins as a comma-separated list. |
| `UPLOAD_DIR` | Persistent-disk mount path, for example `/var/data/uploads`. |
| `MAX_UPLOAD_SIZE_MB` | Optional; defaults to `10`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Optional; defaults to `60`. |

`APP_NAME` and `ALGORITHM` have safe application defaults. Do not put credentials in the repository, build logs, or a ZIP archive. Generate a secret locally with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and paste it directly into the provider's secret field.

**Frontend static site:**

| Variable | Required value |
|---|---|
| `VITE_API_URL` | Public API base URL ending in `/api/v1`, for example `https://your-api.onrender.com/api/v1`. This is embedded into the frontend at build time; it is public configuration, not a secret. |

### Beginner-friendly deployment steps

#### Free, temporary demo using the included Blueprint

1. Make sure the project files, including `render.yaml`, are committed and pushed to the GitHub repository. The Render Blueprint can only deploy code that is actually present in that repository.
2. In Render, choose **New → Blueprint**, connect the private GitHub repository, and select the branch containing `render.yaml`.
3. Review the three resources before applying: `skillconnect-web` (static site), `skillconnect-api` (free Python service), and `skillconnect-demo-db` (free PostgreSQL). Confirm the dashboard shows the free plans before clicking **Apply**. The Blueprint contains no passwords; Render generates the JWT secret and wires the database connection.
4. Wait for the database, API, and static site deployments to complete. The API start command applies the checked-in Alembic migrations before starting Uvicorn. This Blueprint creates a new empty PostgreSQL database and does not import the local SQLite file.
5. Open the API health URLs (`/api/v1/health` and `/api/v1/health/db`) at the generated API hostname, then test the static website and core workflows.
6. If Render assigns different service hostnames because these names are unavailable, update `CORS_ORIGINS` on the API and `VITE_API_URL` on the static site to match the actual frontend/API URLs, then redeploy.
7. Treat all data and uploads as temporary. The API has no persistent disk in this free Blueprint; PostgreSQL's free plan expires after 30 days. Do not upload sensitive or important files.

#### Production-style managed hosting

1. **Back up and keep local data separate.** Do not point the deployment at `backend/skillconnect.db`. Create a new managed PostgreSQL database for staging first. PostgreSQL does not automatically import the local SQLite database or its records.
2. **Create the managed PostgreSQL service.** Save its private connection URL in a password manager temporarily, then enter it only in the API provider's secret/environment settings as `DATABASE_URL`. Use SSL requirements and the private URL specified by the provider.
3. **Create the API service from the existing repository.** Select Python; set the root/working directory to `backend`; install with `pip install -r requirements.txt`; use the start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (or the provider's documented port variable).
4. **Set API environment variables before starting the service.** Add all required backend values from the table above. Set `CORS_ORIGINS` to the final frontend URL. Generate a fresh `SECRET_KEY`; never copy a real key into either example file.
5. **Add persistent upload storage before accepting file uploads.** Attach a persistent disk to the API service, mount it at `/var/data`, and set `UPLOAD_DIR=/var/data/uploads`. The app creates the upload subdirectory when needed. A container's ordinary filesystem is usually ephemeral: without a persistent disk, uploaded files can disappear when the service is replaced or redeployed. This disk approach is for a single API instance; use an object-storage integration before running multiple API instances.
6. **Run database migrations once against staging PostgreSQL.** Use the provider's one-off shell/console for the API service and run `alembic upgrade head` from its `backend` working directory. Check for success and test signup, listing creation, registration/enrollment/application, lesson progress, and submissions. Take a database backup before applying the same reviewed migration process to production. Do not put migrations in a repeatedly run multi-instance startup command.
7. **Create the first administrator from the API service console.** Run `python -m scripts.create_admin` from the `backend` working directory and enter the password only at the hidden prompt. Public signup does not grant administrator access.
8. **Create the frontend static site.** Set its root directory to `frontend`, build command to `npm ci && npm run build`, and publish/output directory to `dist`. Set `VITE_API_URL` to the public API URL ending in `/api/v1` **before the build**. Configure the static host's SPA fallback/rewrite so application routes such as `/events/1` serve `index.html` (for Render Static Sites, rewrite `/*` to `/index.html` with status `200`).
9. **Set the final CORS origin.** Once the static host assigns the final URL, put that exact `https://...` origin into the backend's `CORS_ORIGINS` and redeploy/restart the API. Do not use `*` for production origins.
10. **Verify the live services.** Open `https://<api-host>/api/v1/health` and `/api/v1/health/db` (the latter checks actual database connectivity), then test protected browser workflows and upload/download after a service redeploy. Confirm database backups and uploaded-file persistence. Keep API documentation endpoints (`/docs` and `/redoc`) in mind; they are currently enabled in production as well.

### Deployment blockers and limitations

- PostgreSQL runtime connectivity and the full migration chain have not yet been exercised against a PostgreSQL server; stage and verify them before production.
- Uploaded files are stored on the API filesystem. They persist across redeploys only when `UPLOAD_DIR` points to a correctly mounted persistent disk. Private object storage, antivirus scanning, and a production upload lifecycle are not implemented.
- Automated tests use SQLite and do not verify hosting-provider networking, TLS, backups, or persistent disks.
- The API currently enables Swagger and ReDoc in production; restrict or disable them if the deployment requires private API documentation.
- Chat uses REST polling, and email delivery, SSO, and server-side JWT revocation are not configured.
- The local SQLite database is not migrated or copied by these instructions. Preserve it as local data and create a deliberate, separately verified import plan if its records must be transferred.
