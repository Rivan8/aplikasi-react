---
name: aplikasi-react-agents
description: "Use when: developing, debugging, or extending the Laravel + React monolith for attendance/event management. Guides agents on dev setup, Inertia.js architecture, database schema, critical gotchas, and code conventions."
---

# Aplikasi React – Agent Guide

A **monolithic Laravel + React** application for member attendance tracking and event management. Uses **Inertia.js** for server-side routing with React components.

---

## 1. Tech Stack Overview

- **Backend**: Laravel 13 (PHP 8.3+) – uses Eloquent ORM, Inertia.js v3, Laravel Fortify for auth.
- **Database**: MySQL (`attendance_pro`), MySQL (`myesc_db`, external read‑only).
- **Frontend**: React 19 with TypeScript, compiled by Vite 8, React Compiler (auto optimization).
- **UI / Styling**: Tailwind CSS 4, Radix UI components, custom UI wrappers.
- **Testing**: Pest PHP (modern expressive syntax).
- **Build / Tooling**: Vite, ESLint + Prettier, TypeScript compiler.
- **Package Manager**: PNPM (frontend), Composer (backend).

---

## 2. Essential Commands

| Task | Command | Notes |
|------|---------|-------|
| **Setup** | `composer install && npm install` | First time only |
| **Dev (full stack)** | `composer dev` | Concurrent: Laravel (8000), queue, Pail logs, Vite |
| **Frontend only** | `npm run dev` | Vite dev server with hot reload |
| **Production build** | `npm run build` | Generates `public/build/` + manifest |
| **Test + lint** | `composer test` | Linting → type check → Pest tests |
| **Linting** | `npm run lint` | Fix ESLint + React warnings |
| **Type check** | `npm run types:check` | TypeScript validation |
| **DB migrations** | `php artisan migrate --force` | Required after setup |
| **Seed test data** | `php artisan db:seed --class=MemberManagementSeeder` | Populate test records |

**First run**: `composer install && npm install && php artisan key:generate && php artisan migrate --force && npm run build`

---

## 3. Architecture: Inertia.js (Server-Side Rendered React)

**Key Pattern**: Every route returns an **Inertia page component** (React) + **server data** as props.

```tsx
// Backend: app/Http/Controllers/EventController.php
return Inertia::render('events/Index', [
  'events' => Event::with('attendances')->paginate(),
  'departments' => Department::all(),
]);

// Frontend: resources/js/pages/events/Index.tsx
export default function Events({ events, departments }) {
  const { data, setData, post } = useForm({ title: '' });
  return <form onSubmit={() => post(route('events.store'))}> ... </form>;
}
```

**No separate API layer**—routes are both HTML (for nav) and JSON (for props). Form mutations via `useForm()` hook with auto CSRF tokens.

---

## 4. Directory Structure

```
app/Models/
  ├─ Event.php              # Event management
  ├─ Attendance.php         # Scanned attendance
  ├─ ExternalMember.php     # Read-only external (myesc_db.jemaat)
  ├─ MemberDetail.php       # Local metadata (status, dept)
  ├─ MemberStatus.php
  └─ Department.php

app/Http/Controllers/
  ├─ EventController.php         # CRUD events + QR
  ├─ AnggotaController.php       # Members + metadata
  ├─ DepartmentController.php    # Depts CRUD
  └─ …

database/migrations/
  ├─ 2026_04_28_041905_create_events_table.php
  ├─ 2026_04_28_041906_create_attendances_table.php
  └─ 2026_04_28_082841_create_member_management_tables.php

resources/js/
  ├─ pages/                 # Route components (match routes/web.php)
  │   ├─ events/index.tsx
  │   ├─ anggota/index.tsx
  │   └─ …
  ├─ components/
  │   ├─ ui/               # Radix UI wrappers + Tailwind
  │   ├─ app-*.tsx         # Nav, sidebar, header (layout)
  │   └─ …
  ├─ layouts/              # Page templates
  ├─ hooks/                # Custom React hooks
  ├─ lib/                  # Utilities
  └─ app.tsx               # Inertia.js entry point

routes/web.php            # All route definitions
tests/                    # Pest test files
```

---

## 5. Database Schema & Models

### Core Tables

#### `events`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | Primary key |
| `title` | VARCHAR | Event name |
| `date`, `time` | DATE, TIME | When event occurs |
| `location` | VARCHAR | Event location |
| `category` | VARCHAR | Event type |
| `expected` | INT | Expected attendance count |
| `image_path` | VARCHAR, nullable | Event image URL |
| `created_at`, `updated_at` | TIMESTAMP | |

#### `attendances`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | Primary key |
| `event_id` | BIGINT FK | Event being attended |
| `member_id` | BIGINT | External member ID (from `myesc_db.jemaat`) |
| `scan_time` | TIMESTAMP | When member scanned |
| `status` | VARCHAR | "Present", "Late", etc. |
| `created_at`, `updated_at` | TIMESTAMP | |

#### `member_details`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | Primary key |
| `member_id` | BIGINT, **unique** | ID from external `jemaat` table |
| `status_id` | BIGINT nullable FK | Reference to `member_statuses.id` |
| `department_id` | BIGINT nullable FK | Reference to `departments.id` |
| `created_at`, `updated_at` | TIMESTAMP | |

#### `member_statuses`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | Primary key |
| `name` | VARCHAR | "Jemaat", "Volunteer", etc. |
| `created_at`, `updated_at` | TIMESTAMP | |

#### `departments`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | BIGINT | Primary key |
| `name` | VARCHAR | "Visual", "Worship", "Kids", "Frontline", etc. |
| `created_at`, `updated_at` | TIMESTAMP | |

#### `ExternalMember` (Read-Only, External `myesc_db.jemaat`)
- **Connection**: `myesc_db` (MySQL external)
- **Timestamps**: Disabled (`$timestamps = false`) — external table has no timestamps
- **Guarded**: All fields (`$guarded = ['*']`) — **Do not create/update; read-only only**
- Extended via `MemberDetail` for local metadata

### Relationships
```
Event ─→ Attendances ─→ (member_id from external jemaat)
MemberDetail ─→ MemberStatus, Department
ExternalMember ←─ MemberDetail (1:1 bridge)
```

---

## 6. Frontend Conventions

**Directory & File Organization**:
- `pages/` — Route components (one per page; match `routes/web.php`)
- `components/ui/` — Radix UI wrappers + Tailwind styling
- `components/app-*.tsx` — Layout components (nav, sidebar, header)
- `layouts/` — Page templates (AppLayout, AuthLayout, SettingsLayout)
- `hooks/` — Custom React hooks (state, data fetching logic)
- `lib/` — Utilities (formatters, validators, helpers)

**Key Patterns**:

1. **Form Mutations** — Use `useForm()` from Inertia:
   ```tsx
   const { data, setData, post, processing } = useForm({
     status_id: '',
     department_id: '',
   });
   
   const handleSubmit = (e) => {
     e.preventDefault();
     post(route('anggota.update-details', memberId));
   };
   ```

2. **Server Data as Props** — Receive from Inertia; no separate fetch calls:
   ```tsx
   export default function Anggota({ members, statuses, departments }) {
     // All props passed from Laravel controller
   }
   ```

3. **UI Components** — Use Radix UI + Tailwind, no custom CSS:
   - Dialog, Select, Checkbox, Dropdown, Tooltip, etc.
   - Always include accessible labels and keyboard support

4. **Icons** — Lucide React for consistency
5. **Notifications** — Sonner (toast library)
6. **Type Safety** — Strict TypeScript; no implicit `any`

**Code Quality**:
- `npm run format` — Prettier for consistent formatting
- `npm run lint` — Fix ESLint + React warnings
- `npm run types:check` — TypeScript validation before commit
- React Compiler enabled (Babel plugin) → auto-optimizes renders

---

## 7. Backend Conventions

**Language**: PHP 8.3+ (strict types recommended)

**Structure**:
- `app/Models/` — Eloquent models (PSR-4 autoload)
- `app/Http/Controllers/` — Route handlers (thin; mostly `Inertia::render()` or queries)
- `app/Http/Requests/` — Form validation classes
- `app/Concerns/` — Traits for shared behavior
- `app/Providers/` — Service bootstrapping
- `database/migrations/` — Schema changes
- `database/seeders/` — Test data

**Naming**:
- Routes: dot notation (`events.store`, `anggota.update-details`)
- Tables: plural snake_case (`events`, `attendances`, `member_statuses`)
- Classes: `CamelCase`; methods: `camelCase`; columns: `snake_case`

**Auth**: Laravel Fortify (2FA, email verification, password reset). Local `User` + read-only `ExternalMember`.

---

## 8. Code Quality Standards

**PHP** (Pint preset: Laravel):
- 4-space indentation
- Use traits for DRY validation rules

**JavaScript/TypeScript** (ESLint + Prettier):
- React Compiler enabled → auto-optimizes renders
- Strict type checking; no implicit `any`
- Consistent formatting via Prettier

**Before Commit**:
```bash
npm run lint        # Fix ESLint warnings
npm run types:check # TypeScript validation
composer test       # Full lint + Pest tests
```

---

## 9. Critical Gotchas

### 1. **ExternalMember is Read-Only**
```php
// ❌ Don't try this
ExternalMember::create(['name' => 'John']); // Fails; guarded = ['*']

// ✅ Extend via MemberDetail instead
MemberDetail::create([
  'member_id' => $externalId,
  'status_id' => 1,
  'department_id' => 1,
]);
```

### 2. **Dual Database Setup (MySQL)**
- **Default**: MySQL (`.env: DB_CONNECTION=mysql`)
- **External members**: MySQL (`myesc_db`)
- Konfigurasi di `.env`:
  ```
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_DATABASE=attendance_pro
  DB_USERNAME=root
  DB_PASSWORD=
  
  DB_EXT_CONNECTION=mysql
  DB_EXT_HOST=...
  DB_EXT_DATABASE=myey1771_myesc
  DB_EXT_USERNAME=...
  DB_EXT_PASSWORD=...
  ```

### 3. **Alur Data (Database → Frontend)**
Aplikasi ini menggunakan MySQL untuk seluruh sistem basis datanya:
-   **Main (MySQL)**: Menyimpan tabel `events`, `departments`, `member_statuses`, dan `member_details` di database `attendance_pro`.
-   **External (MySQL)**: Menyimpan data jemaat di model `ExternalMember` (database `myey1771_myesc`).

### 4. **ExternalMember Timestamps Disabled**
External table has no `created_at`/`updated_at`. Model disables timestamps (`$timestamps = false`) to prevent errors.

### 4. **Queue Driver is Database**
Jobs stored in `jobs` table. No external queue service configured. For production, consider Redis or SQS.

### 5. **Pagination with Relations**
Routes load paginated members, then attach details per page (avoids N+1). Note: `count()` loads all first; be explicit.

### 6. **Fortify Email Verification**
Fortify requires email verification on registration. Test email in dev (`.env: MAIL_DRIVER=log` logs to `storage/logs/`).

---

## 10. Testing

**Framework**: Pest PHP (modern, expressive)
```php
// tests/Feature/EventTest.php
test('user can view events')->actingAs($user)->get(route('events'))->assertOk();
```

**Run**: `php artisan test` or `composer test`

**Status**: Minimal tests; expand as features grow. Database refresh disabled by default for speed.

---

## 11. Key Files to Know

- [routes/web.php](routes/web.php) — All route definitions, auth middleware
- [resources/js/app.tsx](resources/js/app.tsx) — Inertia.js entry point
- [app/Models/ExternalMember.php](app/Models/ExternalMember.php) — Read-only bridge
- [vite.config.ts](vite.config.ts) — Build tooling
- [composer.json](composer.json) — `dev` script, dependencies
- [eslint.config.js](eslint.config.js) — React + TypeScript rules

---

*This file is the single source of truth for AI-assisted development within this repository.*
