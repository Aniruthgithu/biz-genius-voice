-- 1. Add user_id column to all tables
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.sales_summary ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.credit_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.ai_insights ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- If you have existing data and want to assign it to the first registered user, you can uncomment and run the following block:
-- DO $$
-- DECLARE
--   first_user_id UUID;
-- BEGIN
--   SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
--   IF first_user_id IS NOT NULL THEN
--     UPDATE public.customers SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.products SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.bills SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.bill_items SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.sales_summary SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.events SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.credit_entries SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.offers SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.notifications SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.ai_insights SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE public.settings SET user_id = first_user_id WHERE user_id IS NULL;
--   END IF;
-- END $$;

-- Drop existing "Allow all for now" policies
DROP POLICY IF EXISTS "Allow all for now" ON public.customers;
DROP POLICY IF EXISTS "Allow all for now" ON public.products;
DROP POLICY IF EXISTS "Allow all for now" ON public.bills;
DROP POLICY IF EXISTS "Allow all for now" ON public.bill_items;
DROP POLICY IF EXISTS "Allow all for now" ON public.sales_summary;
DROP POLICY IF EXISTS "Allow all for now" ON public.events;
DROP POLICY IF EXISTS "Allow all for now" ON public.credit_entries;
DROP POLICY IF EXISTS "Allow all for now" ON public.offers;
DROP POLICY IF EXISTS "Allow all for now" ON public.notifications;
DROP POLICY IF EXISTS "Allow all for now" ON public.ai_insights;
DROP POLICY IF EXISTS "Allow all for now" ON public.settings;

-- Drop new policies if they already exist so the script can be re-run safely
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.customers;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.products;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.bills;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.bill_items;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.sales_summary;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.events;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.credit_entries;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.offers;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.notifications;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.ai_insights;
DROP POLICY IF EXISTS "Isolated Data Policy" ON public.settings;

-- Create strictly isolated user policies
CREATE POLICY "Isolated Data Policy" ON public.customers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.bill_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.sales_summary FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.credit_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.offers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.ai_insights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Isolated Data Policy" ON public.settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Recreate the stock deduction function to enforce RLS correctly
CREATE OR REPLACE FUNCTION deduct_stock(p_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - p_qty,
        total_sold = total_sold + p_qty
    WHERE id = p_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;
