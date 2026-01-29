-- Neo-Certify v2 Initial Schema
-- Squashed from v1's 55 migrations into a clean start

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE org_type AS ENUM ('MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'ADMIN');
CREATE TYPE org_status AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE code_status AS ENUM ('IN_STOCK', 'USED', 'DISPOSED');
CREATE TYPE action_type AS ENUM (
  'MANUFACTURED', 'SHIPPED', 'RECEIVED', 'TREATED', 'DISPOSED',
  'RETURNED', 'RECALL_TREATED'
);
CREATE TYPE deactivation_reason_type AS ENUM ('DISCONTINUED', 'SAFETY_ISSUE', 'OTHER');
CREATE TYPE disposal_reason AS ENUM ('EXPIRED', 'DAMAGED', 'DEFECTIVE', 'OTHER');

-- ============================================================
-- TABLES
-- ============================================================

-- Organizations
CREATE TABLE organizations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  org_type NOT NULL,
  name                  VARCHAR NOT NULL,
  email                 VARCHAR NOT NULL UNIQUE,
  business_number       VARCHAR(10) NOT NULL UNIQUE,
  business_license_url  VARCHAR,
  representative_name   VARCHAR NOT NULL,
  representative_phone  VARCHAR NOT NULL,
  address               VARCHAR NOT NULL,
  status                org_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  auth_user_id          UUID UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id),
  name                VARCHAR NOT NULL,
  udi_di              VARCHAR NOT NULL,
  model_name          VARCHAR NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  deactivation_reason deactivation_reason_type,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, udi_di)
);

-- Lots
CREATE TABLE lots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id),
  lot_number       VARCHAR NOT NULL,
  quantity         INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100000),
  manufacture_date DATE NOT NULL,
  expiry_date      DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patients (★ v2: surrogate UUID PK instead of phone_number PK)
CREATE TABLE patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  VARCHAR NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Virtual Codes (★ v2: owner_id split into owner_org_id + owner_patient_id)
CREATE TABLE virtual_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR NOT NULL UNIQUE,
  lot_id           UUID NOT NULL REFERENCES lots(id),
  status           code_status NOT NULL DEFAULT 'IN_STOCK',
  owner_org_id     UUID REFERENCES organizations(id),
  owner_patient_id UUID REFERENCES patients(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (status IN ('IN_STOCK', 'DISPOSED') AND owner_org_id IS NOT NULL AND owner_patient_id IS NULL) OR
    (status = 'USED' AND owner_org_id IS NULL AND owner_patient_id IS NOT NULL)
  )
);

-- Shipment Batches
CREATE TABLE shipment_batches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_organization_id  UUID NOT NULL REFERENCES organizations(id),
  to_organization_id    UUID NOT NULL REFERENCES organizations(id),
  to_organization_type  org_type NOT NULL,
  shipment_date         TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_recalled           BOOLEAN NOT NULL DEFAULT false,
  recall_reason         VARCHAR,
  recall_date           TIMESTAMPTZ,
  is_return_batch       BOOLEAN NOT NULL DEFAULT false,
  parent_batch_id       UUID REFERENCES shipment_batches(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipment Details
CREATE TABLE shipment_details (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_batch_id UUID NOT NULL REFERENCES shipment_batches(id),
  virtual_code_id   UUID NOT NULL REFERENCES virtual_codes(id)
);

-- Treatment Records
CREATE TABLE treatment_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     UUID NOT NULL REFERENCES organizations(id),
  patient_phone   VARCHAR NOT NULL,
  treatment_date  DATE NOT NULL,
  is_recalled     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Treatment Details
CREATE TABLE treatment_details (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id    UUID NOT NULL REFERENCES treatment_records(id),
  virtual_code_id UUID NOT NULL REFERENCES virtual_codes(id)
);

-- Disposal Records
CREATE TABLE disposal_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id            UUID NOT NULL REFERENCES organizations(id),
  disposal_date          DATE NOT NULL,
  disposal_reason_type   disposal_reason NOT NULL,
  disposal_reason_custom VARCHAR,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disposal Details
CREATE TABLE disposal_details (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disposal_id     UUID NOT NULL REFERENCES disposal_records(id),
  virtual_code_id UUID NOT NULL REFERENCES virtual_codes(id)
);

-- Histories (★ v2: owner split into org/patient references)
CREATE TABLE histories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  virtual_code_id   UUID NOT NULL REFERENCES virtual_codes(id),
  action_type       action_type NOT NULL,
  from_org_id       UUID REFERENCES organizations(id),
  from_patient_id   UUID REFERENCES patients(id),
  to_org_id         UUID REFERENCES organizations(id),
  to_patient_id     UUID REFERENCES patients(id),
  shipment_batch_id UUID REFERENCES shipment_batches(id),
  disposal_id       UUID REFERENCES disposal_records(id),
  is_recall         BOOLEAN NOT NULL DEFAULT false,
  recall_reason     VARCHAR,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hospital Known Patients
CREATE TABLE hospital_known_patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES organizations(id),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, patient_id)
);

-- Hospital Known Products
CREATE TABLE hospital_known_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES organizations(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  alias       VARCHAR,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, product_id)
);

-- Manufacturer Settings
CREATE TABLE manufacturer_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  hmac_secret     VARCHAR NOT NULL,
  code_prefix     VARCHAR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification Messages
CREATE TABLE notification_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  patient_id      UUID REFERENCES patients(id),
  template_code   VARCHAR NOT NULL,
  phone           VARCHAR NOT NULL,
  variables       JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR NOT NULL DEFAULT 'PENDING',
  retry_count     INTEGER NOT NULL DEFAULT 0,
  aligo_mid       VARCHAR,
  error_msg       VARCHAR,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Alerts
CREATE TABLE organization_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  alert_type      VARCHAR NOT NULL,
  message         VARCHAR NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Virtual codes
CREATE INDEX idx_vc_owner_status ON virtual_codes(owner_org_id, status);
CREATE INDEX idx_vc_fifo ON virtual_codes(lot_id, created_at ASC) WHERE status = 'IN_STOCK';
CREATE INDEX idx_vc_patient ON virtual_codes(owner_patient_id) WHERE owner_patient_id IS NOT NULL;

-- Histories
CREATE INDEX idx_histories_created_at ON histories(created_at DESC);
CREATE INDEX idx_histories_from_org ON histories(from_org_id) WHERE from_org_id IS NOT NULL;
CREATE INDEX idx_histories_to_org ON histories(to_org_id) WHERE to_org_id IS NOT NULL;
CREATE INDEX idx_histories_cursor ON histories(created_at DESC, id DESC);

-- Shipment batches
CREATE INDEX idx_shipment_batches_recall ON shipment_batches(recall_date) WHERE is_recalled = true;
CREATE INDEX idx_shipment_batches_from ON shipment_batches(from_organization_id);
CREATE INDEX idx_shipment_batches_to ON shipment_batches(to_organization_id);

-- Treatment records
CREATE INDEX idx_treatment_records_hospital ON treatment_records(hospital_id);

-- ============================================================
-- MATERIALIZED VIEW
-- ============================================================

CREATE MATERIALIZED VIEW mv_org_code_counts AS
SELECT owner_org_id AS org_id, COUNT(*) AS code_count
FROM virtual_codes
WHERE status = 'IN_STOCK' AND owner_org_id IS NOT NULL
GROUP BY owner_org_id;

CREATE UNIQUE INDEX idx_mv_org_code_counts_org ON mv_org_code_counts(org_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM organizations WHERE auth_user_id = auth.uid();
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_records ENABLE ROW LEVEL SECURITY;

-- Organizations: users can view their own org
CREATE POLICY "org_view_own" ON organizations
  FOR SELECT USING (auth_user_id = auth.uid());

-- Virtual codes: org can view own codes
CREATE POLICY "org_view_own_codes" ON virtual_codes
  FOR SELECT USING (owner_org_id = get_user_organization_id());

-- Histories: org can view related histories
CREATE POLICY "org_view_own_histories" ON histories
  FOR SELECT USING (
    from_org_id = get_user_organization_id() OR
    to_org_id = get_user_organization_id()
  );

-- Products: org can view own products
CREATE POLICY "org_view_own_products" ON products
  FOR SELECT USING (organization_id = get_user_organization_id());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_virtual_codes_updated_at BEFORE UPDATE ON virtual_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_manufacturer_settings_updated_at BEFORE UPDATE ON manufacturer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
