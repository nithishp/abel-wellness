-- Healthcare Management System Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. USERS TABLE (Extended profiles with roles)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    password_hash VARCHAR(255), -- For staff (admin, doctor, pharmacist) only
    role VARCHAR(50) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'admin', 'doctor', 'pharmacist')),
    age INTEGER,
    sex VARCHAR(20),
    occupation VARCHAR(100),
    address TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 2. DOCTORS TABLE (Doctor profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(255),
    qualification VARCHAR(500),
    experience_years INTEGER,
    consultation_fee DECIMAL(10, 2),
    bio TEXT,
    is_available BOOLEAN DEFAULT true,
    working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_available ON doctors(is_available);

-- ============================================
-- 3. PHARMACISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacists_user_id ON pharmacists(user_id);

-- ============================================
-- 4. OTP CODES TABLE (For patient authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- ============================================
-- 5. APPOINTMENTS TABLE (Extended)
-- ============================================
-- First, drop the old table if it exists and recreate with new schema
-- Or alter existing table - we'll use ALTER for safety

-- Add new columns to existing appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reason_for_visit TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consultation_status VARCHAR(50) DEFAULT 'pending' CHECK (consultation_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update status check constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'rescheduled', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- ============================================
-- 6. MEDICAL RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES doctors(id),
    
    -- Preliminary Data (Demographics captured from user profile)
    
    -- Chief Complaints
    chief_complaints TEXT,
    onset TEXT,
    duration TEXT,
    location TEXT,
    sensation TEXT,
    modalities TEXT,
    associated_symptoms TEXT,
    progression TEXT,
    
    -- History
    history_present_illness TEXT,
    past_history TEXT,
    family_history TEXT,
    
    -- Physical Generals
    physical_generals TEXT,
    physical_particulars TEXT,
    
    -- Mental & Emotional State
    mental_emotional_state TEXT,
    
    -- Examination & Investigations
    vital_signs JSONB DEFAULT '{"temperature": "", "blood_pressure": "", "pulse": "", "respiratory_rate": "", "weight": "", "height": ""}',
    general_exam_findings TEXT,
    tongue_pulse TEXT,
    lab_results TEXT,
    imaging_results TEXT,
    
    -- Diagnosis
    provisional_diagnosis TEXT,
    totality_analysis TEXT,
    final_diagnosis TEXT,
    
    -- Additional Notes
    treatment_plan TEXT,
    follow_up_instructions TEXT,
    additional_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id);

-- ============================================
-- 7. PRESCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES doctors(id),
    pharmacist_id UUID REFERENCES pharmacists(id),
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'dispensed', 'cancelled')),
    
    notes TEXT,
    dispensed_at TIMESTAMPTZ,
    dispensed_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_pharmacist ON prescriptions(pharmacist_id);

-- ============================================
-- 8. PRESCRIPTION ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    quantity INTEGER,
    instructions TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'appointment', 'prescription')),
    
    related_type VARCHAR(50), -- 'appointment', 'prescription', 'medical_record'
    related_id UUID,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- 10. SESSIONS TABLE (For custom session management)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacists_updated_at BEFORE UPDATE ON pharmacists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- For now, allow service role to bypass RLS (we'll use supabaseAdmin for API calls)
-- Policies can be refined based on specific needs

-- Users table policies
CREATE POLICY "Service role can do all on users" ON users
    FOR ALL USING (true);

-- Doctors table policies
CREATE POLICY "Service role can do all on doctors" ON doctors
    FOR ALL USING (true);

-- Pharmacists table policies
CREATE POLICY "Service role can do all on pharmacists" ON pharmacists
    FOR ALL USING (true);

-- OTP codes policies
CREATE POLICY "Service role can do all on otp_codes" ON otp_codes
    FOR ALL USING (true);

-- Medical records policies
CREATE POLICY "Service role can do all on medical_records" ON medical_records
    FOR ALL USING (true);

-- Prescriptions policies
CREATE POLICY "Service role can do all on prescriptions" ON prescriptions
    FOR ALL USING (true);

-- Prescription items policies
CREATE POLICY "Service role can do all on prescription_items" ON prescription_items
    FOR ALL USING (true);

-- Notifications policies
CREATE POLICY "Service role can do all on notifications" ON notifications
    FOR ALL USING (true);

-- Sessions policies
CREATE POLICY "Service role can do all on user_sessions" ON user_sessions
    FOR ALL USING (true);

-- ============================================
-- SEED DATA (Optional - Create initial admin)
-- ============================================
-- Uncomment and modify to create initial admin
-- INSERT INTO users (email, name, role, is_active) 
-- VALUES ('admin@yourdomain.com', 'System Admin', 'admin', true);
