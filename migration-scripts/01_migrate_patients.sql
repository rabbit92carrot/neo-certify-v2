-- ============================================================
-- 01: 환자 데이터 마이그레이션 (v1 → v2)
-- v1: patients 테이블에 phone_number가 PK
-- v2: UUID PK + phone_number UNIQUE
-- ============================================================

BEGIN;

-- 1. v1 환자 데이터를 v2 patients 테이블에 삽입
-- v1의 phone_number PK → v2에서는 UUID PK 자동 생성
INSERT INTO patients (phone_number, created_at, updated_at)
SELECT
  p_old.phone_number,
  COALESCE(p_old.created_at, now()),
  now()
FROM v1_patients p_old
ON CONFLICT (phone_number) DO NOTHING;

-- 2. 마이그레이션 로그
INSERT INTO migration_log (step, description, row_count, completed_at)
SELECT
  '01_migrate_patients',
  '환자 데이터 마이그레이션 (phone PK → UUID PK)',
  count(*),
  now()
FROM patients
WHERE created_at >= (SELECT min(created_at) FROM patients);

COMMIT;

-- ============================================================
-- 검증 쿼리
-- ============================================================
-- SELECT count(*) AS v1_count FROM v1_patients;
-- SELECT count(*) AS v2_count FROM patients;
-- 두 값이 일치해야 함
