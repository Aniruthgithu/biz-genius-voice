import { motion } from "framer-motion";
import { Search, ArrowLeft, Calendar, FileText, IndianRupee, ChevronRight, Share2, Printer, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useBills } from "@/hooks/use-database";
import { Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const SavedBills = () => {
  const navigate = useNavigate();
  const { data: bills, isLoading, isError } = useBills();
  const [search, setSearch] = useState("");

  const filteredBills = bills?.filter(b => {
    const billNum = b.bill_number || b.id || "";
    const custName = b.customer_name || "Walk-in Customer";
    return billNum.toLowerCase().includes(search.toLowerCase()) ||
           custName.toLowerCase().includes(search.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Fetching your records da...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-white/5">
        <button 
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground leading-tight">Saved Bills</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Transaction History</p>
        </div>
        <button className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Bill # or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary/50 rounded-2xl pl-10 pr-4 py-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 border border-white/5 transition-all"
          />
        </div>
      </div>

      <div className="px-4 space-y-3 pb-8">
        {filteredBills.length > 0 ? (
          filteredBills.map((bill, i) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-3xl p-4 border border-white/5 group active:scale-[0.98] transition-all hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-black text-foreground">{bill.bill_number || `AK-${bill.id.slice(-4)}`}</h3>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        bill.payment_method === 'upi' ? 'bg-success/10 text-success border border-success/20' : 
                        bill.payment_method === 'credit' ? 'bg-warning/10 text-warning border border-warning/20' : 
                        'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {bill.payment_method}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold">{bill.customer_name || "Walk-in Customer"}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-muted-foreground/60">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(bill.created_at || bill.date).toLocaleDateString()} • {new Date(bill.created_at || bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center text-primary font-black text-base">
                    <IndianRupee className="w-3 h-3" />
                    <span>{(bill.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText className="w-10 h-10" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">No Bills Found</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SavedBills;
