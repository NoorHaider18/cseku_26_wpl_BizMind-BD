# BizMind BD

SME commerce, procurement, and business-intelligence platform for Bangladesh — inventory, sales, procurement, supplier management, expenses, and an AI assistant that surfaces recommendations and demand forecasts.

## Stack

| Layer    | Tech                  |
|----------|------------------------|
| Backend  | NestJS (TypeScript)    |
| Web      | React + Vite (TypeScript) |
| Mobile   | Flutter                |

## Repo layout

```
backend/     NestJS API — auth, users, products, inventory, sales, suppliers, procurement, expenses
frontend/    React + Vite web app
mobile/      Flutter app
```

## Getting started

### Backend
```
cd backend
npm install --legacy-peer-deps   # see note below
npm run start:dev
```
> `--legacy-peer-deps` is required for now — NestJS 12 is newer than some `@nestjs/*` peer ranges expect, which trips a resolver bug in npm 10.9.x. Safe to drop once dependencies catch up.

### Frontend
```
cd frontend
npm install
npm run dev
```

### Mobile
```
cd mobile
flutter pub get
flutter run
```
This folder is structured to match `flutter create` conventions (`lib/`, `pubspec.yaml`) but was hand-scaffolded — run `flutter create .` in this directory first if you need the platform folders (`android/`, `ios/`) regenerated for your Flutter SDK version.

## Modules (Sprint 1 scope)

- **Auth** ✅ implemented — register/login, bcrypt password hashing, JWT issuance, `JwtAuthGuard` + `RolesGuard`, role-based (`owner` / `manager` / `staff`). Verified working end-to-end (register → login → protected `/auth/me`). In-memory user store for now — swap `UsersService` internals for TypeORM/Prisma + Postgres in Sprint 2; the public method signatures won't need to change.
- **Navigation** ✅ implemented — React Router (web) with `ProtectedRoute` guard; `go_router` + `refreshListenable` (mobile) with the condensed 5-slot bottom nav
- **Basic UI** — Dashboard shell still placeholder; shared component library not yet built (next up)

### Try it locally

```
# backend
cd backend && cp .env.example .env && npm install --legacy-peer-deps && npm run build && node dist/main.js

# in another terminal
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"businessId":"biz-1","name":"Test User","email":"you@example.com","password":"password123","role":"owner"}'
```

For the mobile app against a local backend: Android emulator uses `http://10.0.2.2:3000` automatically (see `AuthService.baseUrl`); override with `flutter run --dart-define=API_BASE_URL=http://<your-ip>:3000` for a physical device.

See `CONTRIBUTING.md` for branch strategy, PR process, and coding conventions.
