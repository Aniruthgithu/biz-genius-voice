import { motion } from "framer-motion";
import { IndianRupee, ShoppingCart, TrendingUp, Users, Wallet, BarChart3, Clock, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { StatCard } from "@/components/StatCard";
import { InsightCard } from "@/components/InsightCard";
import { SalesChart } from "@/components/SalesChart";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useSalesSummary, useProducts, useAIInsights, useCustomers } from "@/hooks/use-database";
import { Loader2 } from "lucide-react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  if (hour < 21) return "Good evening 🌆";
  return "Good night 🌙";
};

const Index = () => {
  const navigate = useNavigate();
  const greeting = getGreeting();
  
  const { data: salesSummary, isLoading: salesLoading } = useSalesSummary();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: insights, isLoading: insightsLoading } = useAIInsights();
  const { data: customers, isLoading: customersLoading } = useCustomers();

  if (salesLoading || productsLoading || insightsLoading || customersLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Loading your dashboard da...</p>
      </div>
    );
  }

  const lowStockCount = products?.filter(p => p.stock < 10).length || 0;
  const expiringSoonCount = products?.filter(p => {
    if (!p.expiry_date) return false;
    const days = (new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 5;
  }).length || 0;

  const latestStats = salesSummary?.[0] || { revenue: 0, orders: 0, profit: 0, new_customers: 0 };
  const healthScore = 75; // Calculate or fetch this

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative overflow-hidden bg-primary/5">
        <div className="relative p-4 pt-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{greeting}</p>
            <h1 className="text-2xl font-black text-foreground mt-0.5">Biz AI</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Your Business on Auto-Pilot</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-5 flex items-center gap-5 border border-white/5 shadow-xl"
        >
          <HealthScoreRing score={healthScore} size={110} />
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Shop Health</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span>Sales trending up</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                <span>{lowStockCount} items low stock</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span>{expiringSoonCount} items expiring</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 border border-primary/20 shadow-2xl shadow-primary/5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Daily Summary</h3>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">TODAY</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Bills Sold", value: latestStats.orders.toString(), icon: "🧾", color: "text-primary" },
              { label: "Revenue", value: `₹${latestStats.revenue.toLocaleString()}`, icon: "💰", color: "text-success" },
              { label: "Profit", value: `₹${latestStats.profit.toLocaleString()}`, icon: "📈", color: "text-emerald-400" },
              { label: "Total Customers", value: (customers?.length || 0).toString(), icon: "👤", color: "text-amber-400" },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/30 rounded-2xl p-3 flex items-center gap-3 border border-white/5">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{item.label}</p>
                  <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Today's Revenue" value={`₹${latestStats.revenue.toLocaleString()}`} change={12} icon={IndianRupee} delay={0.3} />
          <StatCard title="Orders" value={latestStats.orders.toString()} change={8} icon={ShoppingCart} delay={0.35} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "New Bill", icon: ShoppingCart, path: "/billing", gradient: "gradient-primary" },
            { label: "Reports", icon: BarChart3, path: "/reports", gradient: "gradient-accent" },
            { label: "Credit", icon: Wallet, path: "/credit", gradient: "gradient-warm" },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              onClick={() => navigate(action.path)}
              className={`${action.gradient} rounded-2xl p-4 text-center text-white shadow-lg active:scale-95 transition-transform`}
            >
              <action.icon className="w-6 h-6 mx-auto mb-1.5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <div onClick={() => navigate('/sales')} className="cursor-pointer">
          <SalesChart />
        </div>

        <div>
          <button 
            onClick={() => navigate('/ai-insights')}
            className="w-full flex items-center justify-between mb-4 group px-1"
          >
            <h3 className="text-xs font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-primary" /> AI Insights
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-primary font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
              View All <ChevronRight className="w-3 h-3" />
            </span>
          </button>
          <div className="space-y-3">
            {insights?.slice(0, 2).map((insight: any, i: number) => (
              <div key={insight.id} onClick={() => navigate('/ai-insights')} className="cursor-pointer">
                <InsightCard insight={insight} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Index;
