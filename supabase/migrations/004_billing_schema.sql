-- =============================================
-- BILLING SCHEMA MIGRATION
-- =============================================
-- This migration creates the billing system tables
-- for invoice management, payments, and billing settings
-- =============================================

-- =============================================
-- BILLING SETTINGS TABLE
-- =============================================
-- Stores configurable billing settings like tax rates,
-- payment methods, invoice prefixes, etc.

CREATE TABLE IF NOT EXISTS billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default billing settings
INSERT INTO billing_settings (setting_key, setting_value, category, description) VALUES
    ('invoice_prefix', '"INV"', 'invoice', 'Prefix for invoice numbers'),
    ('invoice_start_number', '1001', 'invoice', 'Starting invoice number'),
    ('default_tax_rate', '18', 'tax', 'Default tax rate percentage (GST)'),
    ('tax_enabled', 'true', 'tax', 'Whether tax is enabled on invoices'),
    ('currency', '"INR"', 'general', 'Default currency code'),
    ('currency_symbol', '"₹"', 'general', 'Currency symbol for display'),
    ('payment_due_days', '7', 'invoice', 'Default number of days until payment is due'),
    ('payment_methods', '["cash", "card", "upi", "bank_transfer", "online"]', 'payment', 'Available payment methods'),
    ('online_payment_enabled', 'false', 'payment', 'Whether online payment gateway is enabled'),
    ('online_payment_provider', 'null', 'payment', 'Online payment provider (razorpay, stripe, etc.)'),
    ('clinic_name', '"Abel Wellness Clinic"', 'clinic', 'Clinic name for invoices'),
    ('clinic_address', '"Your Clinic Address"', 'clinic', 'Clinic address for invoices'),
    ('clinic_phone', '"+91-XXXXXXXXXX"', 'clinic', 'Clinic phone for invoices'),
    ('clinic_email', '"info@abelwellness.com"', 'clinic', 'Clinic email for invoices'),
    ('clinic_gstin', 'null', 'clinic', 'Clinic GSTIN for tax invoices')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- INVOICES TABLE
-- =============================================
-- Main invoice table for patient billing

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Patient and appointment references
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Invoice status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending', 'partial', 'paid', 'cancelled', 'refunded')),
    
    -- Financial details
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    discount_reason TEXT,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    amount_due DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    
    -- Additional info
    notes TEXT,
    internal_notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invoices
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_appointment ON invoices(appointment_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- =============================================
-- INVOICE ITEMS TABLE
-- =============================================
-- Individual line items on an invoice

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item type classification
    item_type VARCHAR(30) NOT NULL 
        CHECK (item_type IN ('consultation', 'medication', 'supply', 'procedure', 'lab_test', 'service', 'other')),
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'unit',
    unit_price DECIMAL(12, 2) NOT NULL,
    
    -- Discounts and tax per item
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Total for this line item
    total DECIMAL(12, 2) NOT NULL,
    
    -- Reference to source entity (for traceability)
    reference_type VARCHAR(30),
    reference_id UUID,
    
    -- Order of items on invoice
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invoice items
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_type ON invoice_items(item_type);
CREATE INDEX idx_invoice_items_reference ON invoice_items(reference_type, reference_id);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
-- Track all payments against invoices (supports split payments)

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Invoice and patient references
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Payment details
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL 
        CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'online', 'cheque', 'other')),
    
    -- Payment status
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    
    -- Transaction details
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Online payment specific fields (for future Razorpay/Stripe integration)
    payment_gateway VARCHAR(50),
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    gateway_signature VARCHAR(255),
    gateway_response JSONB,
    
    -- Additional info
    notes TEXT,
    
    -- Audit fields
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_gateway ON payments(payment_gateway) WHERE payment_gateway IS NOT NULL;

-- =============================================
-- PAYMENT REFUNDS TABLE
-- =============================================
-- Track refunds for payments

CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    
    -- Refund details
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed')),
    
    -- Gateway refund details (for online payments)
    gateway_refund_id VARCHAR(100),
    gateway_response JSONB,
    
    -- Audit fields
    refunded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    refunded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for refunds
CREATE INDEX idx_refunds_payment ON payment_refunds(payment_id);
CREATE INDEX idx_refunds_invoice ON payment_refunds(invoice_id);

-- =============================================
-- INVOICE SEQUENCE FUNCTION
-- =============================================
-- Function to generate unique invoice numbers

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    invoice_num TEXT;
BEGIN
    -- Get prefix from settings
    SELECT COALESCE(setting_value::TEXT, 'INV')::TEXT 
    INTO prefix 
    FROM billing_settings 
    WHERE setting_key = 'invoice_prefix';
    
    -- Remove quotes from JSON string
    prefix := TRIM(BOTH '"' FROM prefix);
    
    -- Get next number
    SELECT COALESCE(MAX(
        CAST(
            REGEXP_REPLACE(invoice_number, '^[A-Z]+-', '') AS INTEGER
        )
    ), 1000) + 1
    INTO next_num
    FROM invoices
    WHERE invoice_number ~ ('^' || prefix || '-[0-9]+$');
    
    invoice_num := prefix || '-' || LPAD(next_num::TEXT, 6, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UPDATE INVOICE TOTALS FUNCTION
-- =============================================
-- Automatically recalculate invoice totals when items change

CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    inv_subtotal DECIMAL(12, 2);
    inv_tax_amount DECIMAL(12, 2);
    inv_total DECIMAL(12, 2);
    inv_discount DECIMAL(12, 2);
BEGIN
    -- Calculate totals from invoice items
    SELECT 
        COALESCE(SUM(unit_price * quantity), 0),
        COALESCE(SUM(tax_amount), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(total), 0)
    INTO inv_subtotal, inv_tax_amount, inv_discount, inv_total
    FROM invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Update the invoice
    UPDATE invoices
    SET 
        subtotal = inv_subtotal,
        tax_amount = inv_tax_amount,
        discount_amount = inv_discount,
        total_amount = inv_total,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice totals
DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON invoice_items;
CREATE TRIGGER trigger_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- =============================================
-- UPDATE INVOICE PAYMENT STATUS FUNCTION
-- =============================================
-- Automatically update invoice status when payment is made

CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(12, 2);
    invoice_total DECIMAL(12, 2);
BEGIN
    -- Only process completed payments
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;
    
    -- Calculate total paid for this invoice
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM payments
    WHERE invoice_id = NEW.invoice_id AND status = 'completed';
    
    -- Get invoice total
    SELECT total_amount INTO invoice_total
    FROM invoices WHERE id = NEW.invoice_id;
    
    -- Update invoice
    UPDATE invoices
    SET 
        amount_paid = total_paid,
        status = CASE
            WHEN total_paid >= invoice_total THEN 'paid'
            WHEN total_paid > 0 THEN 'partial'
            ELSE status
        END,
        paid_at = CASE
            WHEN total_paid >= invoice_total THEN NOW()
            ELSE paid_at
        END,
        updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment status updates
DROP TRIGGER IF EXISTS trigger_update_invoice_payment ON payments;
CREATE TRIGGER trigger_update_invoice_payment
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_payment_status();

-- =============================================
-- UPDATE TIMESTAMPS TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_billing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS trigger_invoices_timestamp ON invoices;
CREATE TRIGGER trigger_invoices_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_billing_timestamp();

DROP TRIGGER IF EXISTS trigger_payments_timestamp ON payments;
CREATE TRIGGER trigger_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_billing_timestamp();

DROP TRIGGER IF EXISTS trigger_billing_settings_timestamp ON billing_settings;
CREATE TRIGGER trigger_billing_settings_timestamp
BEFORE UPDATE ON billing_settings
FOR EACH ROW
EXECUTE FUNCTION update_billing_timestamp();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Admins can manage all invoices" ON invoices
    FOR ALL USING (true);

CREATE POLICY "Doctors can view invoices for their appointments" ON invoices
    FOR SELECT USING (
        appointment_id IN (
            SELECT id FROM appointments WHERE doctor_id IN (
                SELECT id FROM doctors WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Patients can view their own invoices" ON invoices
    FOR SELECT USING (patient_id = auth.uid());

-- Invoice items policies
CREATE POLICY "Admins can manage all invoice items" ON invoice_items
    FOR ALL USING (true);

CREATE POLICY "Users can view items of accessible invoices" ON invoice_items
    FOR SELECT USING (
        invoice_id IN (SELECT id FROM invoices WHERE patient_id = auth.uid())
        OR invoice_id IN (
            SELECT id FROM invoices WHERE appointment_id IN (
                SELECT id FROM appointments WHERE doctor_id IN (
                    SELECT id FROM doctors WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Payments policies
CREATE POLICY "Admins can manage all payments" ON payments
    FOR ALL USING (true);

CREATE POLICY "Patients can view their own payments" ON payments
    FOR SELECT USING (patient_id = auth.uid());

-- Refunds policies
CREATE POLICY "Admins can manage all refunds" ON payment_refunds
    FOR ALL USING (true);

-- Settings policies (admin only)
CREATE POLICY "Admins can manage billing settings" ON billing_settings
    FOR ALL USING (true);

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- Invoice summary view
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.status,
    i.invoice_date,
    i.due_date,
    i.total_amount,
    i.amount_paid,
    i.amount_due,
    u.name as patient_name,
    u.email as patient_email,
    u.phone as patient_phone,
    a.date as appointment_date,
    d.specialization as doctor_specialization,
    du.name as doctor_name
FROM invoices i
LEFT JOIN users u ON i.patient_id = u.id
LEFT JOIN appointments a ON i.appointment_id = a.id
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN users du ON d.user_id = du.id;

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_summary AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    p.payment_method,
    COUNT(*) as transaction_count,
    SUM(p.amount) as total_amount
FROM payments p
WHERE p.status = 'completed'
GROUP BY DATE_TRUNC('month', p.payment_date), p.payment_method
ORDER BY month DESC, payment_method;

-- Outstanding invoices view
CREATE OR REPLACE VIEW outstanding_invoices AS
SELECT 
    i.*,
    u.name as patient_name,
    u.email as patient_email,
    u.phone as patient_phone,
    CURRENT_DATE - i.due_date as days_overdue
FROM invoices i
LEFT JOIN users u ON i.patient_id = u.id
WHERE i.status IN ('pending', 'partial')
ORDER BY i.due_date ASC;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoice_items TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payment_refunds TO authenticated;
GRANT ALL ON billing_settings TO authenticated;
GRANT SELECT ON invoice_summary TO authenticated;
GRANT SELECT ON revenue_summary TO authenticated;
GRANT SELECT ON outstanding_invoices TO authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
