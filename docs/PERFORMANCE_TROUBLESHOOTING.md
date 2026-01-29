# 성능 및 데이터 동기화 트러블슈팅 가이드

> 운영 중 문제 발생 시 참고할 개선 방향 문서

---

## 1. 재고 동기화 문제

### 증상: "다른 사용자가 변경한 재고가 내 화면에 늦게 반영된다"

**현재 보호 수준:**
- 내 작업 → 즉시 반영 (mutation 후 invalidate)
- 다른 사용자 작업 → 최대 30초 지연 (staleTime)
- 탭 전환 시 → 즉시 갱신 (refetchOnWindowFocus)
- 동시 충돌 → DB에서 차단 (FOR UPDATE SKIP LOCKED)

**문제가 심각해지는 경우:**
- 여러 사용자가 같은 재고를 동시에 출고하려 할 때
- 실시간 재고 확인이 중요한 대량 출고 작업 시

**개선 방향 (단계별):**

| 단계 | 방법 | 효과 | 비용 |
|------|------|------|------|
| 1단계 | staleTime을 30초 → 10초로 줄이기 | 지연 1/3 감소 | API 호출 약간 증가 |
| 2단계 | 재고 페이지에 "새로고침" 버튼 추가 | 사용자가 원할 때 즉시 갱신 | 거의 없음 |
| 3단계 | 재고 페이지만 refetchInterval 10초 폴링 | 자동 갱신 | API 호출 증가 |
| 4단계 | **Supabase Realtime 도입** | 실시간 (~1초) | 구현 복잡도 중간 |

**Supabase Realtime 도입 방법 (4단계):**
```typescript
// Supabase Realtime으로 virtual_codes 테이블 변경 감지
const channel = supabase
  .channel('inventory-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'virtual_codes',
    filter: `owner_org_id=eq.${orgId}`,
  }, () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  })
  .subscribe();
```

---

## 2. 페이지 이동 속도 문제

### 증상: "페이지 이동이 느리다, 로딩 스피너가 자주 보인다"

**현재 구조:**
- 대시보드: react-query 캐시 + 하이브리드 렌더링
- 공개 페이지: SSR (서버 렌더링)

**개선 방향:**

| 단계 | 방법 | 효과 |
|------|------|------|
| 1단계 | react-query의 `placeholderData` 활용 — 이전 데이터를 보여주면서 새 데이터 로드 | 로딩 스피너 제거 |
| 2단계 | 사이드바 링크에 `prefetchQuery` 추가 — 마우스 hover 시 미리 로드 | 페이지 이동 시 즉시 렌더링 |
| 3단계 | Next.js `<Link prefetch>` 적극 활용 — 라우트 수준 prefetch | 코드 번들 미리 로드 |
| 4단계 | 자주 방문하는 페이지 데이터를 앱 시작 시 prefetch | 첫 방문도 즉시 |

---

## 3. 대시보드 초기 로드 느림

### 증상: "로그인 후 대시보드가 늦게 뜬다"

**원인 가능성:**
1. Server Component에서 DB 쿼리가 느림
2. 통계 집계 쿼리(MV)가 오래됨
3. 번들 크기가 큼

**개선 방향:**

| 원인 | 확인 방법 | 해결 |
|------|----------|------|
| DB 쿼리 느림 | Supabase Dashboard → SQL Editor에서 EXPLAIN ANALYZE | 인덱스 추가, 쿼리 최적화 |
| MV 갱신 지연 | `SELECT * FROM pg_stat_user_tables WHERE relname LIKE 'mv_%'` | pg_cron 갱신 주기 조정 |
| 번들 큼 | `npx next build --analyze` (next-bundle-analyzer 설치 필요) | dynamic import로 코드 분할 |

---

## 4. 동시 작업 충돌

### 증상: "출고했는데 이미 다른 사람이 출고한 제품이었다"

**현재 보호:**
- FIFO + `FOR UPDATE SKIP LOCKED` — 동일 가상코드를 동시에 선택 불가
- RPC가 원자적으로 실행 — 중간 상태 없음

**그래도 문제가 발생하면:**

| 단계 | 방법 |
|------|------|
| 1단계 | 출고 폼 제출 시 서버에서 재고 재확인 후 처리 (이미 적용됨) |
| 2단계 | 장바구니에 담긴 코드가 여전히 유효한지 제출 전 확인 API 추가 |
| 3단계 | **Optimistic Locking** — 재고 조회 시 version 번호 포함, 출고 시 version 일치해야 처리 |
| 4단계 | Supabase Realtime으로 장바구니 담긴 코드의 상태 변경 감지 → 경고 표시 |

---

## 5. API 호출 과다

### 증상: "Supabase 무료 플랜 API 호출 한도에 근접한다"

**현재 캐시 설정:**
- Static (제품/조직): staleTime 5분, gcTime 30분
- Transactional (재고/출고): staleTime 30초, gcTime 5분
- Realtime (회수): staleTime 0초, 1분 폴링

**개선 방향:**

| 단계 | 방법 | 절감 효과 |
|------|------|----------|
| 1단계 | Static 데이터 staleTime을 5분 → 15분으로 증가 | 제품/조직 호출 1/3 |
| 2단계 | 비활성 탭에서 refetch 비활성화 (`refetchOnWindowFocus: false` for static) | 탭 전환 호출 제거 |
| 3단계 | 회수 페이지 폴링을 1분 → 5분으로 (회수 윈도우가 24시간이라 여유 있음) | 폴링 호출 1/5 |
| 4단계 | **Redis 캐시 도입** (Upstash) — 서버 사이드에서 Supabase 호출 캐싱 | DB 호출 대폭 감소 |

---

## 6. 프로덕션 성능 측정

### 배포 후 반드시 확인할 것

```bash
# Lighthouse CI로 성능 측정
npx lighthouse http://your-domain.com/login --output=json

# 확인할 지표
# - FCP (First Contentful Paint): < 1.5초
# - LCP (Largest Contentful Paint): < 2.5초  
# - TTI (Time to Interactive): < 3.5초
# - CLS (Cumulative Layout Shift): < 0.1
```

### Vercel Analytics 활용
- `@vercel/analytics` 설치 → 실제 사용자 Web Vitals 수집
- 느린 페이지 자동 감지

### Supabase Dashboard 모니터링
- Database → Query Performance → 느린 쿼리 식별
- API → 호출 빈도, 에러율 확인

---

## 7. 기술 부채 관리

### 현재 의도적으로 단순화한 것들

| 항목 | 현재 상태 | 확장이 필요한 시점 |
|------|----------|------------------|
| 캐시 | react-query 메모리 캐시 | 사용자 수 증가 → Redis 도입 |
| 실시간 | staleTime 기반 폴링 | 동시 작업자 증가 → Supabase Realtime |
| Prefetch | 없음 | 페이지 이동 UX 불만 → hover prefetch |
| Optimistic Update | invalidation만 사용 | 폼 제출 후 딜레이 불만 → optimistic mutation |
| 번들 최적화 | Next.js 자동 | 초기 로드 느림 → dynamic import + 수동 chunk |
| 모니터링 | 없음 | 프로덕션 배포 → Vercel Analytics + Sentry |

**원칙: 문제가 실제로 발생한 후에 해당 단계를 적용한다. 미리 최적화하지 않는다.**
