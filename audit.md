User: You are a Principal Software Architect, Security Engineer, and Performance Specialist.

Your task is to perform a COMPLETE DEEP AUDIT of this entire codebase.

Scan and analyze:
- Architecture
- Folder structure
- Backend & frontend separation
- API design
- Database schema & ORM usage
- State management
- Authentication & authorization
- Multitenancy safety (if applicable)
- Validation & error handling
- Security vulnerabilities
- Performance bottlenecks
- Scalability limits
- Code quality & maintainability
- Type safety
- Concurrency & race conditions
- Transactions & data integrity
- Logging, auditing, observability
- Configuration management
- Dev/prod environment safety
- Cost optimization risks
- UX-level logic bugs

---

## 1️⃣ ARCHITECTURE REVIEW

Check and report:
- Violations of clean architecture / layered architecture
- Tight coupling between modules
- God services / god components
- Missing domain separation
- Incorrect responsibilities
- Anti-patterns
- Where dependency inversion is violated
- Where business logic is in UI or controllers
- Where abstractions are missing or over-engineered

---

## 2️⃣ SECURITY REVIEW (VERY IMPORTANT)

Find:
- Authentication bypass risks
- Authorization bugs (IDOR, privilege escalation)
- Missing permission checks
- SQL/NoSQL injection risks
- File upload vulnerabilities
- Token/session handling issues
- Secrets leakage
- Insecure API endpoints
- Missing validation
- Broken access control
- Multi-tenant data leakage risks
- Insecure webhooks, cron jobs, background jobs

---

## 3️⃣ DATA & DB REVIEW

Check:
- Schema design flaws
- Missing indexes
- Wrong data types
- Missing constraints
- Transaction safety
- Race conditions
- Inconsistent naming
- Orphan records risk
- Soft delete vs hard delete problems
- Audit log gaps
- Financial data safety (if applicable)

---

## 4️⃣ PERFORMANCE & SCALE REVIEW

Detect:
- N+1 query problems
- Over-fetching / under-fetching
- Uncached expensive calls
- Bad pagination
- Blocking operations
- Bad async usage
- Memory leaks
- Heavy frontend bundles
- Re-render problems
- Missing background jobs / queues

---

## 5️⃣ CODE QUALITY REVIEW

Point out:
- Repeated code
- Wrong abstractions
- Over-complex logic
- Poor naming
- Missing types
- Poor error handling
- Silent failures
- Where design patterns should be used
- Where design patterns are misused

---

## 6️⃣ PRODUCT & LOGIC REVIEW

Check:
- Business rule violations
- Broken workflows
- Missing edge cases
- Race condition scenarios
- Inconsistent state transitions
- Payment/billing logic risks
- Appointment/booking conflicts
- Double-submit bugs
- Idempotency issues

---

## 7️⃣ DEVOPS & PRODUCTION READINESS

Check:
- Environment config mistakes
- Secrets management
- Logging quality
- Monitoring gaps
- Audit trail gaps
- Migration safety
- Rollback safety
- Feature flag missing places

---

## 8️⃣ OUTPUT FORMAT

Give me:

1. 🚨 CRITICAL ISSUES (must fix before production)
2. ⚠️ HIGH PRIORITY ISSUES
3. 🟡 MEDIUM PRIORITY ISSUES
4. 🟢 LOW PRIORITY IMPROVEMENTS
5. 🏗️ ARCHITECTURE REFACTOR SUGGESTIONS
6. 🚀 PERFORMANCE OPTIMIZATIONS
7. 🔐 SECURITY HARDENING CHECKLIST
8. 📐 CODE STRUCTURE IMPROVEMENTS
9. 🧠 LONG TERM SCALE RECOMMENDATIONS

For EACH issue:
- Show exact file/module
- Explain why it is a problem
- What can break in production
- How to fix it (with example code if possible)

Be EXTREMELY strict and assume this is a system that must scale to 1,000,000+ users and handle money and sensitive data.

Do not be polite. Do not be optimistic. Be paranoid, critical, and production-minded.


GitHub Copilot: Optimizing tool selection...I'll perform a comprehensive deep audit of this codebase. Let me systematically analyze all critical areas. 

Audit authentication & authorization

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth)

Searched for files matching `**/middleware.js`, no matches

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist)

Searched for files matching `**/middleware.*`, no matches

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/login)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/logout)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/session)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/login/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/logout/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/session/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/AuthContext.jsx#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/ProtectedRoute.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/RoleAuthContext.jsx#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/RoleProtectedRoute.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/send)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/verify)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/blogs)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/users)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/send/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/verify/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/blogs/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/users/route.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/dashboard)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/billing)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/prescriptions)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/records)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/profile)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/dashboard)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/prescriptions)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/dashboard/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/billing/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/prescriptions/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/records/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/dashboard/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/prescriptions/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/billing/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/prescriptions/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D/route.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/%5Bid%5D/route.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/billing/%5Bid%5D/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/prescriptions/%5Bid%5D/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/inventory)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctors)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/notifications)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.config.js#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/inventory/items/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/notifications/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctors/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/dashboard/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients/records)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/%5Bid%5D/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients/records/route.js#1-1), lines 1 to 100

Searched for regex `verifySession|verifyAdminSession|verifyDoctorSession|verifyPatientSession|verifyPharmacistSession` (`**/app/api/**/*.js`), 20 results

Searched for text `export async function GET` (`**/app/api/**/*.js`), 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/test-env/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/oorep/search/route.js#1-1), lines 1 to 80

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/oorep/config/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/upload-image)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/upload-image/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/notifications/read-all/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/payments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/payments/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/quick-bill)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/pharmacy)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/quick-bill/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/pharmacy/route.js)

Searched for regex `verifySession|verifyAdmin|checkAuth` (`**/lib/actions/**/*.js`), no results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/blog.actions.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/quickbill.actions.js#1-1), lines 1 to 100

Audit database schema & queries

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/DATABASE_SCHEMA.md)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.client.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.config.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/001_healthcare_schema.sql#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/002_inventory_schema.sql#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/003_inventory_notifications.sql)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/004_billing_schema.sql#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/001_healthcare_schema.sql#295-295), lines 295 to 341

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/002_inventory_schema.sql#200-200), lines 200 to 523

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/004_billing_schema.sql#300-300), lines 300 to 506

Searched for regex `\.from\(|\.select\(|\.insert\(|\.update\(|\.delete\(|\.rpc\(`, 20 results

Searched for regex `supabase\.(from|select|insert|update|delete|rpc)\(|supabaseAdmin\.(from|select|insert|update|delete|rpc)\(`, 25 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory.actions.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/quickbill.actions.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/users/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/users/route.js#140-140), lines 140 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#200-200), lines 200 to 400

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/credit-note.actions.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/login/route.js)

Searched for regex `\.ilike\(|\.or\(.*ilike|\.or\(.*like|raw\(|rpc\(`, 6 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory.actions.js#220-220), lines 220 to 300

Searched for regex `Promise\.all|await.*map\(|\.map\(async`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients/route.js#70-70), lines 70 to 150

Searched for regex `\.single\(\)|LIMIT 1|limit\(1\)`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory-billing.actions.js#1-1), lines 1 to 150

Searched for regex `BEGIN|COMMIT|ROLLBACK|transaction`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/quickbill.actions.js#150-150), lines 150 to 400

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/credit-note.actions.js#200-200), lines 200 to 300

Searched for regex `supabase\.rpc|\.execute|raw\s*SQL|text\s*input|string\s*interpolation|\$\{.*\}`, 20 results

Searched for regex `verifySession|verifyAdminSession|verifyDoctorSession|auth\.uid`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/ledger.actions.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/appointment.actions.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#500-500), lines 500 to 650

Audit API routes & validation

Searched for files matching `**/app/api/**/route.{js,ts,jsx,tsx}`, 71 matches

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/login/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/session/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/upload-image/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/send/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/verify/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/users/route.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients/route.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/blogs/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/payments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/inventory/items/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/records/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctors/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/notifications/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/prescriptions/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/prescriptions/%5Bid%5D/dispense/route.js#1-1), lines 1 to 120

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/oorep/search/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/test-env/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/quick-bill/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/refunds/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/inventory/dispense/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/billing/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/logout/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/patients/records/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/reports/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/ledger/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/inventory/items/%5Bid%5D/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/inventory/items/%5Bid%5D/adjust/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/blog.actions.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/%5Bid%5D/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/pharmacist/dashboard/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/dashboard/route.js#1-1), lines 1 to 100

Audit billing & payment logic

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/documents/BILLING_MODULE_DOCUMENTATION.md#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/documents/BILLING_MODULE_REQUIREMENT.md#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/billing.constants.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/billing)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/billing)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/documents/BILLING_MODULE_REQUIREMENT.md#200-200), lines 200 to 350

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/billing.constants.js#100-100), lines 100 to 167

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/payments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/refunds)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/credit-notes)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/quick-bill)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/pharmacy)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/payments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/refunds/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/quick-bill/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/pharmacy/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/credit-notes/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/credit-notes/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/quickbill.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/creditnote.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/ledger.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#300-300), lines 300 to 600

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#600-600), lines 600 to 900

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/audit.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory-billing.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#900-900), lines 900 to 1200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/quickbill.actions.js#300-300), lines 300 to 600

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/sync)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/offline-billing.actions.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/billing/page.jsx#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/billing/page.jsx#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/sync/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/%5Bid%5D/route.js)

Searched for regex `razorpay|stripe|payment.*gateway|gateway.*payment`, 20 results

Searched for regex `parseFloat|parseInt|toFixed|Number\(` (`**/*billing*.js`), 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#1200-1200), lines 1200 to 1358

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/gst.actions.js#1-1), lines 1 to 150

Searched for regex `transaction|atomic|lock|FOR UPDATE|BEGIN|COMMIT|ROLLBACK`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory-billing.actions.js#300-300), lines 300 to 500

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/004_billing_schema.sql#200-200), lines 200 to 350

Searched for regex `idempotency|idempotent|duplicate.*payment|payment.*duplicate`, no results

Audit appointments & booking logic

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/appointments/page.jsx#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/appointments/page.jsx#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/appointments/page.jsx#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/appointments/page.jsx#300-300), lines 300 to 600

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/route.js#1-1), lines 1 to 350

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/patient/appointments/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/route.js#350-350), lines 350 to 781

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/appointments/%5Bid%5D/route.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.config.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/DATABASE_SCHEMA.md)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/001_healthcare_schema.sql#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D/route.js#1-1), lines 1 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/001_healthcare_schema.sql#200-200), lines 200 to 341

Searched for regex `time.slot|timeslot|available.slot|slot|working_hours|availability`, 20 results

Searched for regex `double.book|overlap|conflict|duplicate.*appointment|existing.*appointment`, 20 results

Searched for regex `same.*date.*time|book.*same|concurrent|transaction|lock|race`, 20 results

Now let me continue gathering more context on configuration, frontend components, and code quality issues. 

Audit environment & config

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/next.config.mjs)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/package.json)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.config.js)

Searched for files matching `**/.env*`, no matches

Searched for regex `process\.env`, 20 results

Searched for regex `process\.env`, 63 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/scripts/setup-admin.mjs#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/email/service.js#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.client.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/debug-env/page.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/test-setup/page.jsx#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/test-env/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/diagnostic/page.jsx#1-1), lines 1 to 100

Searched for regex `password|secret|key|token|credential|auth`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/test-setup/page.jsx#35-35), lines 35 to 112

Searched for regex `[a-zA-Z0-9_-]{20,}`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/SUPABASE_SETUP.md#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/login/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/otp/verify/route.js)

Searched for regex `localhost|127\.0\.0\.1`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/oorep/search/route.js#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/oorep/config/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/README_SETUP.md#1-1), lines 1 to 100

Searched for text `CORS`, 3 results

Searched for regex `rate.?limit|throttl|brute.?force`, no results

Searched for regex `csrf|xss|sanitiz|escape|injection`, 19 results

Searched for regex `headers\[|setHeader|Content-Security-Policy|X-Frame-Options`, no results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/setup-collections)

Searched for regex `NODE_ENV`, 2 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/oorep-session.js#1-1), lines 1 to 100

Searched for regex `console\.(log|warn|error|debug)`, 20 results

Searched for files matching `**/.gitignore`, 1 match

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/.gitignore#1-1), lines 1 to 50

Searched for regex `middleware\.js|middleware\.ts`, no results

Searched for files matching `**/middleware*`, no matches

Searched for regex `Authorization|Bearer|x-api-key`, 3 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/tailwind.config.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/users/route.js#1-1), lines 1 to 60

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/blogs/route.js#1-1), lines 1 to 60

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/appointments/route.js#1-1), lines 1 to 60

Searched for regex `verifyAdmin|verifySession|checkAuth|isAuthenticated`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin/blogs/route.js#40-40), lines 40 to 109

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/blog.actions.js#1-1), lines 1 to 70

Audit frontend components

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/Hero.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/components)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/components)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/components)

Searched for text `dangerouslySetInnerHTML`, 2 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/Hero.jsx#100-100), lines 100 to 172

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/blog/%5Bslug%5D/page.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/components/ui/chart.jsx#50-50), lines 50 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/components/AdminSidebar.jsx#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/components/PatientSidebar.jsx#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/components/DoctorSidebar.jsx#1-1), lines 1 to 150

Searched for regex `localStorage\.(getItem|setItem)|sessionStorage`, 1 result

Searched for regex `password|secret|api[_-]?key|token|credential`, 20 results

Searched for regex `role\s*===|role\s*==|isAdmin|isDoctor|isPatient`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/BlogPostCarousel.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/components/MedicationSearch.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/components/OOREPWidget.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/RoleAuthContext.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/ProtectedRoute.jsx)

Searched for regex `useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*fetch`, no results

Searched for regex `console\.(log|error|warn)\s*\(`, 30 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/About.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/AppointmentSection.jsx#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/Doctors.jsx#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/scripts/setup-admin.mjs)

Searched for regex `eval\(|new Function\(|innerHTML\s*=`, 2 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/AppointmentSection.jsx#150-150), lines 150 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/components/OOREPWidget.jsx#100-100), lines 100 to 200

Searched for regex `use client` (`**/app/**/*.jsx`), 20 results

Searched for regex `useMemo|useCallback`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/appointments/page.jsx#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/appointments/page.jsx#1-1), lines 1 to 200

Searched for regex `process\.env\.(NEXT_PUBLIC|SUPABASE|DATABASE|API|SECRET)`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.client.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/dashboard/page.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/patient/dashboard/page.jsx#1-1), lines 1 to 100

Searched for regex `\.(id|email|phone|address|name)\s*\|\|\s*`, 20 results

Searched for regex `motion\s*\.\s*\w+|framer-motion`, 50 results

Searched for regex `JSON\.parse|JSON\.stringify`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/blog.actions.js#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/admin/blogs/page.jsx#1-1), lines 1 to 100

Audit code quality patterns

Searched for regex `console\.log` (`**/lib/actions/**,app/api/**,app/components/**,components/ui/**`), no results

Searched for regex `TODO|FIXME|HACK|XXX` (`**/lib/actions/**,app/api/**,app/components/**,components/ui/**`), no results

Searched for regex `catch\s*\(\s*\w*\s*\)\s*\{` (`**/lib/actions/**,app/api/**,app/components/**,components/ui/**`), no results

Searched for text `useEffect` (`**/app/components/**,components/ui/**`), no results

Searched for regex `console\.log`, 20 results

Searched for regex `TODO|FIXME|HACK|XXX`, 9 results

Searched for regex `catch\s*\(`, 20 results

Searched for text `useEffect`, 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/components/ui)

Searched for regex `console\.log`, 57 results

Searched for files matching `**/lib/actions/*.js`, 15 matches

Searched for regex `async\s+function|async\s*\(|=>\s*async` (`**/lib/actions/**`), 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/appointment.actions.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#150-150), lines 150 to 350

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory.actions.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/admin.actions.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/quickbill.actions.js#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/credit-note.actions.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/creditnote.actions.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/components/ui/NotificationBell.jsx#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/components/ui/ConfirmModal.jsx#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/AuthContext.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/auth/RoleAuthContext.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/hooks/useInfiniteScroll.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/admin)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/appointments/route.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/login/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/auth/session/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/upload-image/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/AppointmentSection.jsx#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/billing/invoices/%5Bid%5D/pdf/route.js)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/oorep/search/route.js#1-1), lines 1 to 100

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/api/doctor/consultation/%5Bid%5D/route.js#250-250), lines 250 to 350

Searched for regex `catch\s*\(\s*\w*\s*\)\s*\{\s*\}`, no results

Searched for regex `catch\s*\(\s*\w*\s*\)\s*\{\s*(return|\/\/)`, no results

Searched for regex `await\s+\w+\s*\.` (`**/lib/actions/**`), 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/creditnote.actions.js#150-150), lines 150 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/inventory.actions.js#200-200), lines 200 to 400

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/blog.actions.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/ledger.actions.js#1-1), lines 1 to 150

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/ui/ImageUpload.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/components/ui/combobox.jsx)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/components/ui)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/credit-note.actions.js#150-150), lines 150 to 300

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/audit.actions.js#1-1), lines 1 to 150

Searched for text `Promise.all`, 20 results

Searched for regex `^export\s+(async\s+)?function|^export\s+const` (`**/lib/actions/billing.actions.js`), 20 results

Searched for regex `^export\s+(async\s+)?function|^export\s+const` (`**/lib/actions/inventory.actions.js`), 20 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/actions/billing.actions.js#350-350), lines 350 to 700

Searched for text `return null`, 20 results

Searched for regex `\.then\s*\(\s*\(`, no results

Searched for regex `setTimeout|setInterval`, 18 results

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/appointments/page.jsx#30-30), lines 30 to 80

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/blog/page.jsx#10-10), lines 10 to 80

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/app/doctor/components/MedicationSearch.jsx#40-40), lines 40 to 100

Now let me check the database migrations and middleware implementation to complete the audit: 

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/package.json)

Searched for files matching `**/middleware.js`, no matches

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/next.config.mjs)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations)

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/lib/supabase.config.js#1-1), lines 1 to 50

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/001_healthcare_schema.sql#1-1), lines 1 to 200

Read [](file:///c%3A/Users/nithi/Desktop/Projects/abel-wellness/supabase/migrations/001_healthcare_schema.sql#200-200), lines 200 to 341

Now I have gathered comprehensive information. Let me compile the complete audit report.

---

# 🔒 COMPLETE DEEP AUDIT REPORT: ABEL WELLNESS HEALTHCARE PLATFORM

## Executive Summary

This healthcare management system has **critical security vulnerabilities** that **must be fixed before production deployment**. The codebase handles sensitive medical and financial data but lacks fundamental security controls.

---

## 1️⃣ 🚨 CRITICAL ISSUES (Must Fix Before Production)

### CRIT-001: Completely Open RLS Policies - All Data Exposed
**File:** 001_healthcare_schema.sql
**Severity:** 🔴 CRITICAL

All Row Level Security policies are set to `USING (true)`:
```sql
CREATE POLICY "Service role can do all on users" ON users
    FOR ALL USING (true);
-- Same for: doctors, pharmacists, otp_codes, medical_records, prescriptions, notifications, user_sessions
```

**What Can Break:** 
- Any authenticated user can access ALL patient medical records
- Complete HIPAA violation - patient data leakage
- Cross-patient data exposure
- Patient A can read Patient B's prescriptions, diagnoses, and personal information

**Fix:**
```sql
-- Replace with proper RLS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can view their patients" ON medical_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = medical_records.appointment_id 
            AND appointments.doctor_id = (SELECT id FROM doctors WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Patients can view own records" ON medical_records
    FOR SELECT USING (patient_id = auth.uid());
```

---

### CRIT-002: Unauthenticated Blog API - Anyone Can Create/Delete Posts
**File:** route.js
**Severity:** 🔴 CRITICAL

```javascript
export async function POST(request) {
  try {
    const data = await request.json();
    const newBlog = await createBlog(data);  // NO AUTH CHECK
    return NextResponse.json(newBlog);
  }
}

export async function DELETE(request) {
  try {
    const blogId = searchParams.get("id");
    const result = await deleteBlog(blogId);  // NO AUTH CHECK
    return NextResponse.json(result);
  }
}
```

**What Can Break:**
- Anyone can inject malicious content into your blog
- XSS attacks through blog content (combined with CRIT-003)
- Complete defacement of your public website
- SEO poisoning

**Fix:**
```javascript
export async function POST(request) {
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of code
}
```

---

### CRIT-003: XSS Vulnerability in Blog Content
**File:** [app/blog/[slug]/page.jsx](app/blog/[slug]/page.jsx#L109)
**Severity:** 🔴 CRITICAL

```jsx
<article
  className="prose prose-lg max-w-none"
  dangerouslySetInnerHTML={{ __html: blog.content }}  // UNSANITIZED HTML
/>
```

**What Can Break:**
- Stored XSS attacks
- Session hijacking via stolen cookies
- Credential theft
- Malware distribution through your site

**Fix:**
```bash
npm install dompurify
```
```jsx
import DOMPurify from 'dompurify';

<article
  className="prose prose-lg max-w-none"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
/>
```

---

### CRIT-004: Unauthenticated File Upload
**File:** route.js
**Severity:** 🔴 CRITICAL

```javascript
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    // NO AUTHENTICATION
    // NO FILE TYPE VALIDATION
    // NO SIZE LIMIT
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BLOG_IMAGES)
      .upload(fileName, buffer, { contentType: file.type });
```

**What Can Break:**
- Upload of malicious files (web shells, malware)
- Storage exhaustion attacks
- XSS via SVG uploads
- Server compromise

**Fix:**
```javascript
export async function POST(request) {
  // 1. Authentication
  const admin = await verifyAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  // 2. File type whitelist
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // 3. Size limit (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }
  
  // 4. Validate magic bytes match content type
  // ... continue
}
```

---

### CRIT-005: Unauthenticated Billing APIs - Financial Data Exposed
**Files:**
- route.js
- route.js
- route.js

**Severity:** 🔴 CRITICAL

```javascript
// quick-bill/route.js
export async function POST(request) {
  try {
    const data = await request.json();
    const result = await createQuickBill(data);  // NO AUTH - Creates invoices!
```

**What Can Break:**
- Fraudulent invoice creation
- Unauthorized access to patient billing history
- Financial data breach
- Compliance violations (HIPAA, PCI)

---

### CRIT-006: Environment Variables Exposed via Debug Endpoints
**Files:**
- route.js - Exposes config
- page.jsx - Displays env vars
- page.jsx - Contains hardcoded credentials
- page.jsx - Shows Supabase URL

**Severity:** 🔴 CRITICAL

```javascript
// app/api/test-env/route.js
export async function GET() {
  return NextResponse.json({
    endpoint: process.env.NEXT_PUBLIC_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    bucketId: process.env.STORAGE_BUCKET_ID,
    databaseId: process.env.DATABASE_ID,
  });
}
```

**What Can Break:**
- Infrastructure reconnaissance by attackers
- Targeting of specific services
- Complete security architecture exposure

**Fix:** DELETE these files entirely before production.

---

### CRIT-007: Hardcoded Admin Credentials
**File:** setup-admin.mjs
**Severity:** 🔴 CRITICAL

```javascript
const adminEmail = process.env.ADMIN_EMAIL || "abelwhcc@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Abel2001";
```

**File:** page.jsx
```javascript
const session = await adminLogin("abelwhcc@gmail.com", "Abel2001");
```

**What Can Break:**
- Default admin account can be compromised
- Complete system takeover
- All patient data accessible

**Fix:** Remove all hardcoded credentials. Fail if env vars not set.

---

### CRIT-008: Race Condition in Payment Processing - Double Charge Risk
**File:** billing.actions.js
**Severity:** 🔴 CRITICAL

```javascript
// Gap between check and insert allows race condition
const amountDue = invoice.total_amount - invoice.amount_paid;
const paymentAmount = parseFloat(paymentData.amount);

if (paymentAmount > amountDue) {
  return { success: false, error: `Payment amount exceeds amount due` };
}

// RACE CONDITION WINDOW - Another request could insert payment here!
const { data: payment, error: paymentError } = await supabase
  .from(BILLING_TABLES.PAYMENTS)
  .insert({...})
```

**What Can Break:**
- Double charging customers
- Financial inconsistencies
- Refund disputes

**Fix:** Use database-level locking or optimistic concurrency control.

---

### CRIT-009: No Double-Booking Detection in Appointments
**File:** app/api/appointments/public/route.js
**Severity:** 🔴 CRITICAL

```javascript
const { data: newAppointment, error } = await supabaseAdmin
  .from(TABLES.APPOINTMENTS)
  .insert(appointmentData)  // NO CONFLICT CHECK!
  .select()
  .single();
```

**What Can Break:**
- Multiple patients booked at same time slot
- Doctor scheduling chaos
- Patient complaints and trust loss

**Fix:**
```sql
-- Add unique constraint
CREATE UNIQUE INDEX idx_unique_appointment_slot 
ON appointments (doctor_id, date, time) 
WHERE status IN ('pending', 'approved');
```

---

### CRIT-010: Invoice Number Race Condition - Duplicate Invoices
**File:** billing.actions.js
**Severity:** 🔴 CRITICAL

```javascript
// Two concurrent requests can generate same invoice number
const { data: lastInvoice } = await supabase
  .from(BILLING_TABLES.INVOICES)
  .select("invoice_number")
  .order("created_at", { ascending: false })
  .limit(1)
  .single();

nextNum = parseInt(match[1], 10) + 1;  // RACE CONDITION!
return `${prefix}-${String(nextNum).padStart(6, "0")}`;
```

**Fix:** Use PostgreSQL sequences:
```sql
CREATE SEQUENCE invoice_number_seq START 1001;
-- Use: SELECT nextval('invoice_number_seq')
```

---

## 2️⃣ ⚠️ HIGH PRIORITY ISSUES

### HIGH-001: No Middleware for Route Protection
**Issue:** No `middleware.js` file exists. Each route must implement its own auth checks, leading to inconsistencies.

**Evidence:** Some routes have auth, others don't (blogs, billing, file upload).

**Fix:** Create centralized middleware:
```javascript
// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const pathname = request.nextUrl.pathname;

  const protectedPatterns = [
    '/api/admin',
    '/api/billing',
    '/api/doctor',
    '/api/patient',
    '/api/upload-image'
  ];

  const isProtected = protectedPatterns.some(p => pathname.startsWith(p));
  
  if (isProtected && !sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
```

---

### HIGH-002: Inconsistent Session Validation
**Files:** Multiple API routes check sessions differently

**Admin check (MISSING is_active):**
```javascript
// app/api/admin/appointments/route.js
const { data: session } = await supabaseAdmin
  .from(TABLES.USER_SESSIONS)
  .select("*, user:users(*)")
  .eq("session_token", sessionToken)
  .single();  // Missing: .eq("is_active", true)
```

**Doctor check (CORRECT):**
```javascript
// app/api/doctor/consultation/[id]/route.js
const { data: session } = await supabaseAdmin
  .from(TABLES.USER_SESSIONS)
  .eq("session_token", sessionToken)
  .eq("is_active", true)  // ✅ Has this
  .gt("expires_at", new Date().toISOString())
  .single();
```

---

### HIGH-003: N+1 Query Patterns - Performance Disaster
**File:** route.js

```javascript
const usersWithRoleData = await Promise.all(
  users.map(async (user) => {
    if (user.role === ROLES.DOCTOR) {
      const { data } = await supabaseAdmin
        .from(TABLES.DOCTORS)
        .select("*")
        .eq("user_id", user.id)
        .single();  // N QUERIES FOR N USERS!
    }
```

**Impact:** 100 users = 100+ database queries. Page will timeout.

**Fix:** Use JOINs:
```javascript
const { data: users } = await supabaseAdmin
  .from(TABLES.USERS)
  .select(`
    *,
    doctor:doctors(*),
    pharmacist:pharmacists(*)
  `)
  .range(offset, offset + limit - 1);
```

---

### HIGH-004: No Transaction Atomicity - Data Corruption Risk
**File:** quickbill.actions.js

```javascript
// Create invoice
const { data: invoice, error: invoiceError } = await supabase
  .from(BILLING_TABLES.INVOICES)
  .insert({...})

// Insert invoice items  
const { error: itemsError } = await supabase
  .from(BILLING_TABLES.INVOICE_ITEMS)
  .insert(itemsToInsert);

if (itemsError) {
  // Rollback invoice - THIS IS NOT ATOMIC!
  await supabase.from(BILLING_TABLES.INVOICES).delete().eq("id", invoice.id);
```

**What Can Break:**
- Invoice exists without items
- Payment recorded without invoice
- Ledger entries orphaned

**Fix:** Use Supabase RPC with transaction or implement saga pattern.

---

### HIGH-005: Stock Deduction Race Condition
**File:** quickbill.actions.js

```javascript
const currentStock = parseInt(inventoryItem.current_stock) || 0;
// Another request could read same value here!
const newStock = currentStock - quantityToDeduct;

const { error } = await supabase
  .from("inventory_items")
  .update({ current_stock: newStock })  // Overwrites concurrent update!
```

**What Can Break:**
- Negative inventory
- Overselling products
- Financial loss

**Fix:**
```sql
-- Atomic update
UPDATE inventory_items 
SET current_stock = current_stock - $quantity 
WHERE id = $id AND current_stock >= $quantity
RETURNING *;
```

---

### HIGH-006: Weak OTP Generation
**File:** route.js

```javascript
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**Risk:** `Math.random()` is not cryptographically secure.

**Fix:**
```javascript
import crypto from 'crypto';
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}
```

---

### HIGH-007: No Rate Limiting - Brute Force Vulnerability
**Affected Routes:**
- All `/api/auth/*` endpoints
- All billing endpoints
- Appointment booking

**Risk:**
- Brute force password attacks
- OTP enumeration
- API abuse

**Fix:** Implement rate limiting:
```javascript
import { Ratelimit } from "@upstash/ratelimit";

const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// In API route
const { success } = await rateLimiter.limit(request.ip);
if (!success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

---

### HIGH-008: No Input Validation with Schema Library
**File:** app/api/appointments/public/route.js

```javascript
// Only presence check, no format validation
const requiredFields = ["firstName", "lastName", "email", "phoneNumber", "schedule"];
for (const field of requiredFields) {
  if (!data[field]) {
    return NextResponse.json({ error: `${field} is required` }, { status: 400 });
  }
}
// No email format validation
// No phone format validation
// No date validation (past dates accepted!)
```

**Fix:**
```javascript
import { z } from 'zod';

const appointmentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  schedule: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    "Appointment must be in the future"
  ),
});
```

---

### HIGH-009: Missing Password Strength Validation
**File:** route.js

```javascript
const { email, password, name, phone, role } = data;
if (!email || !password || !name || !role) {  // Only presence, no strength
```

**Fix:**
```javascript
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
if (!PASSWORD_REGEX.test(password)) {
  return NextResponse.json({
    error: "Password must be 12+ chars with uppercase, lowercase, number, and special character"
  }, { status: 400 });
}
```

---

### HIGH-010: Invalid Appointment State Transitions
**File:** route.js

```javascript
const updateFields = { ...otherData };
if (status) {
  updateFields.status = status;  // ANY status allowed!
}
```

**Risk:** Can transition `completed` → `pending`, `cancelled` → `approved`

**Fix:** Implement state machine validation.

---

## 3️⃣ 🟡 MEDIUM PRIORITY ISSUES

### MED-001: Empty next.config.mjs - No Security Headers
**File:** next.config.mjs

```javascript
const nextConfig = {};
export default nextConfig;
```

**Missing:**
- CSP headers
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

**Fix:**
```javascript
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    }];
  },
};
```

---

### MED-002: Error Messages Leak Internal Details
**Multiple Files:**

```javascript
catch (error) {
  console.error("Error:", error);
  return NextResponse.json({ error: error.message }, { status: 500 });
  // ^^^ Exposes database schema, internal paths
}
```

**Fix:** Return generic errors to client, log details server-side.

---

### MED-003: Console Logging in Production
**Count:** 60+ `console.log`/`console.error` statements across codebase

**Files with excessive logging:**
- billing.actions.js
- inventory.actions.js
- Various API routes

**Fix:** Use proper logging library (winston, pino) with log levels.

---

### MED-004: Duplicate Credit Note Files
**Files:**
- creditnote.actions.js
- credit-note.actions.js

Both have `createCreditNote` with different signatures. Confusion and bugs guaranteed.

---

### MED-005: Package Name Mismatch
**File:** package.json

```json
"name": "framer"  // Should be "abel-wellness"
```

---

### MED-006: Missing .env.example
**Issue:** No documentation of required environment variables.

---

### MED-007: Session Fixation Risk
**File:** route.js

Old sessions not invalidated on new login.

**Fix:**
```javascript
// Before creating new session
await supabaseAdmin
  .from(TABLES.USER_SESSIONS)
  .delete()
  .eq("user_id", user.id);
```

---

### MED-008: Floating Point for Money
**Files:** Multiple billing files use `parseFloat`

```javascript
const paymentAmount = parseFloat(paymentData.amount);  // 100.10 → 100.09999999
```

**Fix:** Use integer cents or Decimal.js library.

---

### MED-009: Missing Composite Indexes
**File:** 001_healthcare_schema.sql

Missing indexes for common queries:
- `(patient_id, status)` on appointments
- `(user_id, is_read)` on notifications
- `(doctor_id, date)` on appointments

---

### MED-010: Client-Side Only Authorization (Race Condition on Page Load)
**Files:** All dashboard pages

```javascript
useEffect(() => {
  if (user.role !== "admin") {
    router.push("/");  // User sees content briefly before redirect
  }
}, [user]);
```

**Fix:** Use server-side route protection via middleware.

---

## 4️⃣ 🟢 LOW PRIORITY IMPROVEMENTS

### LOW-001: Duplicate Password Hashing Libraries
**File:** package.json

```json
"bcrypt": "^6.0.0",
"bcryptjs": "^3.0.3"
```

Pick one. `bcryptjs` for cross-platform, `bcrypt` for native performance.

---

### LOW-002: No Error Boundaries in React
Missing React Error Boundaries around major sections.

---

### LOW-003: Heavy Bundle Size
`framer-motion` adds ~40KB. Consider `@formkit/auto-animate` for simpler animations.

---

### LOW-004: Missing Soft Delete
Hard deletes lose audit trail. Add `deleted_at` columns.

---

### LOW-005: OTP Codes Not Cleaned Up
No scheduled job to purge expired OTPs.

---

## 5️⃣ 🏗️ ARCHITECTURE REFACTOR SUGGESTIONS

### ARCH-001: Split God Action Files
Current state:
- `billing.actions.js` - 1,358 lines, 25+ functions
- `inventory.actions.js` - 1,636 lines, 40+ functions

Suggested split:
```
lib/actions/
  billing/
    invoices.actions.js
    payments.actions.js
    refunds.actions.js
    ledger.actions.js
  inventory/
    items.actions.js
    stock.actions.js
    reports.actions.js
```

---

### ARCH-002: Create Centralized Auth Module
Current: Auth checks scattered across routes.

Proposed:
```javascript
// lib/auth/middleware.js
export const requireAuth = (roles) => async (request) => {
  const session = await getSession(request);
  if (!session) return { error: "Unauthorized", status: 401 };
  if (roles && !roles.includes(session.user.role)) {
    return { error: "Forbidden", status: 403 };
  }
  return { user: session.user };
};

// Usage
const authResult = await requireAuth(['admin'])(request);
if (authResult.error) return NextResponse.json(authResult);
```

---

### ARCH-003: Implement Domain Layer
Current: Business logic mixed in API routes.

Proposed:
```
lib/
  domain/
    billing/
      BillingService.js      // Business logic
      BillingRepository.js   // Database access
      BillingValidator.js    // Validation rules
    appointments/
      AppointmentService.js
      AppointmentRepository.js
```

---

### ARCH-004: Add TypeScript
This is a healthcare system handling financial and medical data. Type safety is essential.

---

## 6️⃣ 🚀 PERFORMANCE OPTIMIZATIONS

| Issue | File | Impact | Fix |
|-------|------|--------|-----|
| N+1 queries | admin/users/route.js | Page timeouts | Use JOINs |
| N+1 queries | admin/patients/route.js | Slow loading | Use JOINs |
| Missing indexes | migrations/*.sql | Slow queries | Add composite indexes |
| No caching | All routes | Repeated DB hits | Add Redis cache |
| No pagination limit | Multiple | Memory exhaustion | Enforce max 100 |
| Heavy animations | Hero.jsx, etc. | Large bundle | Code split |

---

## 7️⃣ 🔐 SECURITY HARDENING CHECKLIST

| Item | Status | Action Required |
|------|--------|-----------------|
| RLS Policies | ❌ BROKEN | Implement proper policies |
| API Authentication | ❌ INCONSISTENT | Add middleware |
| Input Validation | ❌ MISSING | Add Zod schemas |
| File Upload Security | ❌ NONE | Add validation |
| Rate Limiting | ❌ NONE | Add Upstash |
| CSRF Protection | ⚠️ PARTIAL | Verify SameSite cookies |
| XSS Prevention | ❌ VULNERABLE | Add DOMPurify |
| SQL Injection | ⚠️ LOW RISK | Audit search params |
| Password Policy | ❌ WEAK | Enforce complexity |
| Session Management | ⚠️ INCONSISTENT | Standardize |
| Security Headers | ❌ NONE | Add to next.config |
| Debug Endpoints | ❌ EXPOSED | DELETE before prod |
| Hardcoded Secrets | ❌ PRESENT | Remove |
| Audit Logging | ⚠️ PARTIAL | Make mandatory |

---

## 8️⃣ 📐 CODE STRUCTURE IMPROVEMENTS

1. **Create shared utilities:**
```javascript
// lib/utils/api-response.js
export const success = (data) => NextResponse.json({ success: true, ...data });
export const error = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
```

2. **Centralize validation:**
```javascript
// lib/validation/schemas.js
export const appointmentSchema = z.object({...});
export const userSchema = z.object({...});
export const invoiceSchema = z.object({...});
```

3. **Create repository pattern:**
```javascript
// lib/repositories/BaseRepository.js
class BaseRepository {
  async findById(id) {...}
  async findMany(filters) {...}
  async create(data) {...}
  async update(id, data) {...}
}
```

---

## 9️⃣ 🧠 LONG TERM SCALE RECOMMENDATIONS

### For 1M+ Users:

1. **Database:**
   - Add read replicas
   - Implement connection pooling (PgBouncer)
   - Partition large tables (appointments by date)
   - Add full-text search index for patient search

2. **Caching:**
   - Redis for session storage
   - Cache doctor availability
   - Cache billing settings

3. **Background Jobs:**
   - Queue for email sending
   - Queue for inventory alerts
   - Queue for report generation

4. **Observability:**
   - Add APM (Datadog, New Relic)
   - Structured logging (JSON)
   - Error tracking (Sentry)
   - Health check endpoints

5. **Infrastructure:**
   - CDN for static assets
   - Edge caching for public pages
   - Auto-scaling configuration
   - Multi-region deployment

---

## Summary of Required Actions Before Production

### IMMEDIATE (Week 1):
1. ❌ DELETE debug endpoints (`/test-env`, `/debug-env`, `/test-setup`, `/diagnostic`)
2. ❌ Remove hardcoded credentials
3. ❌ Add authentication to blogs and billing APIs
4. ❌ Add DOMPurify to blog content
5. ❌ Add file upload validation
6. ❌ Create middleware.js for route protection

### CRITICAL (Week 2):
7. ❌ Fix RLS policies (complete rewrite)
8. ❌ Add database transactions for billing
9. ❌ Fix race conditions (use database locks)
10. ❌ Add input validation (Zod)
11. ❌ Implement rate limiting

### HIGH PRIORITY (Week 3-4):
12. Add security headers
13. Fix N+1 queries
14. Standardize error handling
15. Add TypeScript
16. Implement proper logging

---

**This codebase is NOT production-ready.** The security issues are severe enough that deploying this system would expose patient medical records, allow financial fraud, and violate healthcare compliance regulations (HIPAA, GDPR).