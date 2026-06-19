CREATE OR REPLACE FUNCTION public.get_database_candidates_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_role public.user_role_enum;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  -- Get current user's role
  SELECT u.role
  INTO current_user_role
  FROM public.users u
  WHERE u.id = auth.uid();

  -- If user not found or role is null
  IF current_user_role IS NULL THEN
    RETURN 0;
  END IF;

  -- Allow only internal roles
  IF current_user_role = ANY (ARRAY[
    'Admin',
    'Manager',
    'BD',
    'Headhunter',
    'HR',
    'CTV'
  ]::public.user_role_enum[]) THEN
    RETURN (
      SELECT count(*)
      FROM public.database_candidates
    );
  END IF;

  -- Default deny
  RETURN 0;
END;
$$;
