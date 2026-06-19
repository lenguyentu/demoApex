-- =====================================================
-- DAILY KPI FROM PROCESSES
-- Tự động tính KPI hàng ngày từ processes table
-- Chỉ cần nhập Approaches, còn lại tự động
-- =====================================================

-- Drop existing
DROP FUNCTION IF EXISTS get_daily_kpi_from_processes(UUID, DATE);
DROP TABLE IF EXISTS daily_approaches CASCADE;

-- =====================================================
-- TABLE: daily_approaches
-- Chỉ lưu số Approaches (manual input)
-- =====================================================
CREATE TABLE daily_approaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  approaches INT DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_approaches_user_date ON daily_approaches(user_id, date DESC);

-- RLS
ALTER TABLE daily_approaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own approaches" ON daily_approaches;
CREATE POLICY "Users can view own approaches" ON daily_approaches
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_current_app_user_role() IN ('Admin', 'HH Lead')
  );

DROP POLICY IF EXISTS "Users can insert own approaches" ON daily_approaches;
CREATE POLICY "Users can insert own approaches" ON daily_approaches
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own approaches" ON daily_approaches;
CREATE POLICY "Users can update own approaches" ON daily_approaches
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTION: get_daily_kpi_from_processes
-- Tính KPI hàng ngày từ processes + approaches
-- =====================================================
CREATE OR REPLACE FUNCTION get_daily_kpi_from_processes(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  date DATE,
  approaches INT,
  cv_to_db INT,
  cv_to_client INT,
  setup_interview INT,
  actual_interview INT,
  offer INT,
  placement INT,
  note TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_start TIMESTAMPTZ;
  v_date_end TIMESTAMPTZ;
BEGIN
  -- Ngày KPI theo dương lịch: 00:00 hôm nay -> 00:00 hôm sau (giờ VN, UTC+7)
  v_date_start := (p_date || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_date_end := ((p_date + INTERVAL '1 day')::DATE || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh';
  
  RETURN QUERY
  WITH process_activities AS (
    -- Hiện tại (nếu update hôm nay)
    SELECT 
      id AS process_id, 
      process_status::text AS status, 
      updated_at AS activity_time
    FROM processes
    WHERE owner_id = p_user_id
      AND updated_at >= v_date_start 
      AND updated_at < v_date_end
    
    UNION ALL
    
    -- Lịch sử (các bước đã qua trong ngày, giải quyết case 1 ứng viên qua nhiều vòng 1 ngày)
    SELECT 
      ph.process_id, 
      ph.status::text, 
      ph.created_at AS activity_time
    FROM process_history ph
    JOIN processes p ON p.id = ph.process_id
    WHERE p.owner_id = p_user_id
      AND ph.created_at >= v_date_start 
      AND ph.created_at < v_date_end
  ),
  daily_stats AS (
    SELECT
      -- CV to DB: COUNT candidates được tạo trong ngày
      (
        SELECT COUNT(*)
        FROM candidates
        WHERE created_by_id = p_user_id
          AND created_at >= v_date_start 
          AND created_at < v_date_end
      ) AS cv_to_db,
      
      -- CV to Client: processes updated trong ngày với stage CV_SUBMITTED_TO_CLIENT
      COUNT(DISTINCT process_id) FILTER (
        WHERE status = 'CV_SUBMITTED_TO_CLIENT'
      ) AS cv_to_client,
      
      -- Set up Interview: SCHEDULED stages
      COUNT(DISTINCT process_id) FILTER (
        WHERE status IN (
          'INTERVIEW_SCHEDULED_1ST',
          'INTERVIEW_SCHEDULED_2ND',
          'INTERVIEW_SCHEDULED_FINAL',
          'INTERVIEW_SCHEDULED_4TH'
        )
      ) AS setup_interview,
      
      -- Actual Interview: COMPLETED stages
      COUNT(DISTINCT process_id) FILTER (
        WHERE status IN (
          'INTERVIEW_COMPLETED_1ST',
          'INTERVIEW_COMPLETED_2ND',
          'INTERVIEW_COMPLETED_FINAL',
          'INTERVIEW_COMPLETED_4TH'
        )
      ) AS actual_interview,
      
      -- Offer: OFFER stages
      COUNT(DISTINCT process_id) FILTER (
        WHERE status IN (
          'OFFER_EXTENDED',
          'OFFER_ACCEPTED_BY_CANDIDATE'
        )
      ) AS offer,
      
      -- Placement: ONBOARDING stage
      COUNT(DISTINCT process_id) FILTER (
        WHERE status = 'ONBOARDING'
      ) AS placement
    FROM process_activities
  )
  SELECT 
    p_date AS date,
    COALESCE(da.approaches, 0)::INT AS approaches,
    ds.cv_to_db::INT,
    ds.cv_to_client::INT,
    ds.setup_interview::INT,
    ds.actual_interview::INT,
    ds.offer::INT,
    ds.placement::INT,
    da.note
  FROM daily_stats ds
  LEFT JOIN daily_approaches da 
    ON da.user_id = p_user_id 
    AND da.date = p_date;
END;
$$;

-- =====================================================
-- FUNCTION: get_weekly_kpi_from_processes
-- Lấy KPI 7 ngày trong tuần
-- =====================================================
CREATE OR REPLACE FUNCTION get_weekly_kpi_from_processes(
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
  placement INT,
  note TEXT,
  is_today BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now_vn TIMESTAMP;
  v_today_vn DATE;
BEGIN
  v_now_vn := NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_today_vn := v_now_vn::DATE;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      p_week_start,
      p_week_start + INTERVAL '6 days',
      INTERVAL '1 day'
    )::DATE AS date
  ),
  daily_kpis AS (
    SELECT 
      ds.date AS kpi_date,
      kpi.date,
      kpi.approaches,
      kpi.cv_to_db,
      kpi.cv_to_client,
      kpi.setup_interview,
      kpi.actual_interview,
      kpi.offer,
      kpi.placement,
      kpi.note
    FROM date_series ds
    CROSS JOIN LATERAL get_daily_kpi_from_processes(p_user_id, ds.date) kpi
  )
  SELECT 
    dk.date,
    CASE EXTRACT(DOW FROM dk.date)
      WHEN 0 THEN 'CN'
      WHEN 1 THEN 'T2'
      WHEN 2 THEN 'T3'
      WHEN 3 THEN 'T4'
      WHEN 4 THEN 'T5'
      WHEN 5 THEN 'T6'
      WHEN 6 THEN 'T7'
    END || ' ' || TO_CHAR(dk.date, 'DD/MM') AS day_of_week,
    dk.approaches,
    dk.cv_to_db,
    dk.cv_to_client,
    dk.setup_interview,
    dk.actual_interview,
    dk.offer,
    dk.placement,
    dk.note,
    (dk.date = v_today_vn) AS is_today
  FROM daily_kpis dk
  ORDER BY dk.date;
END;
$$;

-- =====================================================
-- FUNCTION: upsert_daily_approaches
-- Lưu số Approaches hàng ngày
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_daily_approaches(
  p_user_id UUID,
  p_date DATE,
  p_approaches INT,
  p_note TEXT DEFAULT NULL
)
RETURNS daily_approaches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result daily_approaches;
BEGIN
  -- Đã bỏ ràng buộc business day 17:30 để mọi người nhập thoải mái
  INSERT INTO daily_approaches (
    user_id,
    date,
    approaches,
    note,
    updated_at
  ) VALUES (
    p_user_id,
    p_date,
    p_approaches,
    p_note,
    NOW()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    approaches = EXCLUDED.approaches,
    note = EXCLUDED.note,
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON daily_approaches TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_kpi_from_processes TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_kpi_from_processes TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_daily_approaches TO authenticated;

-- =====================================================
-- TEST
-- =====================================================
-- Test với user ID thật
/*
SELECT * FROM get_daily_kpi_from_processes('16532cb5-0bf0-4974-857e-d86788f4466a', '2026-04-29');
SELECT * FROM get_weekly_kpi_from_processes('16532cb5-0bf0-4974-857e-d86788f4466a', '2026-04-28');
*/
