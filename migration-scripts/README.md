# Neo-Certify v1 → v2 마이그레이션 가이드

## 개요

v1에서 v2로의 데이터 마이그레이션 스크립트입니다.

### 주요 스키마 변경점

| 항목 | v1 | v2 |
|------|----|----|
| patients PK | `phone_number` (VARCHAR) | `id` (UUID) + `phone_number` UNIQUE |
| virtual_codes owner | `owner_id` (단일 UUID) | `owner_org_id` + `owner_patient_id` (분리) |
| CHECK 제약 | 없음 | 상태별 owner 무결성 CHECK |

## 실행 순서

> ⚠️ **반드시 순서대로 실행하세요.** FK 의존성이 있습니다.

```
1. 01_migrate_patients.sql      — 환자 데이터 (UUID PK 생성)
2. 02_migrate_virtual_codes.sql — 가상코드 (owner 분리)
3. 03_migrate_histories.sql     — 이력 데이터
4. 04_verify_integrity.sql      — 무결성 검증 (필수!)
```

## 사전 준비

### 1. v1 테이블 접근 설정

마이그레이션 스크립트는 `v1_` 접두사로 v1 테이블을 참조합니다.

```sql
-- 옵션 A: Foreign Data Wrapper (다른 DB인 경우)
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
-- ... FDW 설정 ...

-- 옵션 B: 같은 DB 내라면 스키마 분리
ALTER TABLE old_patients RENAME TO v1_patients;
ALTER TABLE old_virtual_codes RENAME TO v1_virtual_codes;
-- ...
```

### 2. migration_log 테이블 생성

```sql
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  step VARCHAR NOT NULL,
  description TEXT,
  row_count INTEGER,
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. 백업

```bash
# Supabase 프로젝트 백업
supabase db dump -f backup_before_migration.sql

# 또는 pg_dump
pg_dump -Fc $DATABASE_URL > backup_v1.dump
```

## 실행

```bash
# 하나씩 실행 (권장)
psql $DATABASE_URL -f 01_migrate_patients.sql
psql $DATABASE_URL -f 02_migrate_virtual_codes.sql
psql $DATABASE_URL -f 03_migrate_histories.sql

# 검증 (반드시!)
psql $DATABASE_URL -f 04_verify_integrity.sql
```

## 주의사항

1. **트랜잭션**: 각 스크립트는 `BEGIN/COMMIT`으로 감싸져 있어 실패 시 자동 롤백됩니다.
2. **멱등성**: `ON CONFLICT DO NOTHING`으로 재실행 안전합니다.
3. **v1 테이블명**: 실제 v1 테이블명에 맞게 `v1_` 접두사 부분을 수정하세요.
4. **USED 코드 매핑**: `02_migrate_virtual_codes.sql`의 USED 상태 환자 매핑 조인은 v1 구조에 따라 조정이 필요합니다.
5. **다운타임**: 마이그레이션 중 서비스 중단을 권장합니다 (데이터 정합성).
6. **롤백 계획**: 문제 발생 시 백업에서 복원하세요.

## 검증 체크리스트

- [ ] `04_verify_integrity.sql` 모든 항목 ✅ PASS
- [ ] 환자 수 일치
- [ ] 가상코드 수 일치
- [ ] 상태별 분포 일치
- [ ] USED 코드에 owner_patient_id 존재
- [ ] IN_STOCK/DISPOSED 코드에 owner_org_id 존재
- [ ] FK 정합성 확인
- [ ] 앱에서 기본 기능 동작 확인 (로그인, 조회, 시술 등)
