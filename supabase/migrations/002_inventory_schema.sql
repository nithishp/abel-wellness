-- =============================================
-- INVENTORY MANAGEMENT SYSTEM SCHEMA
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. INVENTORY CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('medication', 'supply', 'equipment')),
    parent_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. INVENTORY SUPPLIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. INVENTORY ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('medication', 'supply', 'equipment')),
    
    -- For medications
    dosage_form VARCHAR(100), -- tablet, capsule, syrup, injection, etc.
    strength VARCHAR(100), -- 500mg, 10ml, etc.
    manufacturer VARCHAR(255),
    
    -- Stock management
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
    maximum_stock INTEGER DEFAULT 1000,
    reorder_level INTEGER DEFAULT 20,
    unit_of_measure VARCHAR(50) DEFAULT 'units', -- units, bottles, boxes, strips, etc.
    
    -- Pricing
    cost_price DECIMAL(10, 2) DEFAULT 0,
    selling_price DECIMAL(10, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    requires_prescription BOOLEAN DEFAULT false,
    is_controlled_substance BOOLEAN DEFAULT false,
    
    -- Storage
    storage_conditions VARCHAR(255), -- Room temperature, Refrigerated, etc.
    
    -- Additional
    notes TEXT,
    image_url VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- =============================================
-- 4. INVENTORY BATCHES TABLE (Lot/Batch Tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    lot_number VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    manufacturing_date DATE,
    expiry_date DATE,
    received_date DATE DEFAULT CURRENT_DATE,
    cost_price DECIMAL(10, 2),
    supplier_id UUID REFERENCES public.inventory_suppliers(id),
    purchase_order_id UUID, -- Will reference purchase_orders table
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'quarantine', 'returned')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    UNIQUE(item_id, batch_number)
);

-- =============================================
-- 5. INVENTORY STOCK MOVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'purchase', 'sale', 'dispensing', 'adjustment_add', 'adjustment_subtract',
        'return_supplier', 'return_customer', 'transfer_in', 'transfer_out',
        'expired', 'damaged', 'opening_stock', 'other'
    )),
    quantity INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    reference_type VARCHAR(50), -- prescription, purchase_order, adjustment, etc.
    reference_id UUID, -- ID of the related record
    reason TEXT,
    notes TEXT,
    performed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. PURCHASE ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.inventory_suppliers(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled'
    )),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    received_date DATE,
    
    -- Totals
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN (
        'unpaid', 'partial', 'paid'
    )),
    payment_terms VARCHAR(100),
    payment_due_date DATE,
    
    -- Shipping
    shipping_address TEXT,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Tracking
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    received_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. PURCHASE ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. INVENTORY ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'overstock'
    )),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Add foreign key to batches for purchase orders
-- =============================================
ALTER TABLE public.inventory_batches 
ADD CONSTRAINT inventory_batches_purchase_order_fkey 
FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Inventory items indexes
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_inventory_items_barcode ON public.inventory_items(barcode);
CREATE INDEX idx_inventory_items_name ON public.inventory_items(name);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category_id);
CREATE INDEX idx_inventory_items_supplier ON public.inventory_items(supplier_id);
CREATE INDEX idx_inventory_items_type ON public.inventory_items(item_type);
CREATE INDEX idx_inventory_items_stock ON public.inventory_items(current_stock);
CREATE INDEX idx_inventory_items_active ON public.inventory_items(is_active);

-- Batches indexes
CREATE INDEX idx_inventory_batches_item ON public.inventory_batches(item_id);
CREATE INDEX idx_inventory_batches_expiry ON public.inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_status ON public.inventory_batches(status);
CREATE INDEX idx_inventory_batches_batch_number ON public.inventory_batches(batch_number);

-- Stock movements indexes
CREATE INDEX idx_stock_movements_item ON public.inventory_stock_movements(item_id);
CREATE INDEX idx_stock_movements_type ON public.inventory_stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON public.inventory_stock_movements(created_at);
CREATE INDEX idx_stock_movements_reference ON public.inventory_stock_movements(reference_type, reference_id);

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON public.purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_number ON public.purchase_orders(order_number);

-- Alerts indexes
CREATE INDEX idx_inventory_alerts_item ON public.inventory_alerts(item_id);
CREATE INDEX idx_inventory_alerts_type ON public.inventory_alerts(alert_type);
CREATE INDEX idx_inventory_alerts_resolved ON public.inventory_alerts(is_resolved);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update item stock after batch changes
CREATE OR REPLACE FUNCTION update_item_stock_from_batches()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.inventory_items
    SET current_stock = (
        SELECT COALESCE(SUM(available_quantity), 0)
        FROM public.inventory_batches
        WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
        AND status = 'active'
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.item_id, OLD.item_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for batch stock updates
DROP TRIGGER IF EXISTS trigger_update_item_stock ON public.inventory_batches;
CREATE TRIGGER trigger_update_item_stock
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_batches
FOR EACH ROW EXECUTE FUNCTION update_item_stock_from_batches();

-- Function to check and create low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
BEGIN
    SELECT * INTO item_record FROM public.inventory_items WHERE id = NEW.id;
    
    -- Check for out of stock
    IF item_record.current_stock = 0 THEN
        INSERT INTO public.inventory_alerts (item_id, alert_type, severity, message)
        VALUES (NEW.id, 'out_of_stock', 'critical', 
            'Item "' || item_record.name || '" is out of stock!')
        ON CONFLICT DO NOTHING;
    -- Check for low stock
    ELSIF item_record.current_stock <= item_record.minimum_stock THEN
        INSERT INTO public.inventory_alerts (item_id, alert_type, severity, message)
        VALUES (NEW.id, 'low_stock', 'high', 
            'Item "' || item_record.name || '" has low stock. Current: ' || 
            item_record.current_stock || ', Minimum: ' || item_record.minimum_stock)
        ON CONFLICT DO NOTHING;
    ELSE
        -- Resolve existing low stock/out of stock alerts
        UPDATE public.inventory_alerts
        SET is_resolved = true, resolved_at = NOW()
        WHERE item_id = NEW.id 
        AND alert_type IN ('low_stock', 'out_of_stock')
        AND is_resolved = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for low stock alerts
DROP TRIGGER IF EXISTS trigger_check_low_stock ON public.inventory_items;
CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF current_stock ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION check_low_stock_alert();

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYMM');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 'PO' || year_month || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM public.purchase_orders
    WHERE order_number LIKE 'PO' || year_month || '-%';
    
    NEW.order_number := 'PO' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating PO numbers
DROP TRIGGER IF EXISTS trigger_generate_po_number ON public.purchase_orders;
CREATE TRIGGER trigger_generate_po_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION generate_po_number();

-- Function to update purchase order totals
CREATE OR REPLACE FUNCTION update_purchase_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.purchase_orders
    SET subtotal = (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM public.purchase_order_items
        WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    ),
    total_amount = subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0) + COALESCE(shipping_cost, 0),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for PO totals
DROP TRIGGER IF EXISTS trigger_update_po_totals ON public.purchase_order_items;
CREATE TRIGGER trigger_update_po_totals
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
FOR EACH ROW EXECUTE FUNCTION update_purchase_order_totals();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all inventory tables
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for admin and pharmacist access
CREATE POLICY "Admin and Pharmacist full access to inventory_categories"
ON public.inventory_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to inventory_suppliers"
ON public.inventory_suppliers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to inventory_items"
ON public.inventory_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to inventory_batches"
ON public.inventory_batches FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to inventory_stock_movements"
ON public.inventory_stock_movements FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to purchase_orders"
ON public.purchase_orders FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to purchase_order_items"
ON public.purchase_order_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

CREATE POLICY "Admin and Pharmacist full access to inventory_alerts"
ON public.inventory_alerts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'pharmacist')
    )
);

-- Doctors can view inventory items (for prescribing)
CREATE POLICY "Doctors can view inventory items"
ON public.inventory_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'doctor'
    )
);

-- =============================================
-- SEED DEFAULT CATEGORIES
-- =============================================
INSERT INTO public.inventory_categories (name, description, type) VALUES
    ('Tablets & Capsules', 'Oral solid dosage forms', 'medication'),
    ('Syrups & Suspensions', 'Oral liquid preparations', 'medication'),
    ('Injections', 'Injectable medications', 'medication'),
    ('Topical', 'Creams, ointments, and lotions', 'medication'),
    ('Drops', 'Eye, ear, and nasal drops', 'medication'),
    ('Homeopathic Remedies', 'Homeopathic medicines', 'medication'),
    ('Surgical Supplies', 'Syringes, needles, sutures', 'supply'),
    ('Wound Care', 'Bandages, dressings, antiseptics', 'supply'),
    ('Protective Equipment', 'Gloves, masks, gowns', 'supply'),
    ('Diagnostic Equipment', 'Stethoscopes, BP monitors, thermometers', 'equipment'),
    ('Treatment Equipment', 'Nebulizers, TENS units', 'equipment'),
    ('Office Equipment', 'Examination tables, scales', 'equipment')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT ALL ON public.inventory_categories TO authenticated;
GRANT ALL ON public.inventory_suppliers TO authenticated;
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_batches TO authenticated;
GRANT ALL ON public.inventory_stock_movements TO authenticated;
GRANT ALL ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.inventory_alerts TO authenticated;
