import React, { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Package, Clock, Brain, CalendarDays, CreditCard, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useNotifications } from "@/hooks/use-database";

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  stock: { icon: Package, color: "text-warning" },
  expiry: { icon: Clock, color: "text-destructive" },
  ai: { icon: Brain, color: "text-primary" },
  event: { icon: CalendarDays, color: "text-info" },
  payment: { icon: CreditCard, color: "text-accent" },
};

const Notifications = () => {
  const { data: notifications, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Checking your alerts da...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8">
        <h1 className="text-xl font-black text-foreground mb-1">Alerts & Notifications</h1>
        <p className="text-xs text-muted-foreground">{notifications?.filter(n => !n.read).length || 0} unread</p>
      </div>

      <div className="px-4 space-y-2">
        {notifications?.map((notif, i) => {
          const config = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.ai;
          const Icon = config.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass rounded-xl p-4 flex items-start gap-3 ${!notif.read ? 'border-l-2 border-l-primary' : 'opacity-70'}`}
            >
              <div className="p-2 rounded-lg bg-secondary shrink-0">
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">{notif.title}</h4>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
              </div>
              {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </motion.div>
          );
        })}
        {notifications?.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground italic">No notifications yet da. Shop is peaceful!</div>
        )}
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Notifications;
