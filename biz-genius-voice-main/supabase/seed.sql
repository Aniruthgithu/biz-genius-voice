-- Seed data for TradeGenie AI

-- 1. Products
INSERT INTO public.products (name, stock, max_stock, price, cost_price, expiry_date, category, trend, total_added, total_sold, unit)
VALUES 
('Milk (1L)', 8, 50, 56, 48, '2026-04-04', 'Dairy', 'up', 200, 192, 'litre'),
('Bread (Sliced)', 5, 30, 45, 35, '2026-04-03', 'Bakery', 'up', 150, 145, 'pack'),
('Rice (5kg)', 22, 40, 320, 280, '2026-12-15', 'Grains', 'stable', 80, 58, 'bag'),
('Cooking Oil (1L)', 15, 25, 180, 155, '2026-09-20', 'Oils', 'stable', 60, 45, 'bottle'),
('Sugar (1kg)', 30, 35, 48, 40, '2027-01-10', 'Essentials', 'down', 100, 70, 'kg'),
('Curd (500ml)', 3, 20, 30, 22, '2026-04-02', 'Dairy', 'up', 120, 117, 'cup'),
('Biscuits (Pack)', 45, 60, 25, 18, '2026-08-15', 'Snacks', 'down', 180, 135, 'pack'),
('Tea Powder (250g)', 18, 30, 95, 78, '2026-11-30', 'Beverages', 'stable', 90, 72, 'pack');

-- 2. Customers
INSERT INTO public.customers (name, phone, total_purchases, last_visit, credit_balance, advance_balance, preferences, tier)
VALUES 
('Rajesh Kumar', '+91 98765 43210', 15200, '2026-03-31', 0, 500, '{Milk, Bread, Rice}', 'platinum'),
('Priya Devi', '+91 87654 32109', 8500, '2026-03-30', 250, 0, '{Cooking Oil, Sugar, Tea}', 'gold'),
('Murugan S', '+91 76543 21098', 4200, '2026-03-28', 500, 0, '{Milk, Curd, Biscuits}', 'regular'),
('Lakshmi P', '+91 65432 10987', 12800, '2026-03-31', 0, 1000, '{Rice, Oil, Sugar}', 'gold'),
('Anand V', '+91 54321 09876', 3100, '2026-03-25', 150, 0, '{Bread, Biscuits}', 'regular');

-- 3. Sales Summary
INSERT INTO public.sales_summary (date, revenue, orders, profit, new_customers)
VALUES 
('2026-03-26', 4200, 32, 840, 1),
('2026-03-27', 3800, 28, 720, 2),
('2026-03-28', 5100, 41, 1050, 1),
('2026-03-29', 4600, 35, 920, 3),
('2026-03-30', 3200, 24, 580, 0),
('2026-03-31', 5800, 45, 1200, 3),
('2026-04-01', 4100, 30, 850, 2);

-- 4. AI Insights
INSERT INTO public.ai_insights (type, title, message, priority, actionable)
VALUES 
('decision', 'Order Milk Tomorrow', 'Milk stock is critically low (8 units). Based on average daily sales of 12 units, order at least 40 units by tomorrow morning.', 'high', 'Place order for 40 units of milk'),
('alert', 'Curd Expiring Soon', 'Curd (3 units) expires on April 2. Apply 25% discount to clear stock before expiry.', 'high', 'Apply 25% discount on Curd'),
('prediction', 'Tamil New Year Demand', 'Tamil New Year (April 14) — expect 3x surge in Rice, Sugar, and Oil. Start stocking by April 8.', 'medium', NULL),
('tip', 'Cross-sell Opportunity', 'Rajesh Kumar buys Milk every 2 days. Suggest Bread combo — 40% of milk buyers also buy bread.', 'low', NULL);

-- 5. Notifications
INSERT INTO public.notifications (type, title, message, read)
VALUES 
('stock', 'Low Stock Alert', 'Curd stock is critically low — only 3 units left', false),
('expiry', 'Expiry Warning', 'Bread expires tomorrow — 5 units remaining', false),
('ai', 'AI Decision', 'Recommended: Order 40 units of Milk', false);

-- 6. Events
INSERT INTO public.events (name, date, type, description, expected_demand, reminder)
VALUES 
('Tamil New Year', '2026-04-14', 'festival', 'Major festival — expect 3x demand for essentials', '[{"product": "Rice (5kg)", "qty": 40}, {"product": "Sugar (1kg)", "qty": 30}]'::jsonb, true),
('Rajesh Birthday', '2026-04-20', 'birthday', 'Regular platinum customer — send greeting + offer', '[{"product": "Biscuits (Pack)", "qty": 10}]'::jsonb, true);
