# CLAUDE.md - Neo-Certify v2 Context

## Project Overview
의료기기 정품 인증 시스템 v2. Next.js 16 App Router + Supabase + TypeScript strict.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.x (strict, noUncheckedIndexedAccess)
- **DB**: Supabase (PostgreSQL + Auth + Storage), Docker local dev
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Validation**: Zod 4
- **Forms**: react-hook-form 7
- **Testing**: Vitest + React Testing Library + Playwright

## Architecture Patterns
- **Data flow**: Server Action → Service → Supabase RPC (SECURITY DEFINER)
- **All DB mutations** go through atomic RPC functions (FIFO, ownership, history in one TX)
- **owner_org_id / owner_patient_id** split design (never use generic owner_id)
- **Cursor pagination** for all list queries
- **ApiResponse<T>** pattern for service returns
- **3-layer auth**: Middleware → Server Action → DB RLS

## Key Commands
```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run test:unit    # Unit tests
npm run test:component # Component tests
npm run test:e2e     # Playwright E2E
npm run gen:types    # Regenerate Supabase types
```

## Directory Structure
- `src/app/(dashboard)/{role}/actions/` - Server Actions split by feature
- `src/services/` - Business logic layer
- `src/lib/supabase/` - Supabase clients (server/client/admin)
- `src/lib/validations/` - Zod schemas
- `src/components/{views,forms,tables,shared,layout}` - UI components
- `supabase/migrations/` - DB migrations

## Important Rules
- Never bypass RPC for mutations (no direct table inserts from app code)
- All owner references use split columns (owner_org_id + owner_patient_id)
- FIFO code selection via `select_fifo_codes()` RPC with FOR UPDATE SKIP LOCKED
- patients table uses UUID PK (not phone_number)
- Use `after()` for non-critical async work (notifications, revalidation)
