export interface Product {
  id: string;
  name: string;
  stock: number;
  maxStock: number;
  price: number;
  costPrice: number;
  expiryDate: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
  totalAdded: number;
  totalSold: number;
  unit: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalPurchases: number;
  lastVisit: string;
  creditBalance: number;
  advanceBalance: number;
  preferences: string[];
  tier: 'regular' | 'gold' | 'platinum';
}

export interface SaleRecord {
  id: string;
  date: string;
  total: number;
  items: number;
  profit: number;
}

export interface AIInsight {
  id: string;
  type: 'decision' | 'alert' | 'prediction' | 'tip';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  actionable?: string;
  actionData?: any;
}

export interface Notification {
  id: string;
  type: 'stock' | 'expiry' | 'event' | 'ai' | 'payment';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface BillItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerId?: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMode: 'cash' | 'upi' | 'credit';
  date: string;
  time: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  type: 'festival' | 'birthday' | 'function' | 'sale';
  description: string;
  expectedDemand: { product: string; qty: number }[];
  reminder: boolean;
}

export interface CreditEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: 'credit' | 'payment' | 'advance';
  amount: number;
  date: string;
  note: string;
  balance: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'combo' | 'bogo' | 'campaign';
  value: number;
  status: 'active' | 'scheduled' | 'expired';
  startDate: string;
  endDate: string;
  products: string[];
}

export const products: Product[] = [
  // Groceries (1-15)
  { id: '1', name: 'Milk (1L)', stock: 8, maxStock: 50, price: 56, costPrice: 48, expiryDate: '2026-04-04', category: 'Groceries', trend: 'up', totalAdded: 200, totalSold: 192, unit: 'litre' },
  { id: '2', name: 'Bread (Sliced)', stock: 5, maxStock: 30, price: 45, costPrice: 35, expiryDate: '2026-04-03', category: 'Groceries', trend: 'up', totalAdded: 150, totalSold: 145, unit: 'pack' },
  { id: '3', name: 'Rice (5kg)', stock: 22, maxStock: 40, price: 320, costPrice: 280, expiryDate: '2026-12-15', category: 'Groceries', trend: 'stable', totalAdded: 80, totalSold: 58, unit: 'bag' },
  { id: '4', name: 'Cooking Oil (1L)', stock: 15, maxStock: 25, price: 180, costPrice: 155, expiryDate: '2026-09-20', category: 'Groceries', trend: 'stable', totalAdded: 60, totalSold: 45, unit: 'bottle' },
  { id: '5', name: 'Sugar (1kg)', stock: 30, maxStock: 35, price: 48, costPrice: 40, expiryDate: '2027-01-10', category: 'Groceries', trend: 'down', totalAdded: 100, totalSold: 70, unit: 'kg' },
  { id: '6', name: 'Curd (500ml)', stock: 3, maxStock: 20, price: 30, costPrice: 22, expiryDate: '2026-04-02', category: 'Groceries', trend: 'up', totalAdded: 120, totalSold: 117, unit: 'cup' },
  { id: '7', name: 'Biscuits (Pack)', stock: 45, maxStock: 60, price: 25, costPrice: 18, expiryDate: '2026-08-15', category: 'Groceries', trend: 'down', totalAdded: 180, totalSold: 135, unit: 'pack' },
  { id: '8', name: 'Tea Powder (250g)', stock: 18, maxStock: 30, price: 95, costPrice: 78, expiryDate: '2026-11-30', category: 'Groceries', trend: 'stable', totalAdded: 90, totalSold: 72, unit: 'pack' },
  { id: '9', name: 'Coffee (100g)', stock: 12, maxStock: 25, price: 145, costPrice: 120, expiryDate: '2026-10-10', category: 'Groceries', trend: 'up', totalAdded: 50, totalSold: 38, unit: 'jar' },
  { id: '10', name: 'Atta (10kg)', stock: 10, maxStock: 20, price: 450, costPrice: 390, expiryDate: '2026-09-05', category: 'Groceries', trend: 'stable', totalAdded: 40, totalSold: 30, unit: 'bag' },
  { id: '11', name: 'Salt (1kg)', stock: 50, maxStock: 60, price: 20, costPrice: 15, expiryDate: '2027-05-20', category: 'Groceries', trend: 'stable', totalAdded: 100, totalSold: 50, unit: 'packet' },
  { id: '12', name: 'Toor Dal (1kg)', stock: 15, maxStock: 30, price: 160, costPrice: 140, expiryDate: '2026-12-01', category: 'Groceries', trend: 'up', totalAdded: 60, totalSold: 45, unit: 'kg' },
  { id: '13', name: 'Moong Dal (1kg)', stock: 12, maxStock: 25, price: 120, costPrice: 105, expiryDate: '2026-12-10', category: 'Groceries', trend: 'stable', totalAdded: 50, totalSold: 38, unit: 'kg' },
  { id: '14', name: 'Ghee (500ml)', stock: 8, maxStock: 15, price: 350, costPrice: 310, expiryDate: '2026-07-15', category: 'Groceries', trend: 'up', totalAdded: 30, totalSold: 22, unit: 'jar' },
  { id: '15', name: 'Honey (250g)', stock: 5, maxStock: 10, price: 180, costPrice: 150, expiryDate: '2027-02-10', category: 'Groceries', trend: 'stable', totalAdded: 20, totalSold: 15, unit: 'bottle' },

  // Fashion (16-30)
  { id: '16', name: 'Cotton T-Shirt', stock: 25, maxStock: 40, price: 499, costPrice: 300, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 60, totalSold: 35, unit: 'piece' },
  { id: '17', name: 'Denim Jeans', stock: 15, maxStock: 25, price: 1299, costPrice: 800, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 40, totalSold: 25, unit: 'piece' },
  { id: '18', name: 'Summer Dress', stock: 10, maxStock: 20, price: 899, costPrice: 550, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 30, totalSold: 20, unit: 'piece' },
  { id: '19', name: 'Formal Shirt', stock: 20, maxStock: 30, price: 799, costPrice: 450, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 50, totalSold: 30, unit: 'piece' },
  { id: '20', name: 'Cargo Pants', stock: 12, maxStock: 20, price: 1199, costPrice: 750, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 30, totalSold: 18, unit: 'piece' },
  { id: '21', name: 'Hoodie (Black)', stock: 8, maxStock: 15, price: 999, costPrice: 600, expiryDate: '2030-01-01', category: 'Fashion', trend: 'down', totalAdded: 25, totalSold: 17, unit: 'piece' },
  { id: '22', name: 'Leather Belt', stock: 30, maxStock: 40, price: 399, costPrice: 200, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 60, totalSold: 30, unit: 'piece' },
  { id: '23', name: 'Woolen Socks', stock: 50, maxStock: 100, price: 149, costPrice: 80, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 150, totalSold: 100, unit: 'pair' },
  { id: '24', name: 'Running Shoes', stock: 10, maxStock: 20, price: 2499, costPrice: 1500, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 30, totalSold: 20, unit: 'pair' },
  { id: '25', name: 'Casual Loafers', stock: 12, maxStock: 20, price: 1899, costPrice: 1100, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 30, totalSold: 18, unit: 'pair' },
  { id: '26', name: 'Sunglasses', stock: 15, maxStock: 30, price: 599, costPrice: 250, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 45, totalSold: 30, unit: 'piece' },
  { id: '27', name: 'Wrist Watch', stock: 8, maxStock: 15, price: 2999, costPrice: 1800, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 20, totalSold: 12, unit: 'piece' },
  { id: '28', name: 'Baseball Cap', stock: 20, maxStock: 30, price: 299, costPrice: 120, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 50, totalSold: 30, unit: 'piece' },
  { id: '29', name: 'Handbag', stock: 6, maxStock: 12, price: 1499, costPrice: 900, expiryDate: '2030-01-01', category: 'Fashion', trend: 'up', totalAdded: 20, totalSold: 14, unit: 'piece' },
  { id: '30', name: 'Wallet (Leather)', stock: 15, maxStock: 25, price: 699, costPrice: 350, expiryDate: '2030-01-01', category: 'Fashion', trend: 'stable', totalAdded: 40, totalSold: 25, unit: 'piece' },

  // Jewellery (31-45)
  { id: '31', name: 'Gold Necklace', stock: 2, maxStock: 5, price: 45000, costPrice: 40000, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 8, totalSold: 6, unit: 'piece' },
  { id: '32', name: 'Silver Ring', stock: 10, maxStock: 20, price: 1200, costPrice: 800, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'up', totalAdded: 30, totalSold: 20, unit: 'piece' },
  { id: '33', name: 'Diamond Earrings', stock: 3, maxStock: 5, price: 25000, costPrice: 21000, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 7, totalSold: 4, unit: 'pair' },
  { id: '34', name: 'Pearl Bracelet', stock: 8, maxStock: 15, price: 3500, costPrice: 2500, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'up', totalAdded: 20, totalSold: 12, unit: 'piece' },
  { id: '35', name: 'Platinum Band', stock: 2, maxStock: 4, price: 18000, costPrice: 15000, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 5, totalSold: 3, unit: 'piece' },
  { id: '36', name: 'Anklet (Silver)', stock: 15, maxStock: 25, price: 899, costPrice: 500, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'up', totalAdded: 40, totalSold: 25, unit: 'pair' },
  { id: '37', name: 'Nose Ring', stock: 20, maxStock: 40, price: 499, costPrice: 200, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 60, totalSold: 40, unit: 'piece' },
  { id: '38', name: 'Bangle Set', stock: 12, maxStock: 20, price: 1599, costPrice: 1000, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'up', totalAdded: 30, totalSold: 18, unit: 'set' },
  { id: '39', name: 'Choker Necklace', stock: 5, maxStock: 10, price: 2499, costPrice: 1800, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 15, totalSold: 10, unit: 'piece' },
  { id: '40', name: 'Pendant (Gemstone)', stock: 7, maxStock: 12, price: 4999, costPrice: 3500, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'up', totalAdded: 20, totalSold: 13, unit: 'piece' },
  { id: '41', name: 'Maang Tikka', stock: 10, maxStock: 15, price: 799, costPrice: 400, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 25, totalSold: 15, unit: 'piece' },
  { id: '42', name: 'Jhumka Earrings', stock: 18, maxStock: 30, price: 699, costPrice: 350, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'up', totalAdded: 50, totalSold: 32, unit: 'pair' },
  { id: '43', name: 'Brooch (Floral)', stock: 25, maxStock: 40, price: 299, costPrice: 120, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 60, totalSold: 35, unit: 'piece' },
  { id: '44', name: 'Cufflinks (Silver)', stock: 6, maxStock: 12, price: 1999, costPrice: 1300, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 15, totalSold: 9, unit: 'pair' },
  { id: '45', name: 'Toe Ring Set', stock: 30, maxStock: 50, price: 199, costPrice: 80, expiryDate: '2040-01-01', category: 'Jewellery', trend: 'stable', totalAdded: 80, totalSold: 50, unit: 'set' },
];

export const customers: Customer[] = [
  { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', totalPurchases: 15200, lastVisit: '2026-03-31', creditBalance: 0, advanceBalance: 500, preferences: ['Milk', 'Bread', 'Rice'], tier: 'platinum' },
  { id: '2', name: 'Priya Devi', phone: '+91 87654 32109', totalPurchases: 8500, lastVisit: '2026-03-30', creditBalance: 250, advanceBalance: 0, preferences: ['Cooking Oil', 'Sugar', 'Tea'], tier: 'gold' },
  { id: '3', name: 'Murugan S', phone: '+91 76543 21098', totalPurchases: 4200, lastVisit: '2026-03-28', creditBalance: 500, advanceBalance: 0, preferences: ['Milk', 'Curd', 'Biscuits'], tier: 'regular' },
  { id: '4', name: 'Lakshmi P', phone: '+91 65432 10987', totalPurchases: 12800, lastVisit: '2026-03-31', creditBalance: 0, advanceBalance: 1000, preferences: ['Rice', 'Oil', 'Sugar'], tier: 'gold' },
  { id: '5', name: 'Anand V', phone: '+91 54321 09876', totalPurchases: 3100, lastVisit: '2026-03-25', creditBalance: 150, advanceBalance: 0, preferences: ['Bread', 'Biscuits'], tier: 'regular' },
];

export const salesData: SaleRecord[] = [
  { id: '1', date: '2026-03-26', total: 4200, items: 32, profit: 840 },
  { id: '2', date: '2026-03-27', total: 3800, items: 28, profit: 720 },
  { id: '3', date: '2026-03-28', total: 5100, items: 41, profit: 1050 },
  { id: '4', date: '2026-03-29', total: 4600, items: 35, profit: 920 },
  { id: '5', date: '2026-03-30', total: 3200, items: 24, profit: 580 },
  { id: '6', date: '2026-03-31', total: 5800, items: 45, profit: 1200 },
  { id: '7', date: '2026-04-01', total: 4100, items: 30, profit: 850 },
];

export const aiInsights: AIInsight[] = [
  { 
    id: '1', type: 'decision', title: 'Order Milk Tomorrow', 
    message: 'Milk stock is critically low (8 units). Based on average daily sales of 12 units, order at least 40 units by tomorrow morning.', 
    priority: 'high', timestamp: '2 min ago', actionable: 'Place order for 40 units of milk',
    actionData: { items: [{ productId: '1', quantity: 40 }] }
  },
  { 
    id: '2', type: 'alert', title: 'Curd Expiring Soon', 
    message: 'Curd (3 units) expires on April 2. Apply 25% discount to clear stock before expiry.', 
    priority: 'high', timestamp: '15 min ago', actionable: 'Apply 25% discount on Curd',
    actionData: { discount: 25, productId: '6' }
  },
  { id: '3', type: 'prediction', title: 'Tamil New Year Demand', message: 'Tamil New Year (April 14) — expect 3x surge in Rice, Sugar, and Oil. Start stocking by April 8.', priority: 'medium', timestamp: '1 hour ago' },
  { id: '4', type: 'tip', title: 'Cross-sell Opportunity', message: 'Rajesh Kumar buys Milk every 2 days. Suggest Bread combo — 40% of milk buyers also buy bread.', priority: 'low', timestamp: '2 hours ago' },
];

export const notifications: Notification[] = [
  { id: '1', type: 'stock', title: 'Low Stock Alert', message: 'Curd stock is critically low — only 3 units left', time: '5 min ago', read: false },
  { id: '2', type: 'expiry', title: 'Expiry Warning', message: 'Bread expires tomorrow — 5 units remaining', time: '20 min ago', read: false },
  { id: '3', type: 'ai', title: 'AI Decision', message: 'Recommended: Order 40 units of Milk', time: '1 hour ago', read: false },
];

export const bills: Bill[] = [
  {
    id: '1', billNumber: 'AK-1234', customerId: '1', customerName: 'Rajesh Kumar',
    items: [
      { productId: '1', name: 'Milk (1L)', quantity: 22, price: 25, total: 550 },
      { productId: '2', name: 'cake', quantity: 32, price: 67, total: 2144 },
    ],
    subtotal: 2694, discount: 0, total: 2694, paymentMode: 'upi', date: '23/4/2026', time: '09:30 AM',
  },
  {
    id: '2', billNumber: 'AK-5678', customerId: '3', customerName: 'Murugan S',
    items: [
      { productId: '6', name: 'Curd (500ml)', quantity: 2, price: 30, total: 60 },
      { productId: '7', name: 'Biscuits (Pack)', quantity: 3, price: 25, total: 75 },
    ],
    subtotal: 135, discount: 0, total: 135, paymentMode: 'cash', date: '23/4/2026', time: '10:15 AM',
  },
  {
    id: '3', billNumber: 'AK-9012', customerName: 'Walk-in Customer',
    items: [
      { productId: '4', name: 'Cooking Oil (1L)', quantity: 6, price: 180, total: 1080 },
      { productId: '2', name: 'Bread (Sliced)', quantity: 5, price: 45, total: 225 },
    ],
    subtotal: 1305, discount: 0, total: 1305, paymentMode: 'cash', date: '23/4/2026', time: '04:45 PM',
  },
];

export const businessHealthScore = 72;

export const todayStats = {
  revenue: 5800,
  orders: 45,
  avgOrderValue: 129,
  revenueChange: 12,
  ordersChange: 8,
  newCustomers: 3,
  profit: 1200,
  weeklyRevenue: 30800,
  monthlyRevenue: 142000,
};
