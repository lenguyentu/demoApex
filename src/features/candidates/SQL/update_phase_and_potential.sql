-- 1. Update/Create the candidate_phase_enum
-- Note: Supabase/PostgreSQL doesn't support 'CREATE OR REPLACE TYPE', so we handle it with a DO block or manual changes.
-- Here is the script to add values if they don't exist, or create the type.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_phase_enum') THEN
        CREATE TYPE candidate_phase_enum AS ENUM (
            'New_Lead',
            'Contacted',
            'Screening',
            'Qualified',
            'Submitted_To_Client',
            'Interview_Process',
            'Offer_Stage',
            'Placed',
            'Archived_Not_Suitable',
            'Archived_Not_Interested'
        );
    ELSE
        -- Add new values if they don't exist (Idempotent approach)
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'New_Lead';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Contacted';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Screening';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Qualified';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Submitted_To_Client';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Interview_Process';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Offer_Stage';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Placed';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Archived_Not_Suitable';
        ALTER TYPE candidate_phase_enum ADD VALUE IF NOT EXISTS 'Archived_Not_Interested';
    END IF;
END
$$;

-- 2. Add is_potential column to candidates table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'is_potential') THEN
        ALTER TABLE candidates ADD COLUMN is_potential BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;
