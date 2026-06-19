-- 1. Drop the existing trigger (which only fires on INSERT)
DROP TRIGGER IF EXISTS trigger_candidates_after_insert_sync_upsert ON candidates;

-- 2. Re-create the trigger to fire on both INSERT and UPDATE
CREATE TRIGGER trigger_candidates_after_insert_update_sync_upsert
AFTER INSERT OR UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION sync_to_database_candidates_upsert();
