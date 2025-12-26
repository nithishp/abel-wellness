
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  role character varying NOT NULL DEFAULT 'admin'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  date timestamp with time zone NOT NULL,
  service character varying,
  message text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  patient_id uuid,
  doctor_id uuid,
  assigned_by uuid,
  time character varying,
  reason_for_visit text,
  rejection_reason text,
  rescheduled_from timestamp with time zone,
  consultation_status character varying DEFAULT 'pending'::character varying CHECK (consultation_status::text = ANY (ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  notes text,
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT appointments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.blogs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description character varying NOT NULL,
  content text NOT NULL,
  author character varying NOT NULL,
  image_url character varying,
  slug character varying NOT NULL UNIQUE,
  published boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blogs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  specialization character varying,
  qualification character varying,
  experience_years integer,
  consultation_fee numeric,
  bio text,
  is_available boolean DEFAULT true,
  working_hours jsonb DEFAULT '{"friday": {"end": "17:00", "start": "09:00"}, "monday": {"end": "17:00", "start": "09:00"}, "tuesday": {"end": "17:00", "start": "09:00"}, "thursday": {"end": "17:00", "start": "09:00"}, "wednesday": {"end": "17:00", "start": "09:00"}}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid,
  patient_id uuid,
  doctor_id uuid,
  chief_complaints text,
  onset text,
  duration text,
  location text,
  sensation text,
  modalities text,
  associated_symptoms text,
  progression text,
  history_present_illness text,
  past_history text,
  family_history text,
  physical_generals text,
  physical_particulars text,
  mental_emotional_state text,
  vital_signs jsonb DEFAULT '{"pulse": "", "height": "", "weight": "", "temperature": "", "blood_pressure": "", "respiratory_rate": ""}'::jsonb,
  general_exam_findings text,
  tongue_pulse text,
  lab_results text,
  imaging_results text,
  provisional_diagnosis text,
  totality_analysis text,
  final_diagnosis text,
  treatment_plan text,
  follow_up_instructions text,
  additional_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medical_records_pkey PRIMARY KEY (id),
  CONSTRAINT medical_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id),
  CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title character varying NOT NULL,
  message text NOT NULL,
  type character varying DEFAULT 'info'::character varying,
  related_type character varying,
  related_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  code character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pharmacists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  license_number character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pharmacists_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.prescription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_id uuid,
  medication_name character varying NOT NULL,
  dosage character varying,
  frequency character varying,
  duration character varying,
  quantity character varying,
  instructions text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescription_items_pkey PRIMARY KEY (id),
  CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id)
);
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  medical_record_id uuid,
  appointment_id uuid,
  patient_id uuid,
  doctor_id uuid,
  dispensed_by uuid,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'dispensed'::character varying, 'cancelled'::character varying]::text[])),
  notes text,
  dispensed_at timestamp with time zone,
  dispensed_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_medical_record_id_fkey FOREIGN KEY (medical_record_id) REFERENCES public.medical_records(id),
  CONSTRAINT prescriptions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(id),
  CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT prescriptions_dispensed_by_fkey FOREIGN KEY (dispensed_by) REFERENCES public.pharmacists(id)
);
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  ip_address character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  phone character varying,
  password_hash character varying,
  role character varying NOT NULL DEFAULT 'patient'::character varying CHECK (role::text = ANY (ARRAY['patient'::character varying, 'admin'::character varying, 'doctor'::character varying, 'pharmacist'::character varying]::text[])),
  age integer,
  sex character varying,
  occupation character varying,
  address text,
  avatar_url character varying,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);