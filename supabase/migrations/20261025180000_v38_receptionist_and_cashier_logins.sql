-- Migration v38: Dedicated Receptionist and Cashier test accounts
-- Creates auth.users and profiles for reception@mediclinic.local and cashier@mediclinic.local with password 'password123'

DO $$
DECLARE
  hashed_pwd TEXT;
  reception_uid UUID := '879a8d64-569f-4e9c-b24e-0a9911807193';
  cashier_uid UUID := '5f67fb73-9aac-4a6e-b9de-561c99ec876c';
BEGIN
  -- Standard bcrypt hash for 'password123'
  hashed_pwd := crypt('password123', gen_salt('bf'));

  -- 1. Insert or update reception@mediclinic.local
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'reception@mediclinic.local') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      role, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      reception_uid, '00000000-0000-0000-0000-000000000000', 'reception@mediclinic.local',
      hashed_pwd, now(), '{"provider": "email", "providers": ["email"]}', '{}',
      now(), now(), 'authenticated', '', '', '', ''
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = hashed_pwd, email_confirmed_at = now()
    WHERE email = 'reception@mediclinic.local';
  END IF;

  -- 2. Insert or update cashier@mediclinic.local
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cashier@mediclinic.local') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      role, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      cashier_uid, '00000000-0000-0000-0000-000000000000', 'cashier@mediclinic.local',
      hashed_pwd, now(), '{"provider": "email", "providers": ["email"]}', '{}',
      now(), now(), 'authenticated', '', '', '', ''
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = hashed_pwd, email_confirmed_at = now()
    WHERE email = 'cashier@mediclinic.local';
  END IF;

  -- 3. Upsert into profiles with their respective dedicated single roles
  INSERT INTO public.profiles (id, full_name, role, roles)
  VALUES 
    (reception_uid, 'Front Desk Receptionist', 'receptionist', ARRAY['receptionist']),
    (cashier_uid, 'Billing Cashier', 'cashier', ARRAY['cashier'])
  ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    roles = EXCLUDED.roles;

  -- 4. Update staff table linkage if present
  UPDATE public.staff 
  SET auth_id = reception_uid, system_role = 'receptionist', system_roles = ARRAY['receptionist']
  WHERE email = 'reception@mediclinic.local';

  UPDATE public.staff 
  SET auth_id = cashier_uid, system_role = 'cashier', system_roles = ARRAY['cashier']
  WHERE email = 'cashier@mediclinic.local';
END $$;
