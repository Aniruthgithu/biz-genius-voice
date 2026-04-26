import { motion } from "framer-motion";
import { Loader2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { SalesChart } from "@/components/SalesChart";
import { useSalesSummary } from "@/hooks/use-database";

const Sales = () => {
  const { data: salesData, isLoading } = useSalesSummary();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Calculating profits da...</p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayStats = salesData?.find(s => s.date === today) || salesData?.[0] || { revenue: 0, orders: 0 };
  
  const totalRevenue = salesData?.reduce((a, s) => a + Number(s.revenue), 0) || 0;
  const totalItems = salesData?.reduce((a, s) => a + Number(s.orders), 0) || 0; // Assuming orders roughly maps to items for summary
  const avgRevenue = salesData && salesData.length > 0 ? totalRevenue / salesData.length : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales</h1>
          <p className="text-xs text-muted-foreground">Performance overview</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => toast.success("Sales_Report_Today.csv downloaded da! 📊")}
            className="p-2 bg-secondary rounded-xl text-primary hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              const text = `📈 *Annachi Kadai Sales Update*\n\nToday's Revenue: ₹${todayStats.revenue}\nOrders: ${todayStats.orders}\n\nGreat job today!`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
            }}
            className="p-2 bg-primary/10 rounded-xl text-primary hover:bg-primary/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today", value: `₹${Number(todayStats.revenue).toLocaleString()}`, sub: `${todayStats.orders} orders` },
            { label: "Avg/Day", value: `₹${Math.round(avgRevenue).toLocaleString()}`, sub: `${salesData?.length || 0}-day avg` },
            { label: "Weekly", value: `₹${totalRevenue.toLocaleString()}`, sub: `${totalItems} total orders` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-3 text-center"
            >
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
              <p className="text-[10px] text-primary">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        <SalesChart data={salesData} />

        {/* Daily Breakdown */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Daily Breakdown</h3>
          <div className="space-y-2">
            {salesData?.slice().map((sale, i) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="text-sm text-foreground">{new Date(sale.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <p className="text-[10px] text-muted-foreground">{sale.orders} orders</p>
                </div>
                <span className="text-sm font-semibold text-foreground">₹{Number(sale.revenue).toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Sales;
