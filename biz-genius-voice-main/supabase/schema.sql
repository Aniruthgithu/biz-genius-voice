-- Create tables for TradeGenie AI

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    total_purchases DECIMAL DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    credit_balance DECIMAL DEFAULT 0,
    advance_balance DECIMAL DEFAULT 0,
    preferences TEXT[] DEFAULT '{}',
    tier TEXT DEFAULT 'regular' CHECK (tier IN ('regular', 'gold', 'platinum'))
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    price DECIMAL NOT NULL,
    cost_price DECIMAL NOT NULL,
    expiry_date DATE,
    category TEXT,
    trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
    total_added INTEGER DEFAULT 0,
    total_sold INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'unit',
    barcode TEXT UNIQUE,
    damaged_stock INTEGER DEFAULT 0
);

-- 3. Bills Table (Orders)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    bill_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT, -- For walk-in customers
    subtotal DECIMAL NOT NULL,
    discount DECIMAL DEFAULT 0,
    total DECIMAL NOT NULL,
    payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'credit')),
    date DATE DEFAULT CURRENT_DATE,
    time TEXT DEFAULT TO_CHAR(CURRENT_TIMESTAMP, 'HH:MI AM')
);

-- 4. Bill Items Table
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL NOT NULL,
    total DECIMAL NOT NULL
);

-- 5. Sales Summary Table (for daily stats)
CREATE TABLE IF NOT EXISTS public.sales_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE DEFAULT CURRENT_DATE,
    revenue DECIMAL DEFAULT 0,
    orders INTEGER DEFAULT 0,
    profit DECIMAL DEFAULT 0,
    new_customers INTEGER DEFAULT 0
);

-- 6. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT CHECK (type IN ('festival', 'birthday', 'function', 'sale')),
    description TEXT,
    expected_demand JSONB DEFAULT '[]', -- List of {product: string, qty: number}
    reminder BOOLEAN DEFAULT true
);

-- 7. Credit Entries Table
CREATE TABLE IF NOT EXISTS public.credit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    customer_name TEXT,
    type TEXT CHECK (type IN ('credit', 'payment', 'advance')),
    amount DECIMAL NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    balance DECIMAL NOT NULL
);

-- 8. Offers Table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('discount', 'combo', 'bogo', 'campaign')),
    value DECIMAL NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'expired')),
    start_date DATE,
    end_date DATE,
    products TEXT[] DEFAULT '{}'
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('stock', 'expiry', 'event', 'ai', 'payment')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read BOOLEAN DEFAULT false
);

-- 10. AI Insights Table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('decision', 'alert', 'prediction', 'tip')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    actionable TEXT
);

-- Enable Row Level Security (RLS) - For now allow all for ease of dev (Can be tightened later)
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

CREATE POLICY "Allow all for now" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.bill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.sales_summary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.credit_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON public.ai_insights FOR ALL USING (true) WITH CHECK (true);

-- Function to safely deduct stock
CREATE OR REPLACE FUNCTION deduct_stock(p_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - p_qty,
        total_sold = total_sold + p_qty
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name TEXT DEFAULT 'Annachi Kadai',
    language TEXT DEFAULT 'en',
    access_pin TEXT DEFAULT '1234',
    notification_prefs JSONB DEFAULT '{"lowStock": true, "expiry": true, "salesDrop": true, "events": true, "aiDecisions": true}'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy for settings
CREATE POLICY "Allow all for now" ON public.settings FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.settings (shop_name, access_pin) VALUES ('Annachi Kadai', '1234');
