-- =============================================
-- Fix Audit Log "System/Unknown" Issue
-- Strategy: Use RPC to set context before UPDATE
-- =============================================

-- 1. Update Trigger to check custom session variable
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_user_id uuid;
  v_target_user_id uuid;
  v_record_id uuid;
  v_actor_name text;
  v_actor_email text;
  v_target_user_name text;
  v_target_user_email text;
  v_target_summary text;
  action_type text;
  old_data jsonb;
  new_data jsonb;
  details jsonb;
  v_job_id uuid;
  v_candidate_id uuid;
BEGIN
  -- ENTIRE AUDIT LOGIC WRAPPED IN EXCEPTION TO NEVER BLOCK MAIN OPERATION
  BEGIN
    -- Get Actor ID: Priority order:
    -- 1. auth.uid() (normal authenticated requests)
    -- 2. app.current_user_id (custom session var set by RPC)
    v_actor_user_id := auth.uid();
    
    IF v_actor_user_id IS NULL THEN
      BEGIN
        v_actor_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
      EXCEPTION WHEN OTHERS THEN
        v_actor_user_id := NULL;
      END;
    END IF;
    
    -- Snapshot Actor Info
    IF v_actor_user_id IS NOT NULL THEN
      SELECT full_name, email INTO v_actor_name, v_actor_email
      FROM public.profiles WHERE id = v_actor_user_id;
    ELSE
      v_actor_name := 'System/Unknown';
      v_actor_email := NULL;
    END IF;

    -- Determine action & data
    action_type := TG_OP;
    IF TG_OP = 'INSERT' THEN
      old_data := NULL;
      new_data := to_jsonb(NEW);
      v_record_id := NEW.id;
    ELSIF TG_OP = 'UPDATE' THEN
      old_data := to_jsonb(OLD);
      new_data := to_jsonb(NEW);
      v_record_id := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
      old_data := to_jsonb(OLD);
      new_data := NULL;
      v_record_id := OLD.id;
    END IF;

    -- Identify Target User (Owner)
    v_target_user_id := NULL;
    IF TG_OP <> 'DELETE' THEN
      IF TG_TABLE_NAME IN ('jobs','candidates','processes','clients') AND to_jsonb(NEW) ? 'owner_id' THEN
         v_target_user_id := (to_jsonb(NEW)->>'owner_id')::uuid;
      ELSIF TG_TABLE_NAME = 'sales' AND to_jsonb(NEW) ? 'handled_by_id' THEN
         v_target_user_id := (to_jsonb(NEW)->>'handled_by_id')::uuid;
      ELSIF TG_TABLE_NAME = 'users' THEN
         IF to_jsonb(NEW) ? 'auth_user_id' THEN 
           v_target_user_id := (to_jsonb(NEW)->>'auth_user_id')::uuid;
         ELSE 
           v_target_user_id := NEW.id; 
         END IF;
      ELSIF TG_TABLE_NAME = 'profiles' THEN
         v_target_user_id := NEW.id;
      END IF;
    ELSE
      IF TG_TABLE_NAME IN ('jobs','candidates','processes','clients') AND to_jsonb(OLD) ? 'owner_id' THEN
         v_target_user_id := (to_jsonb(OLD)->>'owner_id')::uuid;
      ELSIF TG_TABLE_NAME = 'sales' AND to_jsonb(OLD) ? 'handled_by_id' THEN
         v_target_user_id := (to_jsonb(OLD)->>'handled_by_id')::uuid;
      ELSIF TG_TABLE_NAME = 'users' OR TG_TABLE_NAME = 'profiles' THEN
         v_target_user_id := OLD.id;
      END IF;
    END IF;

    -- Snapshot Target User Info
    IF v_target_user_id IS NOT NULL THEN
      SELECT full_name, email INTO v_target_user_name, v_target_user_email
      FROM public.profiles WHERE id = v_target_user_id;
      
      IF v_target_user_name IS NULL AND TG_TABLE_NAME = 'profiles' THEN
         v_target_user_name := COALESCE((to_jsonb(new_data)->>'full_name'), (to_jsonb(old_data)->>'full_name'));
         v_target_user_email := COALESCE((to_jsonb(new_data)->>'email'), (to_jsonb(old_data)->>'email'));
      END IF;
    END IF;
    
    -- Snapshot Target Object Summary
    v_target_summary := NULL;
    IF TG_TABLE_NAME = 'jobs' THEN
       v_target_summary := COALESCE((to_jsonb(new_data)->>'position_title'), (to_jsonb(old_data)->>'position_title'));
    ELSIF TG_TABLE_NAME = 'candidates' THEN
       v_target_summary := COALESCE((to_jsonb(new_data)->>'name'), (to_jsonb(old_data)->>'name'));
    ELSIF TG_TABLE_NAME = 'clients' THEN
       v_target_summary := COALESCE((to_jsonb(new_data)->>'client_name'), (to_jsonb(old_data)->>'client_name'));
    ELSIF TG_TABLE_NAME = 'processes' THEN
       IF new_data IS NOT NULL THEN
         v_job_id := (new_data->>'job_id')::uuid; 
         v_candidate_id := (new_data->>'candidate_id')::uuid;
       ELSE
         v_job_id := (old_data->>'job_id')::uuid; 
         v_candidate_id := (old_data->>'candidate_id')::uuid;
       END IF;
       SELECT 
         (SELECT name FROM public.candidates WHERE id = v_candidate_id) || ' - ' || 
         (SELECT position_title FROM public.jobs WHERE id = v_job_id)
       INTO v_target_summary;
    ELSIF TG_TABLE_NAME = 'sales' THEN
       IF new_data IS NOT NULL THEN
         v_job_id := (new_data->>'job_id')::uuid; 
         v_candidate_id := (new_data->>'candidate_id')::uuid;
       ELSE
         v_job_id := (old_data->>'job_id')::uuid; 
         v_candidate_id := (old_data->>'candidate_id')::uuid;
       END IF;
       SELECT 
         'Sale: ' || (SELECT name FROM public.candidates WHERE id = v_candidate_id) || ' - ' || 
         (SELECT position_title FROM public.jobs WHERE id = v_job_id)
       INTO v_target_summary;
    ELSIF TG_TABLE_NAME = 'users' OR TG_TABLE_NAME = 'profiles' THEN
       v_target_summary := v_target_user_name;
    END IF;

    -- Build details
    details := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'record_id', v_record_id,
      'old_data', old_data,
      'new_data', new_data
    );

    -- Insert audit log
    INSERT INTO public.audit_logs (
      action,
      actor_user_id,
      target_user_id,
      target_table,
      target_record_id,
      details,
      created_at,
      actor_name,
      actor_email,
      target_user_name,
      target_user_email,
      target_summary
    )
    VALUES (
      action_type || ' ' || TG_TABLE_NAME,
      v_actor_user_id,
      v_target_user_id,
      TG_TABLE_NAME,
      v_record_id,
      details,
      now(),
      v_actor_name,
      v_actor_email,
      v_target_user_name,
      v_target_user_email,
      v_target_summary
    );

  EXCEPTION WHEN OTHERS THEN
    -- Audit log failed, but we NEVER block the main operation
    RAISE NOTICE 'Audit log failed silently: %', SQLERRM;
  END;

  -- ALWAYS return to allow the main operation to proceed
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create RPC for Admin User Activation
CREATE OR REPLACE FUNCTION public.admin_activate_user_rpc(
  p_target_user_id uuid, 
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Set session variable for audit trigger
  PERFORM set_config('app.current_user_id', p_actor_user_id::text, true);

  -- 1. Activate user
  UPDATE public.users 
  SET 
    is_active = true,
    status = 'approved',
    updated_at = now()
  WHERE id = p_target_user_id;

  -- 2. Clear ban tracking
  UPDATE public.user_logout_tracking
  SET status = 'completed'
  WHERE user_id = p_target_user_id AND status = 'banned';

  -- 3. Return success
  v_result := jsonb_build_object(
    'success', true,
    'activated_at', now()
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_activate_user_rpc TO service_role;
