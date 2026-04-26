import { motion } from "framer-motion";
import { Brain, ArrowLeft, TrendingUp, AlertTriangle, Lightbulb, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAIInsights } from "@/hooks/use-database";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";

const AIInsights = () => {
  const navigate = useNavigate();
  const { data: insights, isLoading } = useAIInsights();

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-success/10 text-success border-success/20';
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'decision': return Brain;
      case 'alert': return AlertTriangle;
      case 'prediction': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const handleExecute = (insight: any) => {
    const route = insight.action_route;
    const actionData = insight.action_data || insight.actionData;

    if (route === '/billing') {
      toast.success(`Applying: ${insight.actionable} ✨`);
      setTimeout(() => navigate('/billing', { state: { actionData } }), 600);
    } else if (route === '/inventory') {
      toast.success(`Going to Inventory da! 📦`);
      setTimeout(() => navigate('/inventory'), 600);
    } else if (route === '/reports') {
      toast.success(`Opening Reports 📊`);
      setTimeout(() => navigate('/sales'), 600);
    } else if (route === '/marketing') {
      toast.success(`Opening Marketing 📣`);
      setTimeout(() => navigate('/marketing'), 600);
    } else {
      // Legacy fallback
      if (actionData) {
        toast.success(`Applying action ✨`);
        setTimeout(() => navigate('/billing', { state: { actionData } }), 600);
      } else {
        toast.info("Action noted da! 👍");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Consulting Biz AI...</p>
      </div>
    );
  }

  const aiInsights = insights || [];
  const highPriority = aiInsights.filter((i: any) => i.priority?.toLowerCase() === 'high');
  const mediumPriority = aiInsights.filter((i: any) => i.priority?.toLowerCase() === 'medium');
  const lowPriority = aiInsights.filter((i: any) => !['high', 'medium'].includes(i.priority?.toLowerCase()));

  const Section = ({ title, items, delay }: { title: string, items: any[], delay: number }) => (
    items.length > 0 ? (
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-1 flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> {title}
        </h2>
        {items.map((insight, i) => {
          const Icon = getIcon(insight.type);
          const hasAction = insight.actionable || insight.action_text;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + i * 0.1 }}
              className="glass rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group shadow-xl hover:bg-white/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${getPriorityColor(insight.priority)} border shadow-inner`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground leading-tight">{insight.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{insight.type}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {insight.created_at ? new Date(insight.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`text-[8px] font-black px-2.5 py-1 rounded-full border ${getPriorityColor(insight.priority)} uppercase tracking-[0.1em]`}>
                  {insight.priority}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4 pr-2 font-medium">
                {insight.message}
              </p>

              {hasAction && (
                <button 
                  onClick={() => handleExecute(insight)}
                  className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-2xl px-5 py-3.5 text-[11px] font-black flex items-center justify-between transition-all group/btn shadow-lg shadow-primary/5 active:scale-95"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4" />
                    {(insight.actionable || insight.action_text).toUpperCase()}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              )}
              
              {/* Decorative background element */}
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all" />
            </motion.div>
          );
        })}
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 pt-8 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-white/5">
        <button 
          onClick={() => navigate("/")} 
          className="w-10 h-10 rounded-full glass flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-foreground tracking-tight">AI Insights</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Intelligent Partner</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Premium summary card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gradient-primary rounded-[2.5rem] p-6 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group"
        >
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg border border-white/20 group-hover:rotate-12 transition-transform">
              <Brain className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight tracking-tight">Biz AI has {aiInsights.length} strategies for you</h2>
              <p className="text-xs text-white/80 mt-1 font-medium italic">"Helping you grow Annachi Kadai, one insight at a time."</p>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl pointer-events-none" />
        </motion.div>

        <Section title="Critical Focus" items={highPriority} delay={0.1} />
        <Section title="Growth Opportunities" items={mediumPriority} delay={0.2} />
        <Section title="Daily Tips" items={lowPriority} delay={0.3} />
        
        {aiInsights.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest">No Insights Today</p>
                <p className="text-xs mt-1">Check back later for fresh recommendations da!</p>
            </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AIInsights;
