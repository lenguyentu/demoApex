-- Fix RLS: HH Lead có thể update processes của mình
-- Bao gồm cả processes do Researcher tạo (owner_id = HH Lead)
--
-- Policy hiện tại đã đúng: owner_id = auth.uid()
-- Nhưng cần verify HH Lead đang là owner của process đó
--
-- Chạy query này để kiểm tra:
-- SELECT owner_id, created_by_id FROM processes WHERE id = '<process_id>';
-- SELECT id FROM users WHERE full_name ILIKE '%Tú%';
-- → Nếu owner_id = id của Tú thì policy đã đúng, vấn đề là enum casting

-- Test update trực tiếp (không qua RLS):
-- UPDATE processes SET process_status = 'ONBOARDING' WHERE id = '<process_id>';
-- Nếu chạy được → vấn đề là RLS
-- Nếu không → vấn đề là enum

-- Thêm policy cho HH Lead update processes của team (assigned_hr_id)
DROP POLICY IF EXISTS "RLS: HH Lead can update team processes" ON public.processes;

CREATE POLICY "RLS: HH Lead can update team processes"
  ON public.processes
  FOR UPDATE
  TO authenticated
  USING (
    get_current_app_user_role() = 'HH Lead'::user_role_enum
    AND (
      -- Processes của chính mình
      auth.uid() = owner_id
      OR
      -- Processes của HH trong team (assigned_hr_id = HH Lead)
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = owner_id
          AND u.assigned_hr_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    get_current_app_user_role() = 'HH Lead'::user_role_enum
    AND (
      auth.uid() = owner_id
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = owner_id
          AND u.assigned_hr_id = auth.uid()
      )
    )
  );
