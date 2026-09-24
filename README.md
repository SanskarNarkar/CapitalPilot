# CAPITALPILOT — Personal Trading Operating System

> **Tagline:** Personal Trading Operating System  
> **Challenge:** ₹15,000 Starting Capital → ₹1,20,000 Profit Target → ₹1,35,000 Target Capital

---

## 1. Product Overview

**CapitalPilot** is an end-to-end, production-style trading operating system engineered for personal options traders executing challenges on Indian indices (**NIFTY**, **BANKNIFTY**, **SENSEX**). It tracks live executions, calculates exact risk and net P&L after exchange charges and brokerage, maintains trading plans and journals, monitors challenge milestones, provides multi-asset market context, runs Monte Carlo stress tests, and provides deterministic AI behavioral coaching.

---

## 2. Key Modules & Capabilities

1. **Dashboard Command Center (`/dashboard`)**: Capital equity curve, day P&L, 9-rule firewall status, open positions, recent trades, challenge progress bar, and "Today's Discipline" directive.
2. **Challenge Tracker (`/challenge`)**: Deep dive into the ₹15,000 → ₹1,35,000 milestone roadmap, remaining profit, winning/losing days, streak, drawdown, and interactive equity progression.
3. **Daily Trading Plan (`/trading-plan`)**: Plan your trades before market open. Define daily profit targets, maximum daily loss, max trades, risk %, market bias, and conditions to avoid.
4. **Trade Journal (`/trades`)**: Complete trade recording with exact option parameters, charges calculation, risk/reward, psychology emotions, rule adherence, mistake tags, and pre-flight **Trade Firewall** testing.
5. **Risk Engine & 9-Rule Firewall (`/risk`)**: Dynamic position sizing calculator respecting exchange contract lot sizes (not hard-coded), and the 9-rule safety firewall:
   - Rule 1: Daily loss limit check
   - Rule 2: Risk-per-trade percentage check
   - Rule 3: Maximum daily trades limit
   - Rule 4: Consecutive losses lock
   - Rule 5: Maximum challenge drawdown check
   - Rule 6: Position size lot multiple check
   - Rule 7: Minimum Risk/Reward (R:R) check (Default 1:2)
   - Rule 8: Setup validation against active library
   - Rule 9: Daily trading plan adherence validation
6. **Setup Library & Edge Analytics (`/setups`)**: Pre-seeded strategies (VWAP Rejection, ORB, Support Breakdown, PDH Breakout, etc.) with empirical win rates, profit factor, and expectancy.
7. **Quantitative Analytics (`/analytics`)**: Win Rate, Average Win, Average Loss, Profit Factor, Expectancy, Max Drawdown %, time-of-day session heatmaps, index breakdown, and mistake cost analysis.
8. **Scenario Engine & Monte Carlo (`/scenarios`)**: Conservative, Base, and Aggressive hypothetical projections plus a 250-run Monte Carlo simulator with 5th to 95th percentile distributions.
9. **Market Context Radar (`/market`)**: NIFTY, BANKNIFTY, SENSEX, India VIX, GIFT NIFTY, USD/INR, Brent Crude, and FII/DII cash/futures flows with explicit `DEMO DATA` labeling.
10. **News Terminal (`/news`)**: Curated Indian market and macro news categorized with High/Medium/Low impact tags.
11. **AI Coach (`/coach`)**: Deterministic performance auditor answering what mistakes you repeatedly make, best/worst setups, overtrading detection, risk escalation, and audited Daily/Weekly/Monthly reviews.
12. **DhanHQ Broker Sync (`/dhan`)**: Dual-mode Dhan integration (`LiveDhanProvider` and `DemoDhanProvider`). One-click sync, duplicate trade prevention, and reconciliation audit.

---

## 3. Technology Stack

- **Backend:** Python 3.12+, Django 5.1, Django REST Framework, SimpleJWT, Celery, Redis, SQLite (zero-config local default) / PostgreSQL (production)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Axios
- **Financial Calculation Rule:** Django `DecimalField` is used across all monetary and price fields. Floats are never used for financial state calculations.

---

## 4. Quick Start — Local Run Instructions

### Step 1: Clone Repository & Open Terminal

```bash
git clone <repository_url>
cd CapitalPilot
```

### Step 2: Backend Setup & Seed Data

The backend defaults to SQLite automatically, meaning no PostgreSQL or Redis installation is required to start immediately.

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Run migrations
python manage.py migrate

# 3. Seed realistic 3-week challenge dataset (trades, setups, plans, notifications)
python manage.py seed_data

# 4. Start the Django API server
python manage.py runserver 127.0.0.1:8000
```

*The backend API will be available at `http://127.0.0.1:8000/api/`.*

### Step 3: Frontend Setup & Launch

Open a second terminal window:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

*Open your browser and navigate to `http://localhost:5173`.*

---

## 5. Demo Credentials

The pre-seeded demo user account is configured with:

- **Username:** `trader`
- **Password:** `capitalpilot123`

---

## 6. DhanHQ automatic authentication

CapitalPilot operates in **DEMO MODE** by default, generating realistic Indian option trades and orders without contacting Dhan. Demo mode is selected by `DHAN_DEMO_MODE=true`; the older `DEMO_MODE` variable remains supported.

To connect your live Dhan trading account:

1. Enable TOTP for API authentication in Dhan Web and obtain your client ID, PIN, and TOTP secret.
2. Open `backend/.env` (or copy from `backend/.env.example`):
   ```env
   DHAN_DEMO_MODE=false
   DHAN_CLIENT_ID=your_dhan_client_id
   DHAN_PIN=your_dhan_pin
   DHAN_TOTP_SECRET=your_base32_totp_secret
   DHAN_TOKEN_REFRESH_BUFFER_MINUTES=30
   ```
3. Restart the backend. Authentication is lazy: the first live Dhan request generates a token, and no Dhan request runs during Django startup.
4. Navigate to `/dhan` and click **Run Dhan Sync**, or inspect the safe status endpoint at `/api/dhan/auth/status/`.

The auth service keeps the generated token encrypted in the backend database and refreshes it when it is inside the configured safety buffer. Concurrent requests are serialized so only one refresh is generated. A failed automatic refresh falls back to `DHAN_ACCESS_TOKEN` when that manually supplied JWT is still valid. The manual token remains supported for recovery and testing.

Security requirements:

- Keep `DHAN_PIN`, `DHAN_TOTP_SECRET`, and `DHAN_ACCESS_TOKEN` only in environment variables or a secret manager.
- Never commit `backend/.env` or real values to Git.
- Tokens, PINs, TOTP secrets, and generated TOTP codes are never returned to React or written to logs.
- Missing credentials, invalid TOTP configuration, Dhan downtime, and authentication failures leave the rest of CapitalPilot available.

For Docker, apply the additive migration after the first database start:

```bash
docker compose exec backend python manage.py migrate
```

Troubleshooting:

- `mode=demo`: set `DHAN_DEMO_MODE=false` and restart the backend.
- `No valid Dhan access token is available`: configure all three automatic values, or provide a non-expired `DHAN_ACCESS_TOKEN`.
- Authentication errors from Dhan: verify TOTP is enabled, the PIN is six digits, the secret is Base32, and the server clock is accurate.
- Check safe state with `GET /api/dhan/auth/status/`; it never includes credentials or tokens.

---

## 7. Testing & Verification

Both test suites pass cleanly:

### Automated Backend Tests (Django Test Suite):

```bash
cd backend
python manage.py test
```
*Result: 10/10 tests passed (Risk firewall, lot sizes, challenge progress, Dhan sync duplicate prevention, reconciliation audit, analytics formulas, scenario engine, Monte Carlo bounds, AI coach).*

### Frontend Production Build:

```bash
cd frontend
npm run build
```
*Result: Compiled and bundled cleanly with zero TypeScript or bundling errors.*

---

## 8. Docker Compose (Full Stack with Postgres & Redis)

To run the entire system inside Docker containers:

```bash
docker-compose up --build
```

- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## 9. Railway production deployment

Railway can deploy the root `Dockerfile` as the single public web service. It builds the React app and serves it from Django, so the browser uses one HTTPS domain for both the UI and `/api/*` endpoints. Railway provides automatic SSL for generated and custom domains.

Create these Railway services in one project:

1. `capitalpilot-web`: deploy from this repository with the root directory `/`. Use the generated public domain for the browser. The included `railway.toml` runs migrations as a pre-deploy command and checks `/api/health/`.
2. `capitalpilot-worker`: use the same repository/image and set the start command to `celery -A config.celery:app worker --loglevel=INFO`.
3. `capitalpilot-beat`: use the same repository/image and set the start command to `celery -A config.celery:app beat --loglevel=INFO`.
4. Add Railway PostgreSQL and Redis services. Reference their variables from each application service, for example `DATABASE_URL=${{Postgres.DATABASE_URL}}` and `CELERY_BROKER_URL=${{Redis.REDIS_URL}}`. Set `CELERY_RESULT_BACKEND` to the same Redis URL.

Set these application variables on the web, worker, and beat services as appropriate:

```env
DJANGO_SECRET_KEY=<long-random-secret>
DEBUG=false
ALLOWED_HOSTS=<railway-domain>,healthcheck.railway.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}
CELERY_TASK_ALWAYS_EAGER=false
DHAN_DEMO_MODE=false
DHAN_CLIENT_ID=<Railway sealed variable>
DHAN_PIN=<Railway sealed variable>
DHAN_TOTP_SECRET=<Railway sealed variable>
DHAN_TOKEN_REFRESH_BUFFER_MINUTES=30
CSRF_TRUSTED_ORIGINS=https://<railway-domain>
```

Keep Dhan values as sealed Railway variables. They are read only by Django/Celery and are never included in `VITE_*` variables or API responses. Do not expose the worker, beat, PostgreSQL, or Redis services publicly. Generate a domain only for `capitalpilot-web`.

Before switching Dhan to live mode, run these checks from the backend image or Railway shell:

```bash
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py migrate
```

The Dhan authentication migration is `apps/dhan/migrations/0002_dhanauthstate.py`. Railway pre-deploy migrations are intentionally limited to `migrate`; schema generation is never run automatically.
