DECLARE
    webhook_url CONSTANT text := 'https://n8n.tdconsulting.vn/webhook/6fd52c64-d217-4909-977c-0eeaa2a183e9';
    payload      jsonb;
    event_type   text;
BEGIN
    /* Distinguish between a fresh INSERT and a phase update */
    event_type := CASE TG_OP
        WHEN 'INSERT' THEN 'job_created'
        ELSE 'job_phase_changed'
    END;

    /* Build the JSON body sent to n8n */
    payload := jsonb_build_object(
        'event_type',     event_type,
        'job_id',         NEW.id,
        'position_title', NEW.position_title,
        'phase',          NEW.phase,
        'phase_date',     NEW.phase_date,
        'watch_emails',   NEW.watch_emails,
        'full_record',    to_jsonb(NEW)
    );

    /* HTTP POST (pg_net extension) */
    PERFORM net.http_post(
        url                  := webhook_url,
        body                 := payload,
        headers              := '{"Content-Type":"application/json"}'::jsonb,
        timeout_milliseconds := 5000
    );

    RETURN NEW;  -- always continue the original INSERT/UPDATE
EXCEPTION WHEN OTHERS THEN
    -- Never block the main transaction if the webhook fails
    RAISE NOTICE 'Webhook call failed for job %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;