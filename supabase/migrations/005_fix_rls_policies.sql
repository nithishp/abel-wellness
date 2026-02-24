-- ============================================
-- Fix RLS Policies: Replace blanket allow-all with proper role-based policies
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Service role can do all on users" ON users;
DROP POLICY IF EXISTS "Service role can do all on doctors" ON doctors;
DROP POLICY IF EXISTS "Service role can do all on pharmacists" ON pharmacists;
DROP POLICY IF EXISTS "Service role can do all on otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Service role can do all on medical_records" ON medical_records;
DROP POLICY IF EXISTS "Service role can do all on prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Service role can do all on prescription_items" ON prescription_items;
DROP POLICY IF EXISTS "Service role can do all on notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can do all on user_sessions" ON user_sessions;

-- Users table: service_role full access, anon denied
CREATE POLICY "service_role_full_access_users" ON users
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_users" ON users
    FOR ALL TO anon USING (false);

-- Doctors table: service_role full, anon read-only (for public listing)
CREATE POLICY "service_role_full_access_doctors" ON doctors
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_doctors" ON doctors
    FOR SELECT TO anon USING (true);
CREATE POLICY "anon_denied_write_doctors" ON doctors
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "anon_denied_update_doctors" ON doctors
    FOR UPDATE TO anon USING (false);
CREATE POLICY "anon_denied_delete_doctors" ON doctors
    FOR DELETE TO anon USING (false);

-- Pharmacists: service_role only
CREATE POLICY "service_role_full_access_pharmacists" ON pharmacists
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_pharmacists" ON pharmacists
    FOR ALL TO anon USING (false);

-- OTP codes: service_role only
CREATE POLICY "service_role_full_access_otp_codes" ON otp_codes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_otp_codes" ON otp_codes
    FOR ALL TO anon USING (false);

-- Medical records: service_role only
CREATE POLICY "service_role_full_access_medical_records" ON medical_records
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_medical_records" ON medical_records
    FOR ALL TO anon USING (false);

-- Prescriptions: service_role only
CREATE POLICY "service_role_full_access_prescriptions" ON prescriptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_prescriptions" ON prescriptions
    FOR ALL TO anon USING (false);

-- Prescription items: service_role only
CREATE POLICY "service_role_full_access_prescription_items" ON prescription_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_prescription_items" ON prescription_items
    FOR ALL TO anon USING (false);

-- Notifications: service_role only
CREATE POLICY "service_role_full_access_notifications" ON notifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_notifications" ON notifications
    FOR ALL TO anon USING (false);

-- User sessions: service_role only
CREATE POLICY "service_role_full_access_user_sessions" ON user_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_denied_user_sessions" ON user_sessions
    FOR ALL TO anon USING (false);

-- Appointments: anon can insert (public booking), service_role full
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_appointments" ON appointments
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_appointments" ON appointments
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_denied_read_appointments" ON appointments
    FOR SELECT TO anon USING (false);
CREATE POLICY "anon_denied_update_appointments" ON appointments
    FOR UPDATE TO anon USING (false);
CREATE POLICY "anon_denied_delete_appointments" ON appointments
    FOR DELETE TO anon USING (false);

-- Blogs: anon can read published only, service_role full
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_blogs" ON blogs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_published_blogs" ON blogs
    FOR SELECT TO anon USING (published = true);
CREATE POLICY "anon_denied_write_blogs" ON blogs
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "anon_denied_update_blogs" ON blogs
    FOR UPDATE TO anon USING (false);
CREATE POLICY "anon_denied_delete_blogs" ON blogs
    FOR DELETE TO anon USING (false);

-- Billing tables: service_role only
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS billing_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoices') THEN
    CREATE POLICY "service_role_full_access_invoices" ON invoices
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "anon_denied_invoices" ON invoices
      FOR ALL TO anon USING (false);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invoice_items') THEN
    CREATE POLICY "service_role_full_access_invoice_items" ON invoice_items
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "anon_denied_invoice_items" ON invoice_items
      FOR ALL TO anon USING (false);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payments') THEN
    CREATE POLICY "service_role_full_access_payments" ON payments
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "anon_denied_payments" ON payments
      FOR ALL TO anon USING (false);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_refunds') THEN
    CREATE POLICY "service_role_full_access_payment_refunds" ON payment_refunds
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "anon_denied_payment_refunds" ON payment_refunds
      FOR ALL TO anon USING (false);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'billing_settings') THEN
    CREATE POLICY "service_role_full_access_billing_settings" ON billing_settings
      FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY "anon_denied_billing_settings" ON billing_settings
      FOR ALL TO anon USING (false);
  END IF;
END $$;
