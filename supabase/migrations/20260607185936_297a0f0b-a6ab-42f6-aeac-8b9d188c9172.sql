
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

UPDATE public.staff
SET created_by = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE created_by IS NULL;
