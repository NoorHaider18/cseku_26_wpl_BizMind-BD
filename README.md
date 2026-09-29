# BizMind BD

BizMind BD is a Bangladesh-oriented SME intelligence platform built around:

**DATA → INSIGHT → PREDICTION → RECOMMENDATION → HUMAN APPROVAL → ACTION**

## MVP capabilities

- JWT authentication and business-level tenant isolation
- Owner / manager role enforcement for sensitive operations
- Products, inventory, sales, customers, suppliers, purchasing and expenses
- Sales, inventory, profit and supplier analytics
- 7 / 14 / 30-day demand forecasting
- Evidence-based risk and anomaly signals
- AI assistant with business-scoped tools and deterministic fallback behaviour
- Recommendation review with explicit human approval
- Approved recommendations create **purchase-order drafts**, not autonomous purchases
- Audit logging for consequential AI decisions
- Responsive light SaaS interface with loading, empty and error states

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

The development server runs the Express API and Vite application together.

### Environment

- `JWT_SECRET` — required for production
- `GEMINI_API_KEY` — optional; without it BizMind uses its deterministic business-data fallback
- `PORT` — optional server port

Demo accounts are included in the seed data:

- Owner: `owner@sme.com` / `password123`
- Manager: `manager@sme.com` / `password123`

## Validation

```bash
npm run lint
npm run build
node tests/risk-engine.test.mjs
node tests/workflow.test.mjs
```

## Architecture note

The current implementation uses a tenant-scoped JSON persistence layer in `data/sme_db.json`. The master architecture calls for PostgreSQL + SQLAlchemy/Alembic; that migration is intentionally a separate architectural phase rather than silently changing persistence underneath the existing application.

## Decision-safety model

BizMind may identify risk, forecast demand and propose an action. It does not autonomously place supplier orders. A human owner must approve a recommendation before the system creates a purchase-order draft, and the approval is written to the audit log.

## PostgreSQL deployment

For production, configure `DATABASE_URL` and run `npm run db:migrate` once when importing an existing JSON demo database. The API exposes `GET /api/health` for deployment health checks. Local development may continue using the JSON fallback when `DATABASE_URL` is not set.
