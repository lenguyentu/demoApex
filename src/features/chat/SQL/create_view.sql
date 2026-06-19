-- View: conversation_summary
-- Drop if exists to update
DROP VIEW IF EXISTS conversation_summary;

CREATE VIEW conversation_summary AS
SELECT 
    c.id,
    c.process_id,
    c.title,
    c.created_at,
    c.updated_at,
    c.is_active,
    -- Info from Processes/Candidates/Jobs
    p.candidate_id,
    p.job_id,
    cd.name AS candidate_name,
    j.position_title AS job_title,
    p.owner_id AS process_owner_id,
    u.full_name AS owner_name,
    -- Last Message Info (Subquery for performance)
    (
        SELECT row_to_json(lm.*) 
        FROM (
            SELECT 
                m.id, 
                m.content, 
                m.sender_id, 
                su.full_name AS sender_name, 
                m.created_at,
                m.attachments
            FROM messages m
            JOIN users su ON m.sender_id = su.id
            WHERE m.conversation_id = c.id AND m.is_deleted = false
            ORDER BY m.created_at DESC 
            LIMIT 1
        ) lm
    ) AS last_message,
    -- Unread Count Calculation
    (
        SELECT COUNT(*)::int
        FROM messages m
        JOIN conversation_participants cp ON cp.conversation_id = c.id
        WHERE m.conversation_id = c.id 
          AND m.is_deleted = false
          AND cp.user_id = auth.uid() -- Filter for current user
          AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
    ) AS unread_count
FROM conversations c
JOIN processes p ON c.process_id = p.id
LEFT JOIN candidates cd ON p.candidate_id = cd.id
LEFT JOIN jobs j ON p.job_id = j.id
LEFT JOIN users u ON p.owner_id = u.id
-- Filter to ensure user is a participant
WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id 
    AND cp.user_id = auth.uid()
);

-- Grant access
GRANT SELECT ON conversation_summary TO authenticated;
