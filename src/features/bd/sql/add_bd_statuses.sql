-- Script to add new values to bd_status_enum
-- Note: PostgreSQL ALTER TYPE ADD VALUE cannot run inside a transaction block normally,
-- but we can verify existence before adding to avoid errors if re-run.

DO $$
BEGIN
    -- 1. Phase đầu
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Research' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Research';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Addfriend/Connect' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Addfriend/Connect';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Approach' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Approach';
    END IF;

    -- 2. Phase giữa
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Follow up' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Follow up';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Consulting' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Consulting';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Demo contract' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Demo contract';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Signing' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Signing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Signed' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Signed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Meeting Clear JD' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Meeting Clear JD';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Hunting' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Hunting';
    END IF;

    -- 3. Phase cuối
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Take care' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Take care';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'No current need' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'No current need';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Excluded' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Excluded';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Rejected' AND enumtypid = 'bd_status_enum'::regtype) THEN
        ALTER TYPE bd_status_enum ADD VALUE 'Rejected';
    END IF;
END $$;
