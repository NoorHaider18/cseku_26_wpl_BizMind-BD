# BizMind BD — Database Architecture

## Production persistence

BizMind BD supports PostgreSQL through `DATABASE_URL`. On startup the server initializes a PostgreSQL-backed state store and loads the business data into the application repository layer. Writes are serialized to prevent concurrent state overwrites.

The current migration preserves the existing domain model and data contract while moving persistence behind the database boundary. This allows the React/API layer to remain stable while the persistence model is incrementally normalized into dedicated PostgreSQL tables in a later migration.

### Required environment variables

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/bizmind
DB_POOL_SIZE=10
DB_SSL=true
```

`DATABASE_URL` is required for a production PostgreSQL deployment. If it is omitted in local development, BizMind uses the JSON seed store under `data/sme_db.json` so the demo remains runnable without external infrastructure.

## Migration behavior

On first PostgreSQL startup, BizMind creates the `bizmind_state` table and seeds it from the application's canonical seed generator. Existing JSON data is not silently deleted. A future production migration should import an existing `sme_db.json` explicitly and then disable the fallback.

## Tenant isolation

Every domain record carries `business_id` where applicable. API handlers scope reads and writes to the authenticated user's `business_id`; role checks are enforced at the backend boundary.

## Next normalization stage

The recommended next migration is to split `bizmind_state.data` into relational tables for users, businesses, products, categories, customers, sales, sale items, inventory transactions, suppliers, supplier products, purchase orders, purchase order items, expenses, forecasts, alerts, recommendations, AI conversations/messages, and audit logs. Foreign keys, indexes, and unique constraints should then be introduced with an Alembic-equivalent migration workflow.
