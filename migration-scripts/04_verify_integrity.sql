-- ============================================================
-- 04: 무결성 검증 쿼리
-- 마이그레이션 후 반드시 실행하여 데이터 정합성 확인
-- ============================================================

-- 1. 환자 수 비교
SELECT 'patients' AS entity,
  (SELECT count(*) FROM v1_patients) AS v1_count,
  (SELECT count(*) FROM patients) AS v2_count,
  CASE
    WHEN (SELECT count(*) FROM v1_patients) = (SELECT count(*) FROM patients)
    THEN '✅ PASS'
    ELSE '❌ MISMATCH'
  END AS result;

-- 2. 가상코드 수 비교
SELECT 'virtual_codes' AS entity,
  (SELECT count(*) FROM v1_virtual_codes) AS v1_count,
  (SELECT count(*) FROM virtual_codes) AS v2_count,
  CASE
    WHEN (SELECT count(*) FROM v1_virtual_codes) = (SELECT count(*) FROM virtual_codes)
    THEN '✅ PASS'
    ELSE '❌ MISMATCH'
  END AS result;

-- 3. 가상코드 상태별 분포 비교
SELECT 'vc_status_IN_STOCK' AS check_name,
  (SELECT count(*) FROM v1_virtual_codes WHERE status = 'IN_STOCK') AS v1_count,
  (SELECT count(*) FROM virtual_codes WHERE status = 'IN_STOCK') AS v2_count;

SELECT 'vc_status_USED' AS check_name,
  (SELECT count(*) FROM v1_virtual_codes WHERE status = 'USED') AS v1_count,
  (SELECT count(*) FROM virtual_codes WHERE status = 'USED') AS v2_count;

SELECT 'vc_status_DISPOSED' AS check_name,
  (SELECT count(*) FROM v1_virtual_codes WHERE status = 'DISPOSED') AS v1_count,
  (SELECT count(*) FROM virtual_codes WHERE status = 'DISPOSED') AS v2_count;

-- 4. owner 무결성: USED 코드는 반드시 owner_patient_id 있어야 함
SELECT 'vc_used_has_patient' AS check_name,
  count(*) AS orphaned_count,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ ORPHANED USED CODES'
  END AS result
FROM virtual_codes
WHERE status = 'USED' AND owner_patient_id IS NULL;

-- 5. IN_STOCK/DISPOSED 코드는 반드시 owner_org_id 있어야 함
SELECT 'vc_stock_has_org' AS check_name,
  count(*) AS orphaned_count,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ ORPHANED STOCK CODES'
  END AS result
FROM virtual_codes
WHERE status IN ('IN_STOCK', 'DISPOSED') AND owner_org_id IS NULL;

-- 6. 이력 수 비교
SELECT 'action_histories' AS entity,
  (SELECT count(*) FROM v1_action_histories) AS v1_count,
  (SELECT count(*) FROM action_histories) AS v2_count,
  CASE
    WHEN (SELECT count(*) FROM v1_action_histories) <= (SELECT count(*) FROM action_histories)
    THEN '✅ PASS (v2 >= v1)'
    ELSE '⚠️ CHECK - v2 has fewer records'
  END AS result;

-- 7. FK 정합성: virtual_codes → lots
SELECT 'vc_lot_fk' AS check_name,
  count(*) AS broken_fk,
  CASE
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ BROKEN FK'
  END AS result
FROM virtual_codes vc
LEFT JOIN lots l ON l.id = vc.lot_id
WHERE l.id IS NULL;

-- 8. 마이그레이션 로그 요약
SELECT step, description, row_count, completed_at
FROM migration_log
ORDER BY completed_at;
