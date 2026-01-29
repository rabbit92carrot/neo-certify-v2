-- ============================================================
-- 03: 이력(histories) 마이그레이션
-- v1 action_histories → v2 action_histories
-- v2에서 스키마 변경이 있다면 컬럼 매핑 조정
-- ============================================================

BEGIN;

-- 1. 출고 이력
INSERT INTO action_histories (
  virtual_code_id, action_type, actor_org_id,
  related_batch_id, metadata, created_at
)
SELECT
  vc.id,
  h_old.action_type::action_type,
  h_old.organization_id,
  h_old.batch_id,
  h_old.metadata,
  h_old.created_at
FROM v1_action_histories h_old
JOIN virtual_codes vc ON vc.code = (
  SELECT code FROM v1_virtual_codes WHERE id = h_old.virtual_code_id
)
ON CONFLICT DO NOTHING;

-- 2. 시술/회수 이력 (patient_id 매핑)
-- treatment 관련 이력은 환자 정보가 포함될 수 있음
-- v2에서 patient_id 컬럼이 추가되었다면:
-- UPDATE action_histories ah
-- SET patient_id = p.id
-- FROM v1_action_histories h_old
-- JOIN v1_treatments t ON ...
-- JOIN patients p ON p.phone_number = t.patient_phone
-- WHERE ah.virtual_code_id = ... AND ah.action_type IN ('TREATED', 'RECALL_TREATED');

-- 3. 마이그레이션 로그
INSERT INTO migration_log (step, description, row_count, completed_at)
SELECT
  '03_migrate_histories',
  '이력 데이터 마이그레이션',
  count(*),
  now()
FROM action_histories;

COMMIT;
