-- ============================================================
-- Job Focus Assignments
-- Cho phép HH Lead / Admin giao job cho HH theo tuần
-- week_start luôn là Thứ Bảy 00:00 theo giờ Việt Nam
-- ============================================================

-- 1. Tạo bảng
CREATE TABLE IF NOT EXISTS public.job_focus_assignments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  assignee_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by  uuid        NOT NULL REFERENCES public.users(id),
  week_start   date        NOT NULL,  -- Saturday của tuần, e.g. 2026-04-25
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  -- Tránh duplicate: cùng 1 job + cùng 1 HH + cùng 1 tuần = chỉ 1 assignment
  -- (1 HH vẫn có thể được giao nhiều jobs trong tuần)
  CONSTRAINT uq_job_assignee_week UNIQUE (job_id, assignee_id, week_start)
);

-- Index để query nhanh theo tuần và assignee
CREATE INDEX IF NOT EXISTS idx_jfa_assignee_week
  ON public.job_focus_assignments (assignee_id, week_start);

CREATE INDEX IF NOT EXISTS idx_jfa_job_week
  ON public.job_focus_assignments (job_id, week_start);

-- Index để HH Lead query toàn team (join qua users.managed_by_id)
CREATE INDEX IF NOT EXISTS idx_jfa_assigned_by
  ON public.job_focus_assignments (assigned_by, week_start);

-- 2. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_jfa_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jfa_updated_at ON public.job_focus_assignments;
CREATE TRIGGER trg_jfa_updated_at
  BEFORE UPDATE ON public.job_focus_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_jfa_updated_at();

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.job_focus_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "jfa_select" ON public.job_focus_assignments;
DROP POLICY IF EXISTS "jfa_insert" ON public.job_focus_assignments;
DROP POLICY IF EXISTS "jfa_update" ON public.job_focus_assignments;
DROP POLICY IF EXISTS "jfa_delete" ON public.job_focus_assignments;

-- Helper: lấy role của user hiện tại
-- (giả sử app dùng auth.uid() và join public.users)

-- SELECT: HH thấy assignments của mình
--         HH Lead thấy assignments của cả team (managed_by_id = auth.uid())
--         Admin thấy tất cả
CREATE POLICY "jfa_select" ON public.job_focus_assignments
  FOR SELECT USING (
    -- Chính mình
    assignee_id = auth.uid()
    OR
    -- HH Lead: assignee thuộc team mình
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = assignee_id
        AND u.managed_by_id = auth.uid()
    )
    OR
    -- Admin
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'Admin'
    )
  );

-- INSERT: HH Lead chỉ giao cho team mình, Admin giao tất cả
CREATE POLICY "jfa_insert" ON public.job_focus_assignments
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid()
    AND (
      -- Admin
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role = 'Admin'
      )
      OR
      -- HH Lead: assignee là chính mình HOẶC thuộc team mình
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = assignee_id
          AND (u.id = auth.uid() OR u.managed_by_id = auth.uid())
      )
    )
  );

-- UPDATE: chỉ người giao mới sửa được, hoặc Admin
CREATE POLICY "jfa_update" ON public.job_focus_assignments
  FOR UPDATE USING (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'Admin'
    )
  );

-- DELETE: tương tự UPDATE
CREATE POLICY "jfa_delete" ON public.job_focus_assignments
  FOR DELETE USING (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'Admin'
    )
  );

-- ============================================================
-- 4. Helper function: lấy Thứ Bảy của tuần chứa ngày bất kỳ (UTC+7)
-- Dùng ở frontend: SELECT get_week_start('2026-04-21') → 2026-04-18
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_week_start(d date DEFAULT CURRENT_DATE)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  -- PostgreSQL EXTRACT(DOW): Sunday=0 ... Saturday=6
  -- Công thức dịch lùi về Saturday gần nhất (hoặc chính nó nếu đã là Saturday)
  SELECT (d - (((EXTRACT(DOW FROM d)::int + 1) % 7) * INTERVAL '1 day'))::date;
$$;

-- ============================================================
-- 5. View tiện lợi: job_focus_with_details
-- Join sẵn job info + assignee info để frontend query 1 lần
-- ============================================================
DROP VIEW IF EXISTS public.job_focus_with_details;

CREATE VIEW public.job_focus_with_details AS
SELECT
  jfa.id,
  jfa.week_start,
  jfa.note,
  jfa.created_at,

  -- Plan fields (kế hoạch tuần sau)
  jfa.plan_cv_count,
  jfa.plan_deadline,
  jfa.plan_priority_percent,
  jfa.plan_note,

  -- Job info
  j.id            AS job_id,
  j.job_id        AS job_code,  -- Thêm mã TDC00X
  j.position_title,
  j.phase,
  j.phase_date,
  j.headhunt_fee,
  j.ctv_fee,
  j.freelance_fee,
  j.td_job_category,
  j.work_location,
  j.number_of_employees,  -- Thêm số lượng tuyển
  j.interview_rounds,     -- Thêm số vòng PV
  j.warranty_period_days, -- Thêm bảo hành
  j.min_monthly_salary,   -- Thêm lương
  j.max_monthly_salary,

  -- Client info
  c.id            AS client_id,
  c.client_name,
  c.client_rank,

  -- Assignee (HH)
  ua.id           AS assignee_id,
  ua.full_name    AS assignee_name,
  ua.role         AS assignee_role,

  -- Assigned by (HH Lead / Admin)
  ub.id           AS assigned_by_id,
  ub.full_name    AS assigned_by_name

FROM public.job_focus_assignments jfa
JOIN public.jobs     j  ON j.id  = jfa.job_id
LEFT JOIN public.clients c  ON c.id  = j.client_id
JOIN public.users    ua ON ua.id = jfa.assignee_id
JOIN public.users    ub ON ub.id = jfa.assigned_by;
