import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ArrowLeft, Crown, Star, User, Phone, Calendar, CreditCard, ShoppingBag, Loader2, X, Plus, Minus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useCustomers, useBills, useCreditEntries, useManageBalance } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";

const tierConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  platinum: { icon: Crown, color: "text-primary", bg: "gradient-primary" },
  gold: { icon: Star, color: "text-warning", bg: "gradient-warm" },
  regular: { icon: User, color: "text-muted-foreground", bg: "bg-secondary" },
};

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: bills, isLoading: billsLoading } = useBills(id);
  const { data: creditEntries, isLoading: creditsLoading } = useCreditEntries(id);
  const manageBalanceMutation = useManageBalance();

  const [showManageModal, setShowManageModal] = useState(false);
  const [manageType, setManageType] = useState<'payment' | 'advance'>('payment');
  const [manageAmount, setManageAmount] = useState("");
  const [manageNote, setManageNote] = useState("");

  const customer = customers?.find(c => c.id === id);

  const handleManageBalance = async () => {
    if (!manageAmount || isNaN(Number(manageAmount)) || Number(manageAmount) <= 0) return;
    if (!id) return;
    
    await manageBalanceMutation.mutateAsync({
      customerId: id,
      amount: Number(manageAmount),
      type: manageType,
      note: manageNote || (manageType === 'payment' ? 'Credit Repayment' : 'Advance Added')
    });
    
    setShowManageModal(false);
    setManageAmount("");
    setManageNote("");
  };

  if (customersLoading || billsLoading || creditsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Fetching customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">Go Back</button>
      </div>
    );
  }

  const config = tierConfig[customer.tier as 'regular' | 'gold' | 'platinum'] || tierConfig.regular;
  const TierIcon = config.icon;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /><span className="text-xs">Back</span>
        </button>
        <button onClick={() => setShowManageModal(true)} className="text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
          Manage Balance
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${config.bg}`}>
            <TierIcon className={`w-8 h-8 ${customer.tier === 'regular' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
          </div>
          <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
          <p className="text-xs text-primary font-medium capitalize">{customer.tier} Customer</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{customer.phone}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Spent", value: `₹${Number(customer.total_purchases).toLocaleString()}`, icon: ShoppingBag, color: "text-primary" },
            { label: "Credit Score", value: Math.floor(Number(customer.total_purchases) / 1000).toString(), icon: Star, color: "text-warning" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-3 text-center flex flex-col items-center justify-center">
              <s.icon className={`w-4 h-4 ${s.color} mb-1`} />
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Preferences */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Frequent Products</h3>
          <div className="flex flex-wrap gap-2">
            {customer.preferences?.map((p: string) => (
              <span key={p} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
            ))}
          </div>
        </div>

        {/* Purchase History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Purchase History</h3>
          {bills && bills.length > 0 ? (
            <div className="space-y-2">
              {bills.map((bill, i) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass rounded-xl p-3"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">#{bill.bill_number}</span>
                    <span className="text-xs font-bold text-foreground">₹{bill.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-muted-foreground">{bill.items?.map((item: { name: string }) => item.name).join(', ')}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(bill.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground glass rounded-xl p-4 text-center">No purchase records yet</p>
          )}
        </div>

        {/* Credit History */}
        {creditEntries && creditEntries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Credit History</h3>
            <div className="space-y-2">
              {creditEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground capitalize">{entry.type}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.note}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${entry.type === 'credit' ? 'text-destructive' : 'text-success'}`}>
                      {entry.type === 'credit' ? '+' : '-'}₹{entry.amount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showManageModal && (
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
              className="bg-card rounded-[2rem] p-6 w-full max-w-sm border border-white/10 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-foreground">Manage Balance</h2>
                <button onClick={() => setShowManageModal(false)} className="p-2 rounded-full bg-secondary/50 text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setManageType('payment')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    manageType === 'payment' ? 'gradient-primary text-white border-transparent' : 'bg-secondary/30 text-muted-foreground border-white/5'
                  }`}
                >
                  Receive Payment
                </button>
                <button
                  onClick={() => setManageType('advance')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    manageType === 'advance' ? 'gradient-primary text-white border-transparent' : 'bg-secondary/30 text-muted-foreground border-white/5'
                  }`}
                >
                  Add Advance
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    value={manageAmount}
                    onChange={e => setManageAmount(e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-sm font-bold rounded-xl px-4 py-3 outline-none border border-white/5"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 block">Note (Optional)</label>
                  <input
                    type="text"
                    value={manageNote}
                    onChange={e => setManageNote(e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 outline-none border border-white/5"
                    placeholder="e.g. Paid in cash"
                  />
                </div>
              </div>

              <Button
                onClick={handleManageBalance}
                disabled={manageBalanceMutation.isPending}
                className="w-full mt-6 gradient-primary text-white py-6 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/30"
              >
                {manageBalanceMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Transaction"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default CustomerDetail;
