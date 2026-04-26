import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendStockAlertEmail } from "@/lib/emailService";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  max_stock?: number;
  category: string;
  total_sold?: number;
  expiry_date?: string;
  created_at?: string;
}

export interface BillItem {
  id?: string;
  bill_id?: string;
  product_id: string;
  productId?: string; // For frontend compatibility
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  customer_id?: string;
  total: number;
  discount?: number;
  payment_mode: string;
  date: string;
  created_at?: string;
  items?: BillItem[];
}

export interface SalesSummary {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface Settings {
  id: string;
  shop_name: string;
  currency: string;
  language: string;
  [key: string]: unknown; // Allow for other fields
}

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as Product[];
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update product: ${err.message}`);
    }
  });
};

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useAIInsights = () => {
  return useQuery({
    queryKey: ['ai_insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

export const useSalesSummary = () => {
  return useQuery({
    queryKey: ['sales_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(14);
      if (error) throw error;
      return (data || []) as SalesSummary[];
    },
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billData: { items: BillItem[] } & Partial<Bill>) => {
      const { items, ...billInfo } = billData;

      // 1. Create the bill header
      const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert([billInfo])
        .select()
        .single();

      if (billError) throw billError;

      // 2. Create bill items
      const billItems = items.map((item) => ({
        bill_id: bill.id,
        product_id: item.productId || item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(billItems);

      if (itemsError) throw itemsError;

      // 3. Deduct stock from products
      for (const item of items) {
        const productId = item.productId || item.product_id;
        const { error: stockError } = await supabase.rpc("deduct_stock", {
          p_id: productId,
          p_qty: item.quantity,
        });
        // If RPC fails (e.g. not created yet), fallback to manual update
        if (stockError) {
            const { data: product } = await supabase.from('products').select('stock').eq('id', productId).single();
            if (product) {
                await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', productId);
            }
        }
        
        // Check if stock hit threshold and send alerts dynamically
        const { data: updatedProduct } = await supabase.from('products').select('*').eq('id', productId).single();
        if (updatedProduct) {
            if (updatedProduct.stock === 0) {
                // Email Alert
                await sendStockAlertEmail('zero_stock', [updatedProduct as Product]);
                
                // In-App Notification
                await supabase.from('notifications').insert([{
                    type: 'stock',
                    title: 'Stock Depleted!',
                    message: `${updatedProduct.name} has run out of stock. Please reorder immediately.`
                }]);
                
                // AI Insight
                await supabase.from('ai_insights').insert([{
                    type: 'alert',
                    priority: 'high',
                    title: 'Critical Restock Needed',
                    message: `You just sold the last ${updatedProduct.name}. Restocking now will prevent lost sales.`,
                    actionable: '/inventory'
                }]);
            } else if (updatedProduct.stock <= 5) {
                // Low stock threshold
                await supabase.from('notifications').insert([{
                    type: 'stock',
                    title: 'Low Stock Warning',
                    message: `${updatedProduct.name} is running low (${updatedProduct.stock} left).`
                }]);
                
                await supabase.from('ai_insights').insert([{
                    type: 'prediction',
                    priority: 'medium',
                    title: 'Upcoming Stockout',
                    message: `${updatedProduct.name} is selling fast. Only ${updatedProduct.stock} remaining. Consider ordering a new batch to meet demand.`,
                    actionable: '/inventory'
                }]);
            }
        }
      }

      // 4. Update Customer Balances
      if (billInfo.customer_id) {
          const { data: customer } = await supabase.from('customers').select('*').eq('id', billInfo.customer_id).single();
          if (customer) {
              const newTotalPurchases = (Number(customer.total_purchases) || 0) + (billInfo.total || 0);
              let newCreditBalance = Number(customer.credit_balance) || 0;
              let newAdvanceBalance = Number(customer.advance_balance) || 0;
              
              if (billInfo.payment_mode === 'credit') {
                  let billTotal = billInfo.total || 0;

                  // First deduct from advance balance if any
                  if (newAdvanceBalance > 0) {
                      if (newAdvanceBalance >= billTotal) {
                          newAdvanceBalance -= billTotal;
                          billTotal = 0;
                      } else {
                          billTotal -= newAdvanceBalance;
                          newAdvanceBalance = 0;
                      }
                  }

                  // Any remaining bill total goes to credit
                  if (billTotal > 0) {
                      newCreditBalance += billTotal;
                  }
                  
                  // Log credit entry
                  await supabase.from('credit_entries').insert([{
                      customer_id: customer.id,
                      customer_name: customer.name,
                      type: 'credit',
                      amount: billInfo.total,
                      note: `Bill #${billInfo.bill_number || 'Auto'}`,
                      balance: newCreditBalance
                  }]);
              }
              
              await supabase.from('customers').update({
                  total_purchases: newTotalPurchases,
                  credit_balance: newCreditBalance,
                  advance_balance: newAdvanceBalance,
                  last_visit: new Date().toISOString().split('T')[0]
              }).eq('id', customer.id);
          }
      }

      return bill as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["sales_summary"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["ai_insights"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["credit_entries"] });
      toast.success("Bill created and stock updated!");
    },
    onError: (error: Error) => {
      console.error("Billing error:", error);
      toast.error("Failed to create bill: " + error.message);
    },
  });
};

export const useBills = (customerId?: string) => {
  return useQuery({
    queryKey: ['bills', customerId],
    queryFn: async () => {
      let query = supabase.from('bills').select('*, items:bill_items(*)').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Bill[];
    },
  });
};

export const useCreditEntries = (customerId?: string) => {
  return useQuery({
    queryKey: ['credit_entries', customerId],
    queryFn: async () => {
      let query = supabase.from('credit_entries').select('*').order('date', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date');
      if (error) throw error;
      return data;
    },
  });
};

export const useOffers = () => {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      
      if (!data) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const defaultSettings = {
            shop_name: 'My Shop',
            language: 'en',
            notification_prefs: { orderAlerts: true, stockAlerts: true, dailyReports: true }
          };
          
          const { data: newData, error: insertError } = await supabase
            .from('settings')
            .insert(defaultSettings)
            .select()
            .single();
            
          if (!insertError && newData) {
            return newData as Settings;
          }
        }
        // Fallback if we can't create or not logged in
        return {
            id: 'temp',
            shop_name: 'My Shop',
            currency: 'INR',
            language: 'en',
            notification_prefs: {}
        } as Settings;
      }
      
      return data as Settings;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<Settings> & { id: string }) => {
      const { id, ...updateData } = settings;
      const { data, error } = await supabase
        .from('settings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success("Settings updated successfully! ✨");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    }
  });
};

export const useManageBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, amount, type, note }: { customerId: string, amount: number, type: 'payment' | 'advance', note: string }) => {
      const { data: customer } = await supabase.from('customers').select('*').eq('id', customerId).single();
      if (!customer) throw new Error("Customer not found");

      let newCreditBalance = Number(customer.credit_balance) || 0;
      let newAdvanceBalance = Number(customer.advance_balance) || 0;

      let remainingAmount = amount;

      if (type === 'payment' || type === 'advance') {
        // First pay off any existing credit
        if (newCreditBalance > 0) {
          if (remainingAmount >= newCreditBalance) {
            remainingAmount -= newCreditBalance;
            newCreditBalance = 0;
          } else {
            newCreditBalance -= remainingAmount;
            remainingAmount = 0;
          }
        }
        
        // Any remaining amount goes to advance balance
        if (remainingAmount > 0) {
          newAdvanceBalance += remainingAmount;
        }
      }

      // Log entry
      const { error: entryError } = await supabase.from('credit_entries').insert([{
        customer_id: customer.id,
        customer_name: customer.name,
        type: type,
        amount: amount,
        note: note,
        balance: newCreditBalance > 0 ? newCreditBalance : newAdvanceBalance
      }]);

      if (entryError) throw entryError;

      const { data, error } = await supabase.from('customers').update({
        credit_balance: newCreditBalance,
        advance_balance: newAdvanceBalance
      }).eq('id', customer.id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["credit_entries"] });
      toast.success("Balance updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    }
  });
};
