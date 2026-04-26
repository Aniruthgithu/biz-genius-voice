import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  delay?: number;
}

export const StatCard = ({ title, value, change, icon: Icon, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass rounded-xl p-4 flex items-start gap-3"
  >
    <div className="p-2.5 rounded-lg gradient-primary shrink-0">
      <Icon className="w-4 h-4 text-primary-foreground" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{title}</p>
      <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-0.5 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs yesterday
        </p>
      )}
    </div>
  </motion.div>
);
