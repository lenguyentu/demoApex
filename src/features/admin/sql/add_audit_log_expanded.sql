
DO $$
BEGIN
  -- 1. Rename user_id -> actor_user_id if exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
    ALTER TABLE public.audit_logs RENAME COLUMN user_id TO actor_user_id;
  END IF;

  -- 2. Add structural columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'target_table') THEN
     ALTER TABLE public.audit_logs ADD COLUMN target_table text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'target_record_id') THEN
     ALTER TABLE public.audit_logs ADD COLUMN target_record_id uuid;
  END IF;

  -- 3. Add SNAPSHOT Columns
  -- Actor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_name') THEN
     ALTER TABLE public.audit_logs ADD COLUMN actor_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_email') THEN
     ALTER TABLE public.audit_logs ADD COLUMN actor_email text;
  END IF;
  
  -- Target User (Owner/Person)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'target_user_name') THEN
     ALTER TABLE public.audit_logs ADD COLUMN target_user_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'target_user_email') THEN
     ALTER TABLE public.audit_logs ADD COLUMN target_user_email text;
  END IF;

  -- NEW: Target Object Summary (e.g. "Backend Dev", "Nguyen Van A")
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'target_summary') THEN
     ALTER TABLE public.audit_logs ADD COLUMN target_summary text;
  END IF;

  -- 4. Safe Data Migration
  UPDATE public.audit_logs 
  SET target_table = 'unknown' 
  WHERE target_table IS NULL;
  
  UPDATE public.audit_logs 
  SET target_table = split_part(action, ' ', 2) 
  WHERE target_table = 'unknown' AND action LIKE '% %';

  ALTER TABLE public.audit_logs ALTER COLUMN target_table SET DEFAULT 'unknown';

  
  -- 5. REMOVE ALL FOREIGN KEYS (Total Decoupling)
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_user_id_fkey_profiles') THEN
    ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_user_id_fkey_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_actor_user_id_fkey_profiles') THEN
    ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_actor_user_id_fkey_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_target_user_id_fkey_profiles') THEN
    ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_target_user_id_fkey_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_actor_user_id_fkey') THEN
      ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_actor_user_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_target_user_id_fkey') THEN
      ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_target_user_id_fkey;
  END IF;

END $$;


-- CREATE OR REPLACE AUDIT LOG FUNCTION (SNAPSHOT LOGIC + OBJECT SUMMARY)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  -- IDs
  v_actor_user_id uuid;
  v_target_user_id uuid;
  v_record_id uuid;
  
  -- Snapshot Data
  v_actor_name text;
  v_actor_email text;
  v_target_user_name text;
  v_target_user_email text;
  v_target_summary text; -- Object Name (Job Title, Candidate Name etc)
  
  action_type text;
  old_data jsonb;
  new_data jsonb;
  details jsonb;
  
  -- Temps
  v_job_id uuid;
  v_candidate_id uuid;
BEGIN
  -- 1. Identify Actor
  v_actor_user_id := auth.uid(); 
  
  -- 1b. Snapshot Actor Info
  IF v_actor_user_id IS NOT NULL THEN
    SELECT full_name, email INTO v_actor_name, v_actor_email
    FROM public.profiles WHERE id = v_actor_user_id;
  ELSE
    v_actor_name := 'System/Unknown';
    v_actor_email := NULL;
  END IF;


  -- 2. Action & Data
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

  -- 3. Identify Target User (Owner) - KEEPING THIS for filtering by Owner
  v_target_user_id := NULL;

  IF TG_OP <> 'DELETE' THEN
    IF TG_TABLE_NAME IN ('jobs','candidates','processes','clients') AND to_jsonb(NEW) ? 'owner_id' THEN
       v_target_user_id := (to_jsonb(NEW)->>'owner_id')::uuid;
    ELSIF TG_TABLE_NAME = 'sales' AND to_jsonb(NEW) ? 'handled_by_id' THEN
       v_target_user_id := (to_jsonb(NEW)->>'handled_by_id')::uuid;
    ELSIF TG_TABLE_NAME = 'users' THEN
       IF to_jsonb(NEW) ? 'auth_user_id' THEN v_target_user_id := (to_jsonb(NEW)->>'auth_user_id')::uuid;
       ELSE v_target_user_id := NEW.id; END IF;
    ELSIF TG_TABLE_NAME = 'profiles' THEN
       v_target_user_id := NEW.id;
    END IF;
  ELSE
    -- DELETE
    IF TG_TABLE_NAME IN ('jobs','candidates','processes','clients') AND to_jsonb(OLD) ? 'owner_id' THEN
       v_target_user_id := (to_jsonb(OLD)->>'owner_id')::uuid;
    ELSIF TG_TABLE_NAME = 'sales' AND to_jsonb(OLD) ? 'handled_by_id' THEN
       v_target_user_id := (to_jsonb(OLD)->>'handled_by_id')::uuid;
    ELSIF TG_TABLE_NAME = 'users' OR TG_TABLE_NAME = 'profiles' THEN
       v_target_user_id := OLD.id; -- Safe now (No FK)
    END IF;
  END IF;

  -- 3b. Snapshot Target User Info
  IF v_target_user_id IS NOT NULL THEN
    SELECT full_name, email INTO v_target_user_name, v_target_user_email
    FROM public.profiles WHERE id = v_target_user_id;
    
    -- Fallback from record data if not found in profiles (for deletes)
    IF v_target_user_name IS NULL AND TG_TABLE_NAME = 'profiles' THEN
       v_target_user_name := COALESCE((to_jsonb(new_data)->>'full_name'), (to_jsonb(old_data)->>'full_name'));
       v_target_user_email := COALESCE((to_jsonb(new_data)->>'email'), (to_jsonb(old_data)->>'email'));
    END IF;
  END IF;
  
  
  -- 4. NEW: Snapshot Target OBJECT SUMMARY (Readable Title based on Table)
  v_target_summary := NULL;
  
  IF TG_TABLE_NAME = 'jobs' THEN
     -- Use position_title (preferred) or title
     v_target_summary := COALESCE((to_jsonb(new_data)->>'position_title'), (to_jsonb(old_data)->>'position_title'));
     
  ELSIF TG_TABLE_NAME = 'candidates' THEN
     v_target_summary := COALESCE((to_jsonb(new_data)->>'name'), (to_jsonb(old_data)->>'name'));
     
  ELSIF TG_TABLE_NAME = 'clients' THEN
     v_target_summary := COALESCE((to_jsonb(new_data)->>'client_name'), (to_jsonb(old_data)->>'client_name'));
     
  ELSIF TG_TABLE_NAME = 'processes' THEN
     -- Need to fetch relative names. 
     -- Use NEW data if available, else OLD
     IF new_data IS NOT NULL THEN
       v_job_id := (new_data->>'job_id')::uuid; 
       v_candidate_id := (new_data->>'candidate_id')::uuid;
     ELSE
       v_job_id := (old_data->>'job_id')::uuid; 
       v_candidate_id := (old_data->>'candidate_id')::uuid;
     END IF;
     
     -- Direct Selects to get names. 
     -- Using sub-selects to handle potential deletions gracefully
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
     v_target_summary := v_target_user_name; -- Use the person's name
  END IF;


  -- 5. Details JSON
  details := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'record_id', v_record_id,
    'old_data', old_data,
    'new_data', new_data
  );

  -- 6. Insert audit
  BEGIN
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
      target_summary   -- Store the readable summary
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
    RAISE NOTICE 'Audit log failed: %', SQLERRM;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- TRIGGERS (Re-apply)

-- JOBS
DROP TRIGGER IF EXISTS trg_audit_jobs ON public.jobs;
CREATE TRIGGER trg_audit_jobs AFTER INSERT OR UPDATE OR DELETE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- CANDIDATES
DROP TRIGGER IF EXISTS trg_audit_candidates ON public.candidates;
CREATE TRIGGER trg_audit_candidates AFTER INSERT OR UPDATE OR DELETE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- PROCESSES
DROP TRIGGER IF EXISTS trg_audit_processes ON public.processes;
CREATE TRIGGER trg_audit_processes AFTER INSERT OR UPDATE OR DELETE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- CLIENTS
DROP TRIGGER IF EXISTS trg_audit_clients ON public.clients;
CREATE TRIGGER trg_audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- SALES
DROP TRIGGER IF EXISTS trg_audit_sales ON public.sales;
CREATE TRIGGER trg_audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- PROFILES
DROP TRIGGER IF EXISTS trg_audit_profiles ON public.profiles;
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- USERS
DROP TRIGGER IF EXISTS trg_audit_users ON public.users;
CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
