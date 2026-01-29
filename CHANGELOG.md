# Neo-Certify v2 — 변경점 및 개선 사항

> 기존 프로젝트(neo-certify v1)와의 비교

---

## 1. 아키텍처 변경

### DB 스키마 — `owner_id` 분리
| v1 | v2 | 변경 이유 |
|----|-----|----------|
| `owner_id VARCHAR` (UUID/전화번호 혼재) | `owner_org_id UUID` + `owner_patient_id UUID` 분리 | v1에서 owner_id가 조직 UUID일 때도, 환자 전화번호일 때도 있어서 타입 안전성이 깨졌음. FK 관계 불가능, 쿼리 시 캐스팅 필요. v2에서 명확히 분리하여 FK 제약조건 적용 가능 |

### DB 스키마 — `patients` PK 변경
| v1 | v2 | 변경 이유 |
|----|-----|----------|
| `phone_number` VARCHAR가 PK | Surrogate UUID PK + `phone_number` UNIQUE | PII(개인정보)가 PK이면 변경 불가, GDPR/개인정보보호법 리스크. UUID PK로 전환하여 PII 노출 최소화 |

### RPC 함수 정리
| v1 | v2 | 변경 이유 |
|----|-----|----------|
| 레거시 + SECURITY DEFINER 이중 RPC | SECURITY DEFINER만 유지 | v1에 동일 기능의 RPC가 2개씩 존재(레거시 호환용). 혼란 제거, 단일 진입점 |

### 마이그레이션 정리
| v1 | v2 | 변경 이유 |
|----|-----|----------|
| 55개 누적 마이그레이션 | Squashed 단일 초기 마이그레이션 + RPC | v1의 55개 중 ~20개가 이전 마이그레이션 수정(타입 캐스팅 4회, MAX UUID 3회 등). 신규 프로젝트는 깨끗한 시작이 효율적 |

---

## 2. 기술 스택 업그레이드

| 항목 | v1 | v2 | 이유 |
|------|-----|-----|------|
| Next.js | 15.x | 16.x | Turbopack 정식, Server Actions 성숙 |
| React | 18/19 | 19.x | `use()`, `cache()` 활용 |
| Tailwind CSS | 3.x | 4.x | 최신 |
| Zod | 3.x | 4.x | 성능 개선, 에코시스템 호환 |
| 캐싱 | `unstable_cache()` | React `cache()` + `revalidateTag` | `unstable_cache` API 불안정, Next.js 공식 권장 대체 |
| 테스트 | 없음 | Vitest + RTL + Playwright | 기존 테스트 0개 → 단위 49개 + E2E 54개 |
| CI/CD | revert됨 | GitHub Actions (ci.yml) | PR마다 lint + type-check + test 자동화 |

---

## 3. 코드 구조 개선

### 서비스 레이어 분리
| v1 | v2 |
|----|-----|
| 일부 서비스가 비대 (shipment.service.ts ~500줄) | 12개 서비스로 분리 (common, auth, user, certificate, notification, product, organization, lot, inventory, shipment, treatment, disposal, history, alimtalk) |

### Server Actions 역할별 분할
| v1 | v2 |
|----|-----|
| 단일 actions 디렉토리에 혼재 | 역할별 분할: `manufacturer/actions/`, `distributor/actions/`, `hospital/actions/`, `admin/actions/` |

### Zod 스키마 모듈화
| v1 | v2 |
|----|-----|
| 단일 schemas 파일 | 6개 모듈: common, auth, organization, product, shipment, treatment |

### 컴포넌트 구조
| v1 | v2 |
|----|-----|
| shadcn/ui + 비즈니스 컴포넌트 혼재 | `ui/` (17개 기본 컴포넌트) + `forms/` + `data-table/` + `layout/` + `cart/` + `search/` 명확 분리 |

---

## 4. 신규 기능

### 알림톡 (Aligo API)
- **v1**: Mock 상태, 실제 발송 안 됨
- **v2**: Aligo REST API 클라이언트 구현, 5개 템플릿 (시술완료, 출고, 회수, 승인, 반려), 지수 백오프 재시도, 웹훅 수신 엔드포인트, **카카오톡 스타일 Mock 미리보기 페이지** (템플릿 심사 전 확인용)

### 보안 강화
| 항목 | v1 | v2 |
|------|-----|-----|
| CSP 헤더 | 없음 | ✅ Content-Security-Policy + 보안 헤더 |
| HMAC 키 로테이션 | 단일 키 | ✅ 키 로테이션 지원 (현재 키 + 이전 키 검증) |
| Rate Limiting | 기본 | ✅ Upstash + 메모리 폴백 |
| CSRF 보호 | 없음 | ✅ 토큰 기반 CSRF 보호 |
| 공개 API | 없음 | ✅ `/api/verify`, `/api/inquiry` (rate limited) |

### 테스트
| 항목 | v1 | v2 |
|------|-----|-----|
| 단위 테스트 | 0개 | 49개 (FIFO, 24h 회수, HMAC, Rate Limit, 재시도, 템플릿 바인딩, 폼/테이블 렌더링) |
| E2E 테스트 | 0개 | 54개 (인증, 4역할 흐름, 공개 페이지, 보안/권한 체크) |
| CI/CD | 없음 | GitHub Actions (lint + type-check + test) |

### 데이터 마이그레이션
- v1 → v2 마이그레이션 SQL 스크립트 4개 + 무결성 검증 쿼리 + 실행 가이드
- 환자 데이터, 가상코드 owner 분리, 이력 데이터 이전

### 시드 데이터
- 현실적인 한국 의료기기 시나리오: 5개 조직, 7개 제품, 15개 Lot, 198개 가상코드, 5명 환자, 출고/시술/폐기/반품 이력
- `supabase start` 시 자동 삽입

---

## 5. 유지한 v1 강점

| 항목 | 설명 |
|------|------|
| TypeScript strict mode | `noUncheckedIndexedAccess`, `noImplicitReturns` 등 엄격한 설정 유지 |
| FIFO 출고 | `FOR UPDATE SKIP LOCKED` 기반 원자적 출고 유지 |
| 장바구니 패턴 | `useCart` 훅으로 출고/폐기 시 다중 선택 유지 |
| 커서 페이지네이션 | 대량 데이터 성능 보장 |
| HMAC 가상코드 | 위변조 방지 서명 유지 |
| RLS + SECURITY DEFINER | 행 수준 보안 유지 |
| ApiResponse<T> | 일관된 API 응답 패턴 유지 |
| 환자 자동완성 | 시술 시 환자 검색 UX 유지 |

---

## 6. 프로젝트 규모

| 항목 | 수치 |
|------|------|
| 총 커밋 | 109개 (작은 논리적 단위) |
| 소스 파일 | 149개 (TS/TSX) |
| 코드 라인 | ~12,800줄 (TS/TSX) |
| SQL | ~1,800줄 (스키마 + RPC + 시드 + 마이그레이션) |
| 테스트 | 49 단위 + 54 E2E = 103개 |
| TypeScript | strict mode, 컴파일 에러 0 |
