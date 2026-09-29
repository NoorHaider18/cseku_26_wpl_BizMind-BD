# BizMind BD API

All business endpoints require `Authorization: Bearer <JWT>` unless explicitly noted.

## Core operations

- `GET/POST/PUT/DELETE /api/products`
- `GET/POST /api/sales`
- `GET /api/customers`
- `GET/POST /api/suppliers`
- `GET/POST /api/purchase-orders`
- `PUT /api/purchase-orders/:id/status`
- `GET/POST/DELETE /api/expenses`
- `POST /api/inventory/adjust`

## Intelligence

- `GET /api/analytics/dashboard`
- `GET /api/analytics/sales`
- `GET /api/analytics/profit`
- `GET /api/analytics/inventory`
- `GET /api/analytics/suppliers`
- `GET /api/forecast?days=7|14|30`
- `GET /api/risks`

## AI decision workflow

- `POST /api/ai/chat`
- `GET /api/ai/recommendations`
- `POST /api/ai/recommendations/:id/approve` — owner only; creates a PO draft
- `POST /api/ai/recommendations/:id/reject` — owner only

## Governance

- `GET /api/audit-logs` — owner only
- `GET /api/employees` — owner only
