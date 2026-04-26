import { motion } from "framer-motion";
import { LucideIcon, Crown, Star, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useCustomers } from "@/hooks/use-database";

const tierConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  platinum: { icon: Crown, color: "text-primary", bg: "gradient-primary" },
  gold: { icon: Star, color: "text-warning", bg: "gradient-warm" },
  regular: { icon: User, color: "text-muted-foreground", bg: "bg-secondary" },
};

const Customers = () => {
  const navigate = useNavigate();
  const { data: customers, isLoading } = useCustomers();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Getting your customer list da...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8">
        <h1 className="text-xl font-bold text-foreground">Customers</h1>
        <p className="text-xs text-muted-foreground">{customers?.length || 0} active customers</p>
      </div>

      <div className="px-4 space-y-3">
        {customers?.map((customer, i) => {
          const config = tierConfig[customer.tier as 'regular' | 'gold' | 'platinum'] || tierConfig.regular;
          const TierIcon = config.icon;
          return (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                  <TierIcon className={`w-5 h-5 ${customer.tier === 'regular' ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground truncate">{customer.name}</h4>
                    <span className="text-xs text-primary font-medium capitalize">{customer.tier}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{customer.phone}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">Total: <strong className="text-foreground">₹{Number(customer.total_purchases).toLocaleString()}</strong></span>
                    <span className="text-xs text-muted-foreground">Score: <strong className="text-warning">{Math.floor(Number(customer.total_purchases) / 1000)}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customer.preferences?.map((pref: string) => (
                      <span key={pref} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{pref}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Customers;
