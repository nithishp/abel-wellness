import { z } from "zod";

// ============================================
// Common Validation Patterns
// ============================================

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

// Phone validation (Indian format or international)
// Accepts digits, optional leading +, spaces, dashes, and parentheses
export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s\-()]/g, "")) // Strip spaces, dashes, parentheses
  .refine((val) => val.length >= 10, "Phone number must be at least 10 digits")
  .refine((val) => val.length <= 15, "Phone number must be at most 15 digits")
  .refine((val) => /^\+?[0-9]+$/.test(val), "Invalid phone number format");

// Name validation (letters, spaces, hyphens, apostrophes)
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  );

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// Positive number
export const positiveNumberSchema = z
  .number()
  .positive("Value must be positive");

// Non-negative number
export const nonNegativeNumberSchema = z
  .number()
  .nonnegative("Value cannot be negative");

// Future date validation
export const futureDateSchema = z
  .string()
  .refine((date) => new Date(date) > new Date(), "Date must be in the future");

// ============================================
// Password Validation
// ============================================
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[@$!%*?&]/,
    "Password must contain at least one special character (@$!%*?&)",
  );

// ============================================
// Appointment Schemas
// ============================================
export const publicAppointmentSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema,
  schedule: futureDateSchema,
  age: z.coerce.number().int().min(0).max(150).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  message: z
    .string()
    .max(1000, "Message must be less than 1000 characters")
    .optional(),
  reasonForVisit: z.string().max(500).optional(),
});

export const patientAppointmentSchema = z.object({
  doctor_id: uuidSchema.optional(),
  date: futureDateSchema,
  time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  service: z.string().max(100).optional(),
  reason_for_visit: z.string().max(500).optional(),
  message: z.string().max(1000).optional(),
});

// ============================================
// User Schemas
// ============================================
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
  role: z.enum(["patient", "admin", "doctor", "pharmacist"]),
  // Role-specific fields
  specialization: z.string().max(255).optional(),
  qualification: z.string().max(500).optional(),
  experience_years: z.number().int().min(0).max(70).optional(),
  consultation_fee: nonNegativeNumberSchema.optional(),
  license_number: z.string().max(100).optional(),
});

export const updateUserSchema = z.object({
  full_name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  age: z.coerce.number().int().min(0).max(150).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Billing Schemas
// ============================================
export const quickBillSchema = z.object({
  patientId: uuidSchema,
  doctorId: uuidSchema.optional(),
  consultationFee: nonNegativeNumberSchema.optional(),
  items: z
    .array(
      z.object({
        inventory_item_id: uuidSchema,
        quantity: z.number().int().positive("Quantity must be at least 1"),
        unit_price: nonNegativeNumberSchema,
        description: z.string().max(500).optional(),
      }),
    )
    .optional(),
  paymentMethod: z
    .enum(["cash", "card", "upi", "bank_transfer", "online", "cheque", "other"])
    .optional(),
  paymentAmount: nonNegativeNumberSchema.optional(),
  discount_amount: nonNegativeNumberSchema.optional(),
  discount_reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const paymentSchema = z.object({
  invoice_id: uuidSchema,
  patient_id: uuidSchema,
  amount: z.number().positive("Payment amount must be positive"),
  payment_method: z.enum([
    "cash",
    "card",
    "upi",
    "bank_transfer",
    "online",
    "cheque",
    "other",
  ]),
  transaction_reference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export const refundSchema = z.object({
  payment_id: uuidSchema,
  amount: z.number().positive("Refund amount must be positive"),
  reason: z.string().min(1, "Refund reason is required").max(500),
});

// ============================================
// Blog Schemas
// ============================================
export const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
  author: z.string().max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// ============================================
// Inventory Schemas
// ============================================
export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  generic_name: z.string().max(255).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  category_id: uuidSchema.optional(),
  supplier_id: uuidSchema.optional(),
  item_type: z.enum(["medication", "supply", "equipment"]),
  dosage_form: z.string().max(100).optional(),
  strength: z.string().max(100).optional(),
  manufacturer: z.string().max(255).optional(),
  current_stock: z.number().int().nonnegative().optional(),
  minimum_stock: z.number().int().nonnegative().optional(),
  maximum_stock: z.number().int().nonnegative().optional(),
  reorder_level: z.number().int().nonnegative().optional(),
  unit_of_measure: z.string().max(50).optional(),
  cost_price: nonNegativeNumberSchema.optional(),
  selling_price: nonNegativeNumberSchema.optional(),
  requires_prescription: z.boolean().optional(),
  is_controlled_substance: z.boolean().optional(),
  storage_conditions: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// OTP Schemas
// ============================================
export const otpSendSchema = z.object({
  email: emailSchema,
});

export const otpVerifySchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

// ============================================
// Login Schema
// ============================================
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// ============================================
// Helper function to validate and parse
// ============================================
export function validateRequest(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return {
      success: false,
      error: "Validation failed",
      details: errors,
    };
  }

  return { success: true, data: result.data };
}
