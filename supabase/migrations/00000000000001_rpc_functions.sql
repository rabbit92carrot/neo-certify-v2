-- =============================================================================
-- RPC Functions for neo-certify v2
-- 
-- Key changes from v1:
-- - owner_id (VARCHAR) → owner_org_id (UUID) + owner_patient_id (UUID)
-- - SECURITY DEFINER only (no legacy overloads)
-- - search_path = public on all functions
-- - owner_type enum removed; ownership determined by which FK is set
-- =============================================================================

-- ============================================================================
-- Helper: get_user_organization_id (referenced by atomic functions)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM organizations
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- Helper: get_user_organization_type
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_organization_type()
RETURNS org_type
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT type FROM organizations
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- Helper: is_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE auth_user_id = auth.uid()
      AND type = 'ADMIN'
  );
$$;

-- ============================================================================
-- Helper: generate_virtual_code
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_virtual_code()
RETURNS VARCHAR
LANGUAGE sql
AS $$
  SELECT 'NC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

-- ============================================================================
-- Helper: get_or_create_patient
-- Returns patient ID (not phone) for v2 owner_patient_id FK
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_patient(p_phone VARCHAR)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  SELECT id INTO v_patient_id FROM patients WHERE phone_number = p_phone;
  IF NOT FOUND THEN
    INSERT INTO patients (phone_number)
    VALUES (p_phone)
    ON CONFLICT (phone_number) DO NOTHING
    RETURNING id INTO v_patient_id;
    -- Handle race condition
    IF v_patient_id IS NULL THEN
      SELECT id INTO v_patient_id FROM patients WHERE phone_number = p_phone;
    END IF;
  END IF;
  RETURN v_patient_id;
END;
$$;

-- ============================================================================
-- Lot: add_quantity_to_lot (production)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_quantity_to_lot(
  p_lot_id UUID,
  p_additional_quantity INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manufacturer_id UUID;
  v_current_quantity INT;
  v_new_quantity INT;
BEGIN
  IF p_additional_quantity <= 0 THEN
    RAISE EXCEPTION 'Additional quantity must be positive: %', p_additional_quantity;
  END IF;

  SELECT l.quantity, p.organization_id
  INTO v_current_quantity, v_manufacturer_id
  FROM lots l
  JOIN products p ON p.id = l.product_id
  WHERE l.id = p_lot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot not found: %', p_lot_id;
  END IF;

  v_new_quantity := v_current_quantity + p_additional_quantity;
  IF v_new_quantity > 100000 THEN
    RAISE EXCEPTION 'Total quantity exceeds maximum limit (100,000)';
  END IF;

  UPDATE lots SET quantity = v_new_quantity WHERE id = p_lot_id;

  -- v2: owner_org_id instead of owner_id
  INSERT INTO virtual_codes (code, lot_id, status, owner_org_id)
  SELECT generate_virtual_code(), p_lot_id, 'IN_STOCK', v_manufacturer_id
  FROM generate_series(1, p_additional_quantity);

  RETURN v_new_quantity;
END;
$$;

-- ============================================================================
-- process_shipment (FIFO + FOR UPDATE SKIP LOCKED)
-- Replaces create_shipment_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_shipment(
  p_to_org_id UUID,
  p_to_org_type org_type,
  p_items JSONB
)
RETURNS TABLE(
  shipment_batch_id UUID,
  total_quantity INTEGER,
  error_code VARCHAR,
  error_message VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_org_id UUID;
  v_batch_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_lot_id UUID;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  v_from_org_id := get_user_organization_id();

  IF v_from_org_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요하거나 조직에 소속되어 있지 않습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_from_org_id = p_to_org_id THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'SELF_SHIPMENT'::VARCHAR,
      '자기 자신에게는 출고할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_to_org_id AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '수신 조직을 찾을 수 없거나 비활성 상태입니다.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO shipment_batches (from_organization_id, to_organization_id, to_organization_type)
  VALUES (v_from_org_id, p_to_org_id, p_to_org_type)
  RETURNING id INTO v_batch_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;
    v_lot_id := NULLIF(v_item->>'lotId', '')::UUID;

    -- FIFO selection with owner_org_id (v2)
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_org_id = v_from_org_id
        AND vc.owner_patient_id IS NULL
        AND (v_lot_id IS NULL OR vc.lot_id = v_lot_id)
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL
       OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
      VALUES (v_batch_id, v_code_id);

      -- Transfer ownership: org → org
      UPDATE virtual_codes
      SET owner_org_id = p_to_org_id,
          owner_patient_id = NULL
      WHERE id = v_code_id;

      -- SHIPPED history
      INSERT INTO histories (
        virtual_code_id, action_type,
        from_org_id, to_org_id,
        shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'SHIPPED',
        v_from_org_id, p_to_org_id,
        v_batch_id, FALSE
      );

      -- RECEIVED history
      INSERT INTO histories (
        virtual_code_id, action_type,
        from_org_id, to_org_id,
        shipment_batch_id, is_recall
      ) VALUES (
        v_code_id, 'RECEIVED',
        v_from_org_id, p_to_org_id,
        v_batch_id, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_batch_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;

-- ============================================================================
-- process_treatment (FIFO + patient ownership via owner_patient_id)
-- Replaces create_treatment_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_treatment(
  p_patient_phone VARCHAR,
  p_treatment_date DATE,
  p_items JSONB
)
RETURNS TABLE(
  treatment_id UUID,
  total_quantity INTEGER,
  error_code VARCHAR,
  error_message VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital_id UUID;
  v_hospital_type org_type;
  v_treatment_id UUID;
  v_patient_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  v_hospital_type := get_user_organization_type();
  IF v_hospital_type != 'HOSPITAL' THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'FORBIDDEN'::VARCHAR,
      '병원만 시술을 등록할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = v_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR,
      '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- v2: get patient UUID
  v_patient_id := get_or_create_patient(p_patient_phone);

  INSERT INTO treatment_records (hospital_id, patient_id, treatment_date)
  VALUES (v_hospital_id, v_patient_id, p_treatment_date)
  RETURNING id INTO v_treatment_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- FIFO: org-owned codes only
    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_org_id = v_hospital_id
        AND vc.owner_patient_id IS NULL
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL
       OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO treatment_details (treatment_id, virtual_code_id)
      VALUES (v_treatment_id, v_code_id);

      -- Transfer ownership: org → patient
      UPDATE virtual_codes
      SET owner_org_id = NULL,
          owner_patient_id = v_patient_id,
          status = 'USED'
      WHERE id = v_code_id;

      INSERT INTO histories (
        virtual_code_id, action_type,
        from_org_id, to_patient_id,
        treatment_id, is_recall
      ) VALUES (
        v_code_id, 'TREATED',
        v_hospital_id, v_patient_id,
        v_treatment_id, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_treatment_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;

-- ============================================================================
-- process_disposal
-- Replaces create_disposal_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_disposal(
  p_disposal_date DATE,
  p_disposal_reason_type disposal_reason,
  p_disposal_reason_custom TEXT,
  p_items JSONB
)
RETURNS TABLE(
  disposal_id UUID,
  total_quantity INTEGER,
  error_code VARCHAR,
  error_message VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital_id UUID;
  v_hospital_type org_type;
  v_disposal_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INT;
  v_selected_codes UUID[];
  v_code_id UUID;
  v_total INT := 0;
BEGIN
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  v_hospital_type := get_user_organization_type();
  IF v_hospital_type != 'HOSPITAL' THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'FORBIDDEN'::VARCHAR,
      '병원만 폐기를 등록할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = v_hospital_id AND type = 'HOSPITAL' AND status = 'ACTIVE'
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'HOSPITAL_NOT_FOUND'::VARCHAR,
      '병원 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF p_disposal_reason_type = 'OTHER' AND (p_disposal_reason_custom IS NULL OR TRIM(p_disposal_reason_custom) = '') THEN
    RETURN QUERY SELECT NULL::UUID, 0, 'REASON_REQUIRED'::VARCHAR,
      '기타 사유를 입력해주세요.'::VARCHAR;
    RETURN;
  END IF;

  INSERT INTO disposal_records (
    hospital_id, disposal_date, disposal_reason_type, disposal_reason_custom
  ) VALUES (
    v_hospital_id, p_disposal_date, p_disposal_reason_type,
    CASE WHEN p_disposal_reason_type = 'OTHER' THEN TRIM(p_disposal_reason_custom) ELSE NULL END
  )
  RETURNING id INTO v_disposal_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    SELECT ARRAY(
      SELECT vc.id
      FROM virtual_codes vc
      JOIN lots l ON vc.lot_id = l.id
      WHERE l.product_id = v_product_id
        AND vc.status = 'IN_STOCK'
        AND vc.owner_org_id = v_hospital_id
        AND vc.owner_patient_id IS NULL
      ORDER BY l.manufacture_date ASC, l.created_at ASC, vc.created_at ASC
      LIMIT v_quantity
      FOR UPDATE OF vc SKIP LOCKED
    ) INTO v_selected_codes;

    IF v_selected_codes IS NULL OR array_length(v_selected_codes, 1) IS NULL
       OR array_length(v_selected_codes, 1) < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:재고가 부족합니다. 요청: %개, 가능: %개',
        v_quantity, COALESCE(array_length(v_selected_codes, 1), 0);
    END IF;

    FOREACH v_code_id IN ARRAY v_selected_codes
    LOOP
      INSERT INTO disposal_details (disposal_id, virtual_code_id)
      VALUES (v_disposal_id, v_code_id);

      UPDATE virtual_codes
      SET status = 'DISPOSED', updated_at = NOW()
      WHERE id = v_code_id;

      INSERT INTO histories (
        virtual_code_id, action_type,
        from_org_id, to_org_id,
        disposal_id, is_recall
      ) VALUES (
        v_code_id, 'DISPOSED',
        v_hospital_id, v_hospital_id,
        v_disposal_id, FALSE
      );

      v_total := v_total + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT v_disposal_id, v_total, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE 'INSUFFICIENT_STOCK:%' THEN
      RETURN QUERY SELECT NULL::UUID, 0, 'INSUFFICIENT_STOCK'::VARCHAR,
        SUBSTRING(SQLERRM FROM 19)::VARCHAR;
    ELSE
      RETURN QUERY SELECT NULL::UUID, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
    END IF;
END;
$$;

-- ============================================================================
-- process_return (receiver-initiated, no time limit, partial support)
-- Replaces return_shipment_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_return(
  p_shipment_batch_id UUID,
  p_reason VARCHAR,
  p_product_quantities JSONB DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  returned_count INTEGER,
  new_batch_id UUID,
  error_code VARCHAR,
  error_message VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_org_id UUID;
  v_batch RECORD;
  v_all_code_ids UUID[];
  v_owned_code_ids UUID[];
  v_selected_code_ids UUID[];
  v_sender_org_id UUID;
  v_sender_org_type org_type;
  v_new_batch_id UUID;
  v_count INT := 0;
  v_item RECORD;
  v_product_code_ids UUID[];
  v_quantity_to_select INT;
BEGIN
  v_recipient_org_id := get_user_organization_id();

  IF v_recipient_org_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT * INTO v_batch
  FROM shipment_batches
  WHERE id = p_shipment_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'BATCH_NOT_FOUND'::VARCHAR,
      '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  v_sender_org_id := v_batch.from_organization_id;

  SELECT type INTO v_sender_org_type
  FROM organizations WHERE id = v_sender_org_id;

  IF v_sender_org_type IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'ORGANIZATION_NOT_FOUND'::VARCHAR,
      '발송 조직 정보를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_all_code_ids
  FROM shipment_details sd
  WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_all_code_ids IS NULL OR array_length(v_all_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'NO_DETAILS'::VARCHAR,
      '반품할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- v2: owner_org_id check
  SELECT ARRAY_AGG(vc.id) INTO v_owned_code_ids
  FROM virtual_codes vc
  WHERE vc.id = ANY(v_all_code_ids)
    AND vc.owner_org_id = v_recipient_org_id
    AND vc.owner_patient_id IS NULL;

  IF v_owned_code_ids IS NULL OR array_length(v_owned_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'CODES_NOT_OWNED'::VARCHAR,
      '반품할 제품이 없습니다. 현재 조직이 소유한 코드가 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF p_product_quantities IS NULL THEN
    v_selected_code_ids := v_owned_code_ids;
  ELSE
    v_selected_code_ids := ARRAY[]::UUID[];

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_product_quantities)
      AS x("productId" UUID, "quantity" INT)
    LOOP
      v_quantity_to_select := v_item."quantity";

      SELECT ARRAY_AGG(sub.id ORDER BY sub.manufacture_date, sub.created_at)
      INTO v_product_code_ids
      FROM (
        SELECT vc.id, l.manufacture_date, vc.created_at
        FROM virtual_codes vc
        JOIN lots l ON vc.lot_id = l.id
        WHERE vc.id = ANY(v_owned_code_ids)
          AND l.product_id = v_item."productId"
        ORDER BY l.manufacture_date ASC, vc.created_at ASC
        LIMIT v_quantity_to_select
      ) sub;

      IF v_product_code_ids IS NOT NULL AND array_length(v_product_code_ids, 1) > 0 THEN
        v_selected_code_ids := v_selected_code_ids || v_product_code_ids;
      END IF;
    END LOOP;

    IF array_length(v_selected_code_ids, 1) IS NULL OR array_length(v_selected_code_ids, 1) = 0 THEN
      RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'NO_MATCHING_CODES'::VARCHAR,
        '선택한 제품/수량에 해당하는 코드가 없습니다.'::VARCHAR;
      RETURN;
    END IF;
  END IF;

  INSERT INTO shipment_batches (
    from_organization_id, to_organization_id, to_organization_type,
    parent_batch_id, is_return_batch, is_recalled, recall_reason, recall_date
  ) VALUES (
    v_recipient_org_id, v_sender_org_id, v_sender_org_type,
    p_shipment_batch_id, TRUE, FALSE, NULL, NULL
  ) RETURNING id INTO v_new_batch_id;

  INSERT INTO shipment_details (shipment_batch_id, virtual_code_id)
  SELECT v_new_batch_id, UNNEST(v_selected_code_ids);

  -- v2: transfer owner_org_id
  UPDATE virtual_codes
  SET owner_org_id = v_sender_org_id,
      owner_patient_id = NULL,
      updated_at = NOW()
  WHERE id = ANY(v_selected_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO histories (
    virtual_code_id, action_type,
    from_org_id, to_org_id,
    shipment_batch_id, is_recall, recall_reason
  )
  SELECT
    UNNEST(v_selected_code_ids),
    'RETURNED'::action_type,
    v_recipient_org_id, v_sender_org_id,
    v_new_batch_id, TRUE, p_reason;

  -- Mark original batch as recalled if full return
  IF p_product_quantities IS NULL AND
     array_length(v_owned_code_ids, 1) = array_length(v_all_code_ids, 1) THEN
    UPDATE shipment_batches
    SET is_recalled = TRUE, recall_reason = p_reason, recall_date = NOW()
    WHERE id = p_shipment_batch_id AND is_recalled = FALSE;
  END IF;

  RETURN QUERY SELECT TRUE, v_count, v_new_batch_id, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, NULL::UUID, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

-- ============================================================================
-- process_recall (sender-initiated shipment recall, 24h limit)
-- Replaces recall_shipment_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_recall(
  p_shipment_batch_id UUID,
  p_reason VARCHAR
)
RETURNS TABLE(
  success BOOLEAN,
  recalled_count INTEGER,
  error_code VARCHAR,
  error_message VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_org_id UUID;
  v_batch RECORD;
  v_code_ids UUID[];
  v_count INT := 0;
BEGIN
  v_from_org_id := get_user_organization_id();

  IF v_from_org_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT * INTO v_batch FROM shipment_batches
  WHERE id = p_shipment_batch_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'BATCH_NOT_FOUND'::VARCHAR,
      '출고 뭉치를 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_batch.from_organization_id != v_from_org_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '발송자만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_batch.is_recalled THEN
    RETURN QUERY SELECT FALSE, 0, 'ALREADY_RECALLED'::VARCHAR,
      '이미 회수된 출고 뭉치입니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_batch.shipment_date) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR,
      '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(sd.virtual_code_id) INTO v_code_ids
  FROM shipment_details sd
  WHERE sd.shipment_batch_id = p_shipment_batch_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR,
      '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- v2: owner_org_id
  UPDATE virtual_codes
  SET owner_org_id = v_from_org_id,
      owner_patient_id = NULL
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO histories (
    virtual_code_id, action_type,
    from_org_id, to_org_id,
    shipment_batch_id, is_recall, recall_reason
  )
  SELECT
    UNNEST(v_code_ids),
    'SHIPPED'::action_type,
    v_batch.to_organization_id, v_from_org_id,
    p_shipment_batch_id, TRUE, p_reason;

  UPDATE shipment_batches
  SET is_recalled = TRUE, recall_reason = p_reason, recall_date = NOW()
  WHERE id = p_shipment_batch_id;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

-- ============================================================================
-- recall_treatment (hospital, 24h limit)
-- Replaces recall_treatment_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recall_treatment(
  p_treatment_id UUID,
  p_reason VARCHAR
)
RETURNS TABLE(
  success BOOLEAN,
  recalled_count INTEGER,
  error_code VARCHAR,
  error_message VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital_id UUID;
  v_treatment RECORD;
  v_code_ids UUID[];
  v_count INT := 0;
BEGIN
  v_hospital_id := get_user_organization_id();

  IF v_hospital_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '로그인이 필요합니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT * INTO v_treatment FROM treatment_records
  WHERE id = p_treatment_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'TREATMENT_NOT_FOUND'::VARCHAR,
      '시술 기록을 찾을 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF v_treatment.hospital_id != v_hospital_id THEN
    RETURN QUERY SELECT FALSE, 0, 'UNAUTHORIZED'::VARCHAR,
      '해당 병원에서만 회수할 수 있습니다.'::VARCHAR;
    RETURN;
  END IF;

  IF (NOW() - v_treatment.created_at) > INTERVAL '24 hours' THEN
    RETURN QUERY SELECT FALSE, 0, 'RECALL_TIME_EXCEEDED'::VARCHAR,
      '24시간 경과하여 처리할 수 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  SELECT ARRAY_AGG(td.virtual_code_id) INTO v_code_ids
  FROM treatment_details td
  WHERE td.treatment_id = p_treatment_id;

  IF v_code_ids IS NULL OR array_length(v_code_ids, 1) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'NO_DETAILS'::VARCHAR,
      '회수할 제품이 없습니다.'::VARCHAR;
    RETURN;
  END IF;

  -- v2: return to hospital org ownership
  UPDATE virtual_codes
  SET owner_org_id = v_hospital_id,
      owner_patient_id = NULL,
      status = 'IN_STOCK'
  WHERE id = ANY(v_code_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO histories (
    virtual_code_id, action_type,
    to_org_id, from_patient_id,
    treatment_id, is_recall, recall_reason
  )
  SELECT
    UNNEST(v_code_ids),
    'RECALL_TREATED'::action_type,
    v_hospital_id,
    v_treatment.patient_id,
    p_treatment_id, TRUE, p_reason;

  RETURN QUERY SELECT TRUE, v_count, NULL::VARCHAR, NULL::VARCHAR;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 'INTERNAL_ERROR'::VARCHAR, SQLERRM::VARCHAR;
END;
$$;

-- ============================================================================
-- Grant permissions to authenticated role
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_type() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_patient(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_quantity_to_lot(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_shipment(UUID, org_type, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_treatment(VARCHAR, DATE, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_disposal(DATE, disposal_reason, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_return(UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_recall(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recall_treatment(UUID, VARCHAR) TO authenticated;
