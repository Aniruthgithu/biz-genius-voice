import { motion } from "framer-motion";
import { AlertTriangle, Brain, TrendingUp, Lightbulb, ChevronRight } from "lucide-react";
import type { AIInsight } from "@/data/dummyData";

const icons = {
  decision: Brain,
  alert: AlertTriangle,
  prediction: TrendingUp,
  tip: Lightbulb,
};

const colors = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-primary",
};

export const InsightCard = ({ insight, index }: { insight: AIInsight; index: number }) => {
  const Icon = icons[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`glass rounded-xl p-4 border-l-4 ${colors[insight.priority]} cursor-pointer hover:bg-secondary/50 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-secondary shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{insight.title}</h4>
            <span className="text-[10px] text-muted-foreground shrink-0">{insight.timestamp}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.message}</p>
          {insight.actionable && (
            <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {insight.actionable} <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
