-- ============================================================
-- 02: 가상코드 마이그레이션 (v1 → v2)
-- v1: owner_id (단일 UUID, 조직 또는 환자)
-- v2: owner_org_id + owner_patient_id (분리)
-- ============================================================

BEGIN;

-- 1. IN_STOCK / DISPOSED 코드: owner → owner_org_id
INSERT INTO virtual_codes (
  code, lot_id, status,
  owner_org_id, owner_patient_id,
  created_at, updated_at
)
SELECT
  vc_old.code,
  vc_old.lot_id,
  vc_old.status::code_status,
  vc_old.owner_id,        -- 조직 UUID
  NULL,
  vc_old.created_at,
  now()
FROM v1_virtual_codes vc_old
WHERE vc_old.status IN ('IN_STOCK', 'DISPOSED')
ON CONFLICT (code) DO NOTHING;

-- 2. USED 코드: owner → owner_patient_id (환자 UUID 매핑)
INSERT INTO virtual_codes (
  code, lot_id, status,
  owner_org_id, owner_patient_id,
  created_at, updated_at
)
SELECT
  vc_old.code,
  vc_old.lot_id,
  'USED'::code_status,
  NULL,
  p.id,                   -- v2 환자 UUID
  vc_old.created_at,
  now()
FROM v1_virtual_codes vc_old
-- v1에서 USED 상태의 owner_id는 환자 phone_number로 조인
-- (v1 구조에 따라 조인 조건 조정 필요)
JOIN v1_treatment_items ti ON ti.virtual_code_id = vc_old.id
JOIN v1_treatments t ON t.id = ti.treatment_id
JOIN patients p ON p.phone_number = t.patient_phone
WHERE vc_old.status = 'USED'
ON CONFLICT (code) DO NOTHING;

-- 3. 마이그레이션 로그
INSERT INTO migration_log (step, description, row_count, completed_at)
SELECT
  '02_migrate_virtual_codes',
  '가상코드 owner 분리 마이그레이션',
  count(*),
  now()
FROM virtual_codes;

COMMIT;

-- ============================================================
-- 참고: v1의 실제 테이블/컬럼명에 따라 조인 조건 수정 필요
-- 특히 USED 상태의 환자 매핑은 v1 treatment 테이블 참조
-- ============================================================
