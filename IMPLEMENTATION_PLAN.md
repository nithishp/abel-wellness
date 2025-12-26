# Healthcare Management System - Implementation Plan

## Overview

Transform the current appointment booking system into a comprehensive healthcare management system with multiple roles and workflows.

## Roles & Permissions

| Role       | Permissions                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Patient    | Book appointments, view history, view prescriptions, OTP-based login                           |
| Admin      | Manage all appointments, assign doctors, approve/reject/reschedule, manage doctors/pharmacists |
| Doctor     | View assigned appointments, conduct consultations, prescribe medications                       |
| Pharmacist | View prescriptions, mark as dispensed                                                          |

## Appointment Workflow

```
1. Patient books appointment (creates account via email OTP if new)
           ↓
2. Admin receives notification → Reviews appointment
           ↓
3. Admin Actions:
   - Approve + Assign Doctor → Doctor notified
   - Reject (with reason) → Patient notified
   - Reschedule → Patient notified with new date
           ↓
4. Doctor consults patient → Fills medical record + prescription
           ↓
5. Admin notified of consultation completion
           ↓
6. Pharmacist notified → Dispenses medication → Marks as fulfilled
           ↓
7. Patient can view all history in dashboard
```

## Database Schema

### New/Modified Tables

1. **users** - Extended user profiles with roles
2. **doctors** - Doctor profiles with specialization & availability
3. **pharmacists** - Pharmacist profiles
4. **appointments** - Extended with doctor assignment, rejection reason, etc.
5. **medical_records** - Consultation data filled by doctors
6. **prescriptions** - Medications prescribed
7. **prescription_items** - Individual medications in prescription
8. **notifications** - System notifications
9. **otp_codes** - For patient OTP authentication

## File Structure (New/Modified)

```
app/
  patient/
    dashboard/page.jsx      # Patient dashboard
    appointments/page.jsx   # Appointment history
    prescriptions/page.jsx  # Prescription history
    login/page.jsx          # OTP login
    verify/page.jsx         # OTP verification
  doctor/
    dashboard/page.jsx      # Doctor dashboard
    appointments/page.jsx   # Assigned appointments
    consultation/[id]/page.jsx  # Consultation form
    login/page.jsx          # Doctor login
  pharmacist/
    dashboard/page.jsx      # Pharmacist dashboard
    prescriptions/page.jsx  # Prescriptions to dispense
    login/page.jsx          # Pharmacist login
  admin/
    users/page.jsx          # Manage doctors/pharmacists
    appointments/page.jsx   # Enhanced appointment management
  api/
    auth/
      otp/send/route.js     # Send OTP
      otp/verify/route.js   # Verify OTP
    doctors/route.js        # Doctor CRUD
    pharmacists/route.js    # Pharmacist CRUD
    medical-records/route.js # Medical records
    prescriptions/route.js  # Prescriptions
    notifications/route.js  # Notifications
lib/
  email/
    service.js              # Nodemailer service
    templates/              # Email templates
  actions/
    doctor.actions.js
    pharmacist.actions.js
    prescription.actions.js
    notification.actions.js
```

## Implementation Phases

### Phase 1: Database & Core Infrastructure ✅

- [x] Create database migrations (`supabase/migrations/001_healthcare_schema.sql`)
- [x] Update Supabase config (`lib/supabase.config.js`)
- [x] Create email service (`lib/email/service.js`)

### Phase 2: Authentication & Roles ✅

- [x] Role-based auth context (`lib/auth/RoleAuthContext.jsx`)
- [x] Protected route components (`lib/auth/RoleProtectedRoute.jsx`)
- [x] OTP send API (`app/api/auth/otp/send/route.js`)
- [x] OTP verify API (`app/api/auth/otp/verify/route.js`)
- [x] Staff login API (`app/api/auth/login/route.js`)
- [x] Session API (`app/api/auth/session/route.js`)
- [x] Logout API (`app/api/auth/logout/route.js`)

### Phase 3: Admin Features ✅

- [x] User management API (`app/api/admin/users/route.js`)
- [x] User management page (`app/admin/users/page.jsx`)
- [x] Enhanced appointments API (`app/api/admin/appointments/route.js`)

### Phase 4: Doctor Features ✅

- [x] Doctor login page (`app/doctor/login/page.jsx`)
- [x] Doctor dashboard (`app/doctor/dashboard/page.jsx`)
- [x] Doctor dashboard API (`app/api/doctor/dashboard/route.js`)
- [x] Doctor appointments list (`app/doctor/appointments/page.jsx`)
- [x] Doctor appointments API (`app/api/doctor/appointments/route.js`)
- [x] Consultation page (`app/doctor/consultation/[id]/page.jsx`)
- [x] Consultation API (`app/api/doctor/consultation/[id]/route.js`)
- [x] Single appointment API (`app/api/doctor/appointments/[id]/route.js`)

### Phase 5: Pharmacist Features ✅

- [x] Pharmacist login page (`app/pharmacist/login/page.jsx`)
- [x] Pharmacist dashboard (`app/pharmacist/dashboard/page.jsx`)
- [x] Pharmacist dashboard API (`app/api/pharmacist/dashboard/route.js`)
- [x] Dispense prescription API (`app/api/pharmacist/prescriptions/[id]/dispense/route.js`)

### Phase 6: Patient Features ✅

- [x] Patient login page (`app/patient/login/page.jsx`)
- [x] Patient dashboard (`app/patient/dashboard/page.jsx`)
- [x] Patient dashboard API (`app/api/patient/dashboard/route.js`)
- [x] Patient appointments page (`app/patient/appointments/page.jsx`)
- [x] Patient appointments API (`app/api/patient/appointments/route.js`)
- [x] Patient prescriptions page (`app/patient/prescriptions/page.jsx`)
- [x] Patient prescriptions API (`app/api/patient/prescriptions/route.js`)

### Phase 7: Notifications ✅

- [x] NotificationBell component (`components/ui/NotificationBell.jsx`)
- [x] Notifications API (`app/api/notifications/route.js`)
- [x] Mark as read API (`app/api/notifications/[id]/read/route.js`)
- [x] Mark all read API (`app/api/notifications/read-all/route.js`)

### Phase 8: Appointment Booking Flow ✅

- [x] Updated booking API with patient account creation (`app/api/appointments/route.js`)
- [x] Updated AppointmentSection with success modals

## All Implementation Complete!

- [ ] Implement OTP authentication for patients
- [ ] Create role-based auth context
- [ ] Build protected routes per role

### Phase 3: Admin Features

- [ ] User management (doctors/pharmacists)
- [ ] Enhanced appointment management
- [ ] Doctor assignment with availability view

### Phase 4: Doctor Features

- [ ] Doctor dashboard
- [ ] Consultation form with medical record
- [ ] Prescription management

### Phase 5: Pharmacist Features

- [ ] Pharmacist dashboard
- [ ] Prescription dispensing

### Phase 6: Patient Features

- [ ] Patient dashboard
- [ ] Appointment history
- [ ] Prescription history

### Phase 7: Notifications

- [ ] Email notifications for all workflow steps
- [ ] In-app notification system
