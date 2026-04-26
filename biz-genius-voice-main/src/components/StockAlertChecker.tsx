import React, { useEffect } from 'react';
import { useProducts } from '@/hooks/use-database';
import { sendStockAlertEmail } from '@/lib/emailService';

export const StockAlertChecker: React.FC = () => {
  const { data: products } = useProducts();

  useEffect(() => {
    if (!products || products.length === 0) return;

    const checkAndSendAlerts = async () => {
      const lastCheckTime = localStorage.getItem('last_stock_check_time');
      const now = Date.now();
      const SIX_HOURS = 6 * 60 * 60 * 1000;

      // Perform check
      const lowStockItems = products.filter(p => p.stock > 0 && p.stock < 5);
      const zeroStockItems = products.filter(p => p.stock === 0);
      
      // We can also check expiry if p.expiry_date exists
      const expiringItems = products.filter(p => {
        if (!p.expiry_date) return false;
        const expiryDate = new Date(p.expiry_date).getTime();
        const daysToExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
        return daysToExpiry > 0 && daysToExpiry <= 7; // Expiring within 7 days
      });

      // Check in-app notifications
      const lastInAppCheck = localStorage.getItem('last_in_app_check');
      if (!lastInAppCheck || now - parseInt(lastInAppCheck, 10) > 60 * 60 * 1000) {
        // Sync to DB every hour at most
        const { supabase } = await import('@/integrations/supabase/client');
        
        for (const item of zeroStockItems) {
            await supabase.from('notifications').insert([{
                type: 'stock',
                title: 'Stock Depleted!',
                message: `${item.name} has run out of stock. Please reorder immediately.`
            }]);
        }
        
        for (const item of lowStockItems) {
            await supabase.from('notifications').insert([{
                type: 'stock',
                title: 'Low Stock Warning',
                message: `${item.name} is running low (${item.stock} left).`
            }]);
        }
        
        localStorage.setItem('last_in_app_check', now.toString());
      }

      // If less than 5 minutes have passed since last email check, do nothing for emails
      if (lastCheckTime && now - parseInt(lastCheckTime, 10) < 5 * 60 * 1000) {
        return;
      }

      let alertSent = false;

      if (zeroStockItems.length > 0) {
        await sendStockAlertEmail('zero_stock', zeroStockItems);
        alertSent = true;
      }

      if (lowStockItems.length > 0) {
        await sendStockAlertEmail('low_stock', lowStockItems);
        alertSent = true;
      }

      if (expiringItems.length > 0) {
        await sendStockAlertEmail('expiry', expiringItems);
        alertSent = true;
      }

      // Update the last check time for emails
      localStorage.setItem('last_stock_check_time', now.toString());
    };

    checkAndSendAlerts();
  }, [products]);

  return null;
};
