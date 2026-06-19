-- Create company_events TABLE (if not exists)
create table IF NOT EXISTS public.company_events (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone null,
  location text null,
  is_all_day boolean null default false,
  created_by uuid null,
  participants uuid[] not null,
  reminder_minutes integer[] null default array[10, 60, 1440],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  level text null,
  process_id uuid null,
  client_id uuid null,
  job_id uuid null,
  constraint company_events_pkey primary key (id),
  constraint company_events_client_id_fkey foreign KEY (client_id) references clients (id),
  constraint company_events_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint company_events_job_id_fkey foreign KEY (job_id) references jobs (id),
  constraint fk_company_events_process_id foreign KEY (process_id) references processes (id) on delete set null
) TABLESPACE pg_default;

-- Create Indexes
create index IF not exists idx_company_events_start_time on public.company_events using btree (start_time) TABLESPACE pg_default;
create index IF not exists idx_company_events_participants on public.company_events using gin (participants) TABLESPACE pg_default;
create index IF not exists idx_company_events_client_id on public.company_events using btree (client_id) TABLESPACE pg_default;
create index IF not exists idx_company_events_job_id on public.company_events using btree (job_id) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view relevant events" ON public.company_events;
DROP POLICY IF EXISTS "Users can create events" ON public.company_events;
DROP POLICY IF EXISTS "Users can update relevant events" ON public.company_events;
DROP POLICY IF EXISTS "Users can delete relevant events" ON public.company_events;

-- 1. SELECT Policy
CREATE POLICY "Users can view relevant events"
ON public.company_events
FOR SELECT
USING (
  -- Admin, BD, HR can view all events
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('Admin', 'BD', 'HR')
  )
  OR
  -- Users can view events they created
  created_by = auth.uid()
  OR
  -- Users can view events they are participating in
  auth.uid() = ANY(participants)
  OR
  -- Client can view events related to their company
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role = 'CLIENT' 
    AND u.client_id = company_events.client_id
  )
  OR
  -- Process Owner (Headhunter) can view events related to their process
  EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = company_events.process_id 
    AND p.owner_id = auth.uid()
  )
);

-- 2. INSERT Policy
CREATE POLICY "Users can create events"
ON public.company_events
FOR INSERT
WITH CHECK (
  -- Admin, BD, HR can create events
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('Admin', 'BD', 'HR')
  )
  OR
  -- Client can create events for their company (ensured by frontend logic or trigger, here simply by role)
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'CLIENT'
  )
   OR
  -- Headhunter can create events (typically for their candidates)
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'Headhunter'
  )
);

-- 3. UPDATE Policy
CREATE POLICY "Users can update relevant events"
ON public.company_events
FOR UPDATE
USING (
  -- Admin, BD, HR can update all events
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('Admin', 'BD', 'HR')
  )
  OR
  -- Creator can update their events
  created_by = auth.uid()
  OR
  -- Client can update events for their company
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role = 'CLIENT' 
    AND u.client_id = company_events.client_id
  )
  OR
  -- Headhunter (Process Owner) can update events for their process
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.processes p ON p.owner_id = u.id
    WHERE p.id = company_events.process_id 
    AND u.id = auth.uid()
    AND u.role = 'Headhunter'
  )
);

-- 4. DELETE Policy
CREATE POLICY "Users can delete relevant events"
ON public.company_events
FOR DELETE
USING (
   -- Admin, BD can delete any event
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('Admin', 'BD')
  )
  OR
  -- Creator can delete their own event
  created_by = auth.uid()
);
