-- =============================================
-- INVENTORY NOTIFICATION SYSTEM
-- =============================================
-- This migration adds a trigger to automatically create notifications
-- for admin and pharmacist users when inventory alerts are generated.

-- =============================================
-- Add 'inventory' to notification type enum
-- =============================================
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error', 'appointment', 'prescription', 'inventory'));

-- =============================================
-- Function to create inventory notifications
-- =============================================
CREATE OR REPLACE FUNCTION create_inventory_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    notification_title TEXT;
    notification_type TEXT;
BEGIN
    -- Determine notification title based on alert type
    CASE NEW.alert_type
        WHEN 'out_of_stock' THEN
            notification_title := 'Out of Stock Alert';
            notification_type := 'error';
        WHEN 'low_stock' THEN
            notification_title := 'Low Stock Alert';
            notification_type := 'warning';
        WHEN 'expiring_soon' THEN
            notification_title := 'Expiry Warning';
            notification_type := 'warning';
        WHEN 'expired' THEN
            notification_title := 'Expired Item Alert';
            notification_type := 'error';
        WHEN 'overstock' THEN
            notification_title := 'Overstock Notice';
            notification_type := 'info';
        ELSE
            notification_title := 'Inventory Alert';
            notification_type := 'info';
    END CASE;

    -- Create notifications for all admin and pharmacist users
    FOR user_record IN 
        SELECT id FROM public.users 
        WHERE role IN ('admin', 'pharmacist')
        AND is_active = true
    LOOP
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_type,
            related_id,
            is_read,
            created_at
        ) VALUES (
            user_record.id,
            notification_title,
            NEW.message,
            notification_type,
            'inventory_alert',
            NEW.id,
            false,
            NOW()
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Trigger for inventory alert notifications
-- =============================================
DROP TRIGGER IF EXISTS trigger_inventory_notification ON public.inventory_alerts;
CREATE TRIGGER trigger_inventory_notification
AFTER INSERT ON public.inventory_alerts
FOR EACH ROW
EXECUTE FUNCTION create_inventory_notification();

-- =============================================
-- Function to check expiring batches (to be run via cron)
-- =============================================
CREATE OR REPLACE FUNCTION check_expiring_batches()
RETURNS void AS $$
DECLARE
    batch_record RECORD;
    days_to_expiry INTEGER;
BEGIN
    -- Check for batches expiring within 30 days
    FOR batch_record IN 
        SELECT 
            b.id as batch_id,
            b.item_id,
            b.batch_number,
            b.expiry_date,
            i.name as item_name,
            b.available_quantity
        FROM public.inventory_batches b
        JOIN public.inventory_items i ON b.item_id = i.id
        WHERE b.status = 'active'
        AND b.expiry_date IS NOT NULL
        AND b.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND b.available_quantity > 0
        AND NOT EXISTS (
            SELECT 1 FROM public.inventory_alerts
            WHERE batch_id = b.id
            AND alert_type IN ('expiring_soon', 'expired')
            AND is_resolved = false
        )
    LOOP
        days_to_expiry := batch_record.expiry_date - CURRENT_DATE;
        
        IF days_to_expiry <= 0 THEN
            -- Batch has expired
            INSERT INTO public.inventory_alerts (
                item_id, batch_id, alert_type, severity, message
            ) VALUES (
                batch_record.item_id,
                batch_record.batch_id,
                'expired',
                'critical',
                'Batch "' || batch_record.batch_number || '" of "' || 
                batch_record.item_name || '" has expired! Qty: ' || 
                batch_record.available_quantity
            );
            
            -- Update batch status to expired
            UPDATE public.inventory_batches
            SET status = 'expired', updated_at = NOW()
            WHERE id = batch_record.batch_id;
        ELSIF days_to_expiry <= 7 THEN
            -- Expiring within 7 days - high severity
            INSERT INTO public.inventory_alerts (
                item_id, batch_id, alert_type, severity, message
            ) VALUES (
                batch_record.item_id,
                batch_record.batch_id,
                'expiring_soon',
                'high',
                'Batch "' || batch_record.batch_number || '" of "' || 
                batch_record.item_name || '" expires in ' || days_to_expiry || 
                ' days! Qty: ' || batch_record.available_quantity
            );
        ELSE
            -- Expiring within 30 days - medium severity
            INSERT INTO public.inventory_alerts (
                item_id, batch_id, alert_type, severity, message
            ) VALUES (
                batch_record.item_id,
                batch_record.batch_id,
                'expiring_soon',
                'medium',
                'Batch "' || batch_record.batch_number || '" of "' || 
                batch_record.item_name || '" expires in ' || days_to_expiry || 
                ' days. Qty: ' || batch_record.available_quantity
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Index for faster notification queries
-- =============================================
CREATE INDEX IF NOT EXISTS idx_notifications_related 
ON public.notifications(related_type, related_id);

-- =============================================
-- Schedule function documentation
-- =============================================
-- To run the expiry check daily, set up a cron job in Supabase:
-- 
-- Using pg_cron (if available):
-- SELECT cron.schedule('check-expiring-batches', '0 6 * * *', 'SELECT check_expiring_batches()');
--
-- Or use Supabase Edge Functions with a scheduled trigger
-- Or call the function via an external cron service
