import emailjs from '@emailjs/browser';
import { Product } from '@/hooks/use-database';

// User provided credentials
const SERVICE_ID = 'service_03r28ao';
const TEMPLATE_ID = 'template_8fl0sry';
const PUBLIC_KEY = 'pPbFcitupgtDtb3nS';

export const sendStockAlertEmail = async (type: 'zero_stock' | 'low_stock' | 'expiry', items: Product[]) => {
  if (!items || items.length === 0) return;

  let subject = '';
  let message = '';

  if (type === 'zero_stock') {
    subject = 'CRITICAL: Stock Depleted (0 units)';
    message = `The following items have just run out of stock (0 units):\n\n`;
    items.forEach(item => {
      message += `- ${item.name} (Category: ${item.category})\n`;
    });
    message += `\nPlease order them immediately!`;
  } else if (type === 'low_stock') {
    subject = 'WARNING: Low Stock Alert';
    message = `The following items are running low on stock (less than 5 units):\n\n`;
    items.forEach(item => {
      message += `- ${item.name} (Stock: ${item.stock} left)\n`;
    });
    message += `\nPlease consider restocking them soon.`;
  } else if (type === 'expiry') {
    subject = 'NOTICE: Items Nearing Expiry';
    message = `The following items are nearing their expiry date:\n\n`;
    items.forEach(item => {
      message += `- ${item.name} (Expires on: ${item.expiry_date})\n`;
    });
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: sessionData } = await supabase.auth.getSession();
    const ownerEmail = sessionData?.session?.user?.email;

    if (!ownerEmail) {
      console.warn("No owner email found. Skipping email alert.");
      return;
    }

    const templateParams = {
      subject: subject,
      message: message,
      to_email: ownerEmail,
      to_name: 'Shop Owner',
      from_name: 'BizGenius AI'
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    console.log('SUCCESS! Email sent.', response.status, response.text);
  } catch (err) {
    console.error('FAILED to send email alert:', err);
  }
};
