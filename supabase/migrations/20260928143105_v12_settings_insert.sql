-- v12: SettingsContext saves with an upsert on id = 1. With no row yet, that is an
-- INSERT, which v7 did not allow, so the first settings save always failed.
CREATE POLICY "Admin can insert settings" ON clinic_settings
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
