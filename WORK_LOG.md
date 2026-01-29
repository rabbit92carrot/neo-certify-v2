# Neo-Certify v2 Work Log

## 2025-07-20: Phase 3-1 프로젝트 초기화 ✅

### 완료 항목
- [x] GitHub 레포 생성 (rabbit92carrot/neo-certify-v2, public)
- [x] Next.js 16 + TypeScript strict + Tailwind CSS 4 초기화
- [x] tsconfig.json 강화 (noUncheckedIndexedAccess 등 v1 강점 유지)
- [x] Prettier 설정
- [x] Vitest + React Testing Library + Playwright 설정
- [x] 프로젝트 디렉토리 구조 생성 (설계 문서 기반)
- [x] 서비스/액션/타입/훅 placeholder 파일 생성
- [x] Supabase config + 초기 마이그레이션 (squashed schema)
  - owner_id 분리 (owner_org_id + owner_patient_id)
  - patients surrogate UUID PK
  - 모든 인덱스 + MV + RLS 포함
- [x] GitHub Actions CI 워크플로우
- [x] CLAUDE.md + README.md
- [x] Initial commit + push

### 다음 단계 (Phase 3-2)
- [ ] Supabase 클라이언트 설정 (server/client/admin)
- [ ] Auth 서비스 + 미들웨어 구현
- [ ] 공통 타입 정의 (ApiResponse<T>, database.types.ts MergeDeep)
- [ ] Zod 스키마 이전 (기존 프로젝트에서)
- [ ] 공통 서비스 (common.service.ts) 구현

## Phase 5: 테스트 + 마이그레이션 (2025-07-15)

### 완료
- [x] 알림톡 템플릿 미리보기 Mock 페이지 (카카오톡 UI 모방)
- [x] 단위 테스트 8개 파일 (49 tests all pass)
  - lib/retry, lib/security/hmac, lib/security/rate-limit
  - services/alimtalk, services/shipment, services/treatment
  - components/product-form, components/data-table
- [x] 마이그레이션 스크립트 4개 + README
  - 01_migrate_patients, 02_migrate_virtual_codes, 03_migrate_histories, 04_verify_integrity

### 커밋 정리 (rebase) — 스킵
이전 Phase의 큰 커밋들(7eb2394, 0140bac, a614d1b, 1694a95) 분할은
interactive rebase의 복잡성과 충돌 리스크가 높아 스킵함.
향후 필요 시 수동으로 정리 가능.
