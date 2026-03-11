-- Promote andrewmunyanyi1@gmail.com to admin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find the user ID from auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andrewmunyanyi1@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure the user has a profile (though the trigger should have handled this)
    INSERT INTO public.profiles (id, full_name)
    VALUES (v_user_id, 'Andrew Munyanyi')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Andrew Munyanyi';

    -- Promote to admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'User andrewmunyanyi1@gmail.com has been promoted to admin.';
  ELSE
    RAISE NOTICE 'User andrewmunyanyi1@gmail.com not found in auth.users.';
  END IF;
END $$;
