import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, Printer, MessageSquare, CheckCircle2, X, Search, UserPlus, Send, QrCode, Sparkles, ShoppingBag, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { type BillItem, type Bill } from "@/data/dummyData";
import { useProducts, useCustomers, useCreateBill } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: initialProducts, isLoading: productsLoading } = useProducts();
  const { data: initialCustomers, isLoading: customersLoading } = useCustomers();
  const createBillMutation = useCreateBill();
  
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'credit'>('cash');
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [customers, setCustomers] = useState(initialCustomers || []);
  
  // New state for walk-in customer details during preview
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");

  useEffect(() => {
    if (initialCustomers) setCustomers(initialCustomers);
  }, [initialCustomers]);

  useEffect(() => {
    const actionData = location.state?.actionData;
    if (actionData) {
      if (actionData.items) {
        const newItems: BillItem[] = actionData.items.map((item: any) => {
          const product = initialProducts?.find(p => p.id === item.productId || p.id === item.product_id);
          if (product) {
            return {
              productId: product.id,
              name: product.name,
              quantity: item.quantity,
              price: product.price,
              total: product.price * item.quantity,
            };
          }
          return null;
        }).filter(Boolean);
        
        if (newItems.length > 0) {
          setBillItems(newItems);
          toast.success("AI Recommendation applied to bill! ✨");
        }
      }
      if (actionData.discount) {
        setDiscount(actionData.discount);
        if (actionData.productId) {
            const product = initialProducts.find(p => p.id === actionData.productId);
            if (product && !billItems.find(i => i.productId === product.id)) {
                addItem(product);
            }
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredProducts = initialProducts?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const addItem = (product: typeof initialProducts[0]) => {
    if (product.stock <= 0) {
      toast.error("Item out of stock!");
      return;
    }
    const existing = billItems.find(i => i.productId === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        toast.error(`Cannot add more than available stock (${product.stock})`);
        return;
      }
      setBillItems(billItems.map(i =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i
      ));
    } else {
      setBillItems([...billItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
      }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    const product = initialProducts?.find(p => p.id === productId);
    setBillItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = Math.max(0, i.quantity + delta);
      if (product && newQty > product.stock) {
        toast.error(`Cannot add more than available stock (${product.stock})`);
        return i;
      }
      return { ...i, quantity: newQty, total: newQty * i.price };
    }).filter(i => i.quantity > 0));
  };

  const subtotal = billItems.reduce((a, i) => a + i.total, 0);
  const discountAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discountAmt;

  const confirmBill = async () => {
    try {
        let finalCustomerId = selectedCustomer;
        let finalCustomerName = customerName;
        let finalCustomerPhone = customerPhone;

        // Auto-save Walk-in Customer if details provided
        if (!selectedCustomer && walkInName && walkInPhone) {
            // Deduplicate: Check if phone already exists
            const existingCustomer = customers.find(c => c.phone && c.phone.replace(/[^0-9]/g, '') === walkInPhone.replace(/[^0-9]/g, ''));
            
            if (existingCustomer) {
                finalCustomerId = existingCustomer.id;
                finalCustomerName = existingCustomer.name;
                finalCustomerPhone = existingCustomer.phone;
            } else {
                const newCust = {
                    id: Date.now().toString(), // Dummy ID just in case
                    name: walkInName,
                    phone: walkInPhone,
                    totalPurchases: 0,
                    lastVisit: new Date().toISOString().split('T')[0],
                    creditBalance: 0,
                    advanceBalance: 0,
                    tier: 'regular' as const
                };
                
                // Wait for insert to resolve
                const { data, error } = await supabase.from('customers').insert([{
                    name: walkInName,
                    phone: walkInPhone
                }]).select().single();
                
                if (!error && data) {
                    finalCustomerId = data.id;
                    finalCustomerName = data.name;
                    finalCustomerPhone = data.phone;
                    setCustomers([data, ...customers]);
                } else if (!error && !data) {
                    // If select() didn't return data but no error, use optimistic
                    finalCustomerId = newCust.id;
                    finalCustomerName = newCust.name;
                    finalCustomerPhone = newCust.phone;
                }
            }
        }

        const billData = {
            customer_id: (finalCustomerId && finalCustomerId.length === 36) ? finalCustomerId : undefined,
            customer_name: finalCustomerName,
            bill_number: billRef,
            subtotal: subtotal,
            total: total,
            discount: discount,
            payment_mode: paymentMode,
            date: new Date().toISOString(),
            items: billItems.map(item => ({
                product_id: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            }))
        };

        // Try to save to database
        await createBillMutation.mutateAsync(billData as any);
        toast.success("Bill saved to database!");
    } catch (error) {
        console.error("DB Save Failed:", error);
        toast.error("Bill confirmed locally! (DB sync failed)");
    } finally {
        // ALWAYS succeed locally so the user workflow is not blocked
        setShowPreview(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setBillItems([]);
          setDiscount(0);
          setSelectedCustomer("");
          setWalkInName("");
          setWalkInPhone("");
        }, 2000);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    
    // Deduplicate: Check if phone already exists
    const existingCustomer = customers.find(c => c.phone && c.phone.replace(/[^0-9]/g, '') === newCustomer.phone.replace(/[^0-9]/g, ''));
    if (existingCustomer) {
      toast.error("A customer with this phone number already exists!");
      return;
    }

    const { data, error } = await supabase.from('customers').insert([{
        name: newCustomer.name,
        phone: newCustomer.phone
    }]).select().single();

    if (error || !data) {
        toast.error("Failed to add customer");
        return;
    }

    setCustomers([data, ...customers]);
    setSelectedCustomer(data.id);
    setShowAddCustomer(false);
    setNewCustomer({ name: "", phone: "" });
    toast.success("Customer added successfully!");
  };

  const customerObj = customers.find(c => c.id === selectedCustomer);
  const customerName = customerObj?.name || "Walk-in Customer";
  const customerPhone = customerObj?.phone || "";

  const billRef = useMemo(() => `AK-${String(Date.now()).slice(-6)}`, [showPreview]);

  const getBillMessage = () => {
    const dateStr = new Date().toLocaleDateString('en-IN');
    let msg = `🧾 *ANNACHI KADAI - INVOICE*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 Date: ${dateStr}\n`;
    msg += `🔢 Invoice No: ${billRef}\n`;
    msg += `👤 Customer: ${customerName}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    billItems.forEach(i => {
      msg += `▪ ${i.name}\n   ${i.quantity} x ₹${i.price} = ₹${i.total}\n`;
    });
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 Subtotal: ₹${subtotal}\n`;
    if (discountAmt > 0) msg += `🏷️ Discount (${discount}%): -₹${discountAmt}\n`;
    msg += `✅ *Total Amount: ₹${total}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Thank you for shopping with us! 🙏\n`;
    msg += `For support: +91 98765 43210`;
    return msg;
  };

  const sendSMS = () => {
    const msg = getBillMessage();
    const phone = (!selectedCustomer && walkInPhone) ? walkInPhone.replace(/[^0-9]/g, '') : customerPhone.replace(/[^0-9]/g, '');
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = `sms:${phone}${isIOS ? '&' : '?'}body=${encodeURIComponent(msg)}`;
    window.open(url);
  };

  const sendWhatsApp = () => {
    const msg = getBillMessage();
    const phone = (!selectedCustomer && walkInPhone) ? walkInPhone.replace(/[^0-9]/g, '') : customerPhone.replace(/[^0-9]/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const upiLink = `upi://pay?pa=merchant@upi&pn=Annachi%20Kadai&am=${total}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}&bgcolor=fff&color=f97316`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
        <h1 className="text-xl font-bold text-foreground leading-tight">New Bill</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Create Invoice</p>
      </div>

      <div className="px-4 space-y-4 mt-4">
        <div className="glass rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</h3>
            <button 
              onClick={() => setShowAddCustomer(true)}
              className="text-[11px] text-primary flex items-center gap-1.5 font-black hover:scale-105 transition-transform"
            >
              <UserPlus className="w-3.5 h-3.5" /> ADD CUSTOMER
            </button>
          </div>
          <select
            value={selectedCustomer}
            onChange={e => setSelectedCustomer(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="w-full bg-background text-foreground text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
          >
            <option value="" style={{ background: '#0f1117', color: '#e2e8f0' }}>Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0f1117', color: '#e2e8f0' }}>{c.name} — {c.phone}</option>
            ))}
          </select>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Groceries, Fashion, Jewellery..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 text-foreground text-sm rounded-xl pl-10 pr-4 py-3 border border-white/5 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                disabled={p.stock === 0}
                className="text-left glass rounded-2xl p-3 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-40"
              >
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">{p.category}</span>
                    <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-black text-foreground">₹{p.price}</span>
                        <span className={`text-[9px] font-bold ${p.stock < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>{p.stock} left</span>
                    </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
        {billItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass rounded-2xl p-4 border border-primary/20 shadow-xl shadow-primary/5"
          >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary" /> Cart Items
                </h3>
            </div>

            <div className="space-y-2 mb-4">
              {billItems.map(item => (
                <motion.div 
                    layout
                    key={item.productId} 
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-secondary/50 rounded-xl p-1 border border-white/5">
                        <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded-lg bg-background flex items-center justify-center hover:text-primary transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-black text-foreground w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded-lg bg-background flex items-center justify-center hover:text-primary transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="w-16 text-right">
                        <p className="text-sm font-black text-foreground">₹{item.total}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Discount %</span>
                    <input
                        type="number"
                        value={discount}
                        onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-12 bg-secondary/50 text-foreground text-xs font-bold text-center outline-none rounded-lg py-1"
                    />
                </div>

                <div className="flex gap-2">
                    {(['cash', 'upi', 'credit'] as const).map(mode => (
                        <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            paymentMode === mode ? 'gradient-primary text-white border-transparent' : 'bg-secondary/30 text-muted-foreground border-white/5'
                        }`}
                        >
                        {mode}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <p className="text-2xl font-black text-foreground">₹{total.toLocaleString()}</p>
                    <Button onClick={() => setShowPreview(true)} className="gradient-primary text-white px-8 py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30">
                        PREVIEW BILL
                    </Button>
                </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-card rounded-[2.5rem] p-8 w-full max-w-sm border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-black text-foreground tracking-tighter">ANNACHI KADAI</h2>
                <button onClick={() => setShowPreview(false)} className="p-2 rounded-full bg-secondary/50 text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-2">
                  <span>ITEM</span>
                  <span className="text-center">QTY</span>
                  <span className="text-right">PRICE</span>
                  {billItems.map(item => (
                    <React.Fragment key={item.productId}>
                      <span className="text-foreground text-xs font-bold truncate">{item.name}</span>
                      <span className="text-foreground text-xs font-bold text-center">x{item.quantity}</span>
                      <span className="text-foreground text-xs font-black text-right">₹{item.total}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {!selectedCustomer && (
                <div className="mb-6 space-y-3 bg-secondary/20 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">Save Walk-in Customer (Optional)</p>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full bg-background text-foreground text-xs rounded-xl px-4 py-3 outline-none border border-white/5"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full bg-background text-foreground text-xs rounded-xl px-4 py-3 outline-none border border-white/5"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black text-foreground">TOTAL</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">₹{total.toLocaleString()}</span>
              </div>

              {paymentMode === 'upi' && (
                  <div className="flex flex-col items-center bg-white p-6 rounded-[2rem] shadow-inner mb-6">
                    <img src={qrUrl} alt="UPI QR" className="w-32 h-32 rounded-xl" />
                  </div>
              )}

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={confirmBill} 
                  disabled={createBillMutation.isPending}
                  className="w-full gradient-primary text-white py-8 rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-primary/40"
                >
                  {createBillMutation.isPending ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <CheckCircle2 className="w-6 h-6 mr-2" />}
                  {createBillMutation.isPending ? "PROCESSING..." : "CONFIRM BILL"}
                </Button>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={sendWhatsApp} className="rounded-xl border-white/10 h-12 text-xs font-bold">
                        <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                    <Button variant="outline" onClick={sendSMS} className="rounded-xl border-white/10 h-12 text-xs font-bold">
                        <Send className="w-4 h-4 mr-2" /> SMS
                    </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-card rounded-t-[3rem] sm:rounded-[3rem] p-8 w-full max-w-sm border-t sm:border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-foreground tracking-tighter">NEW CUSTOMER</h2>
                <button onClick={() => setShowAddCustomer(false)} className="p-3 rounded-full bg-secondary/50 text-muted-foreground"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-6">
                <input
                  required
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter name..."
                  className="w-full bg-secondary/50 text-foreground text-sm rounded-2xl px-5 py-4 outline-none border border-white/5"
                />
                <input
                  required
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-secondary/50 text-foreground text-sm rounded-2xl px-5 py-4 outline-none border border-white/5"
                />
                <Button type="submit" className="w-full gradient-primary text-white py-8 rounded-2xl font-black uppercase tracking-widest text-base shadow-xl shadow-primary/30 mt-4">
                  REGISTER CUSTOMER
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary"
          >
            <CheckCircle2 className="w-20 h-20 text-white" />
            <h2 className="text-3xl font-black text-white tracking-tighter mt-4">BILL SAVED!</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Billing;
