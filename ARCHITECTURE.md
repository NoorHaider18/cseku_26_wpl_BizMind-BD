# BizMind BD Architecture

## Flow

1. Operational records are stored per `business_id`.
2. Analytics transforms those records into descriptive metrics.
3. Forecasting estimates product demand over a selected horizon.
4. Risk detection identifies evidence-backed anomalies.
5. Recommendations combine forecast/risk evidence into proposed actions.
6. A human owner reviews and approves or rejects the recommendation.
7. Approval creates a purchase-order **draft**.
8. Audit logging records the consequential decision.

## Tenant isolation

Every business-facing query filters records by the authenticated user's `businessId`. Sensitive routes also enforce the user's role server-side.

## AI boundary

AI is constrained to business-scoped tools and verified records. When an external Gemini key is unavailable, deterministic fallback responses are used so the core application remains functional.

## Persistence

The current MVP persistence implementation is JSON-backed. PostgreSQL is the intended production migration target from the master architecture; schema migration should preserve the existing domain model and tenant boundaries.
