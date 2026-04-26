import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  products as initialProducts, 
  customers as initialCustomers, 
  salesData as initialSales,
  todayStats as initialStats,
  bills as initialBills,
  Product,
  Customer,
  SaleRecord,
  Bill,
  BillItem
} from '@/data/dummyData';

interface AppContextType {
  products: Product[];
  customers: Customer[];
  salesData: SaleRecord[];
  todayStats: typeof initialStats;
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateProductStock: (productId: string, quantityChange: number) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('biz_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('biz_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [salesData, setSalesData] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('biz_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [todayStats, setTodayStats] = useState<typeof initialStats>(() => {
    const saved = localStorage.getItem('biz_stats');
    return saved ? JSON.parse(saved) : initialStats;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('biz_bills');
    return saved ? JSON.parse(saved) : initialBills;
  });

  useEffect(() => {
    localStorage.setItem('biz_products', JSON.stringify(products));
    localStorage.setItem('biz_customers', JSON.stringify(customers));
    localStorage.setItem('biz_sales', JSON.stringify(salesData));
    localStorage.setItem('biz_stats', JSON.stringify(todayStats));
    localStorage.setItem('biz_bills', JSON.stringify(bills));
  }, [products, customers, salesData, todayStats, bills]);

  const updateProductStock = (productId: string, quantityChange: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, p.stock + quantityChange) };
      }
      return p;
    }));
  };

  const addBill = (newBill: Omit<Bill, 'id'>) => {
    const id = Date.now().toString();
    const bill = { ...newBill, id } as Bill;
    setBills(prev => [...prev, bill]);

    // Update stock for each item
    bill.items.forEach(item => {
      updateProductStock(item.productId, -item.quantity);
    });

    // Update today's stats
    setTodayStats(prev => ({
      ...prev,
      revenue: prev.revenue + bill.total,
      orders: prev.orders + 1,
      profit: prev.profit + (bill.total * 0.2), // Rough estimate for profit update
      weeklyRevenue: prev.weeklyRevenue + bill.total,
      monthlyRevenue: prev.monthlyRevenue + bill.total,
    }));
  };

  const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    const id = Date.now().toString();
    setCustomers(prev => [...prev, { ...customerData, id } as Customer]);
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const id = Date.now().toString();
    setProducts(prev => [...prev, { ...productData, id } as Product]);
  };

  return (
    <AppContext.Provider value={{
      products,
      customers,
      salesData,
      todayStats,
      bills,
      addBill,
      updateProductStock,
      addCustomer,
      addProduct
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
