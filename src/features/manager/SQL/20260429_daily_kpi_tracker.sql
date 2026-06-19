-- =====================================================
-- DAILY KPI TRACKER
-- Tracking KPI hàng ngày cho Headhunters
-- Chốt lúc 17:30 mỗi ngày
-- =====================================================

-- Drop existing objects
DROP TABLE IF EXISTS daily_kpi_snapshots CASCADE;
DROP FUNCTION IF EXISTS get_daily_kpi(UUID, DATE);
DROP FUNCTION IF EXISTS get_weekly_kpi_history(UUID, DATE);
DROP FUNCTION IF EXISTS upsert_daily_kpi(UUID, DATE, INT, INT, INT, INT, INT, INT, TEXT);

-- =====================================================
-- TABLE: daily_kpi_snapshots
-- =====================================================
CREATE TABLE daily_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  
  -- KPI metrics (actual numbers)
  approaches INT DEFAULT 0,
  cv_to_db INT DEFAULT 0,
  cv_to_client INT DEFAULT 0,
  setup_interview INT DEFAULT 0,
  actual_interview INT DEFAULT 0,
  offer INT DEFAULT 0,
  
  -- Daily targets (có thể customize)
  target_approaches INT DEFAULT 30,
  target_cv_db INT DEFAULT 5,
  target_cv_client INT DEFAULT 1,
  
  -- Note
  note TEXT,
  
  -- Finalization (chốt lúc 17:30)
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_kpi_user_date ON daily_kpi_snapshots(user_id, date DESC);
CREATE INDEX idx_daily_kpi_date ON daily_kpi_snapshots(date DESC);

-- RLS Policies
ALTER TABLE daily_kpi_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily KPI" ON daily_kpi_snapshots;
CREATE POLICY "Users can view own daily KPI" ON daily_kpi_snapshots
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_current_app_user_role() IN ('Admin', 'HH Lead')
  );

DROP POLICY IF EXISTS "Users can insert own daily KPI" ON daily_kpi_snapshots;
CREATE POLICY "Users can insert own daily KPI" ON daily_kpi_snapshots
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own daily KPI" ON daily_kpi_snapshots;
CREATE POLICY "Users can update own daily KPI" ON daily_kpi_snapshots
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTION: get_daily_kpi
-- Lấy KPI của 1 ngày cụ thể
-- =====================================================
CREATE OR REPLACE FUNCTION get_daily_kpi(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  date DATE,
  approaches INT,
  cv_to_db INT,
  cv_to_client INT,
  setup_interview INT,
  actual_interview INT,
  offer INT,
  target_approaches INT,
  target_cv_db INT,
  target_cv_client INT,
  note TEXT,
  is_finalized BOOLEAN,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dks.id,
    dks.user_id,
    dks.date,
    dks.approaches,
    dks.cv_to_db,
    dks.cv_to_client,
    dks.setup_interview,
    dks.actual_interview,
    dks.offer,
    dks.target_approaches,
    dks.target_cv_db,
    dks.target_cv_client,
    dks.note,
    dks.is_finalized,
    dks.finalized_at,
    dks.created_at,
    dks.updated_at
  FROM daily_kpi_snapshots dks
  WHERE dks.user_id = p_user_id
    AND dks.date = p_date;
END;
$$;

-- =====================================================
-- FUNCTION: get_weekly_kpi_history
-- Lấy lịch sử KPI các ngày trong tuần
-- =====================================================
CREATE OR REPLACE FUNCTION get_weekly_kpi_history(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  date DATE,
  day_of_week TEXT,
  approaches INT,
  cv_to_db INT,
  cv_to_client INT,
  setup_interview INT,
  actual_interview INT,
  offer INT,
  note TEXT,
  is_finalized BOOLEAN,
  is_today BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_end DATE;
BEGIN
  v_week_end := p_week_start + INTERVAL '7 days';
  
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      p_week_start,
      p_week_start + INTERVAL '6 days',
      INTERVAL '1 day'
    )::DATE AS date
  )
  SELECT 
    ds.date,
    CASE EXTRACT(DOW FROM ds.date)
      WHEN 0 THEN 'CN'
      WHEN 1 THEN 'T2'
      WHEN 2 THEN 'T3'
      WHEN 3 THEN 'T4'
      WHEN 4 THEN 'T5'
      WHEN 5 THEN 'T6'
      WHEN 6 THEN 'T7'
    END || ' ' || TO_CHAR(ds.date, 'DD/MM') AS day_of_week,
    COALESCE(dks.approaches, 0) AS approaches,
    COALESCE(dks.cv_to_db, 0) AS cv_to_db,
    COALESCE(dks.cv_to_client, 0) AS cv_to_client,
    COALESCE(dks.setup_interview, 0) AS setup_interview,
    COALESCE(dks.actual_interview, 0) AS actual_interview,
    COALESCE(dks.offer, 0) AS offer,
    COALESCE(dks.note, '—') AS note,
    COALESCE(dks.is_finalized, FALSE) AS is_finalized,
    (ds.date = CURRENT_DATE) AS is_today
  FROM date_series ds
  LEFT JOIN daily_kpi_snapshots dks 
    ON dks.user_id = p_user_id 
    AND dks.date = ds.date
  ORDER BY ds.date;
END;
$$;

-- =====================================================
-- FUNCTION: upsert_daily_kpi
-- Tạo hoặc update KPI hàng ngày
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_daily_kpi(
  p_user_id UUID,
  p_date DATE,
  p_approaches INT,
  p_cv_to_db INT,
  p_cv_to_client INT,
  p_setup_interview INT,
  p_actual_interview INT,
  p_offer INT,
  p_note TEXT DEFAULT NULL
)
RETURNS daily_kpi_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result daily_kpi_snapshots;
BEGIN
  -- Upsert
  INSERT INTO daily_kpi_snapshots (
    user_id,
    date,
    approaches,
    cv_to_db,
    cv_to_client,
    setup_interview,
    actual_interview,
    offer,
    note,
    updated_at
  ) VALUES (
    p_user_id,
    p_date,
    p_approaches,
    p_cv_to_db,
    p_cv_to_client,
    p_setup_interview,
    p_actual_interview,
    p_offer,
    p_note,
    NOW()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    approaches = EXCLUDED.approaches,
    cv_to_db = EXCLUDED.cv_to_db,
    cv_to_client = EXCLUDED.cv_to_client,
    setup_interview = EXCLUDED.setup_interview,
    actual_interview = EXCLUDED.actual_interview,
    offer = EXCLUDED.offer,
    note = EXCLUDED.note,
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-finalize at 17:30
-- Tự động chốt KPI lúc 17:30
-- =====================================================
CREATE OR REPLACE FUNCTION auto_finalize_daily_kpi()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Nếu đã qua 17:30 và chưa finalize → tự động finalize
  IF EXTRACT(HOUR FROM NOW()) >= 17 
     AND EXTRACT(MINUTE FROM NOW()) >= 30 
     AND NEW.is_finalized = FALSE 
     AND NEW.date < CURRENT_DATE THEN
    NEW.is_finalized := TRUE;
    NEW.finalized_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_finalize_daily_kpi ON daily_kpi_snapshots;
CREATE TRIGGER trigger_auto_finalize_daily_kpi
  BEFORE INSERT OR UPDATE ON daily_kpi_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION auto_finalize_daily_kpi();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON daily_kpi_snapshots TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_kpi TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_kpi_history TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_daily_kpi TO authenticated;

-- =====================================================
-- TEST DATA (Optional)
-- =====================================================
-- Uncomment để test
/*
INSERT INTO daily_kpi_snapshots (user_id, date, approaches, cv_to_db, cv_to_client, setup_interview, actual_interview, offer, note)
VALUES 
  ('16532cb5-0bf0-4974-857e-d86788f4466a', '2026-04-28', 15, 2, 0, 1, 0, 0, NULL),
  ('16532cb5-0bf0-4974-857e-d86788f4466a', '2026-04-29', 18, 3, 1, 1, 1, 1, 'Offer Đinh Trung Hiếu - Pixon');
*/
