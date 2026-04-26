import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useCustomers, useCreditEntries } from "@/hooks/use-database";

const Credit = () => {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: creditEntries, isLoading: creditsLoading } = useCreditEntries();

  if (customersLoading || creditsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Checking the accounts book da...</p>
      </div>
    );
  }

  const totalCredit = customers?.reduce((a, c) => a + Number(c.credit_balance), 0) || 0;
  const totalAdvance = customers?.reduce((a, c) => a + Number(c.advance_balance), 0) || 0;
  const pendingCustomers = customers?.filter(c => Number(c.credit_balance) > 0) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8">
        <h1 className="text-xl font-bold text-foreground">Credit & Payments</h1>
        <p className="text-xs text-muted-foreground">Track money owed & advances</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 text-center border-l-4 border-l-destructive">
            <ArrowUpCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Total Credit Given</p>
            <p className="text-xl font-bold text-foreground">₹{totalCredit.toLocaleString()}</p>
            <p className="text-[10px] text-destructive">{pendingCustomers.length} pending</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-4 text-center border-l-4 border-l-success">
            <ArrowDownCircle className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Advances Received</p>
            <p className="text-xl font-bold text-foreground">₹{totalAdvance.toLocaleString()}</p>
            <p className="text-[10px] text-success">{customers?.filter(c => Number(c.advance_balance) > 0).length} customers</p>
          </motion.div>
        </div>

        {/* Pending Credits */}
        {pendingCustomers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />Pending Credits
            </h3>
            <div className="space-y-2">
              {pendingCustomers.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">₹{Number(c.credit_balance).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">pending</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Ledger */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />Transaction Ledger
          </h3>
          <div className="glass rounded-xl overflow-hidden">
            {creditEntries && creditEntries.length > 0 ? creditEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 flex items-center gap-3 border-b border-border/30 last:border-0"
              >
                <div className={`p-1.5 rounded-lg ${entry.type === 'payment' ? 'bg-success/10' : entry.type === 'advance' ? 'bg-info/10' : 'bg-destructive/10'}`}>
                  {entry.type === 'payment' ? (
                    <ArrowDownCircle className="w-4 h-4 text-success" />
                  ) : entry.type === 'advance' ? (
                    <ArrowDownCircle className="w-4 h-4 text-info" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-xs font-semibold text-foreground truncate">{entry.customer_name || 'Walk-in'}</p>
                    <p className={`text-sm font-bold ${entry.type === 'credit' ? 'text-destructive' : 'text-success'}`}>
                      {entry.type === 'credit' ? '+' : '-'}₹{Number(entry.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{entry.note}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="p-8 text-center text-xs text-muted-foreground italic">No entries yet da.</div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Credit;
