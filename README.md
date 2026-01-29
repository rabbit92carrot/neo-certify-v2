# Neo-Certify v2

의료기기 정품 인증 시스템 (개선판)

## Overview

의료기기의 생산 → 유통 → 시술 → 폐기 전 과정을 추적하는 정품 인증 플랫폼입니다.

### 4개 역할
- **제조사**: 제품 등록, Lot 생산, 가상코드 발행, 출고
- **유통사**: 입고 확인, 재출고, 반품
- **병원**: 시술 등록 (환자 연결), 폐기, 재고 관리
- **관리자**: 조직 승인/관리, 전체 이력 조회

## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript 5 (strict mode)
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS 4 + shadcn/ui
- Zod 4 + react-hook-form
- Vitest + Playwright

## Getting Started

```bash
# Install dependencies
npm install

# Start Supabase local (requires Docker)
npx supabase start

# Run development server
npm run dev
```

## Key Design Decisions (v2)

- **owner_id split**: `owner_org_id` (UUID) + `owner_patient_id` (UUID) 타입 안전성
- **patients surrogate PK**: UUID PK + phone_number UNIQUE (PII를 PK에서 분리)
- **Squashed migration**: 55개 → 1개 초기 마이그레이션으로 깨끗한 시작
- **Actions split**: 역할별 actions/ 디렉토리로 기능 분할
- **SECURITY DEFINER only**: 레거시 이중 RPC 제거

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run test:unit` | Unit tests |
| `npm run test:component` | Component tests |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run gen:types` | Regenerate Supabase types |

## License

Private
