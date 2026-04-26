import { Home, Receipt, Package, Users, Bell, BarChart3, CalendarDays, Megaphone, CreditCard, Settings, BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/use-database";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Receipt, label: "Billing", path: "/billing" },
  { icon: BookOpen, label: "Saved Bills", path: "/saved-bills" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: BarChart3, label: "Sales", path: "/sales" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: CalendarDays, label: "Events", path: "/events" },
  { icon: Bell, label: "Alerts", path: "/notifications" },
  { icon: Megaphone, label: "Marketing", path: "/marketing" },
  { icon: CreditCard, label: "Credit", path: "/credit" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const { data: notifications } = useNotifications();
  
  const hasUnread = notifications?.some(n => !n.read) || false;

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/50 safe-area-bottom">
      <div
        ref={scrollRef}
        className="flex items-center gap-1 py-2 px-2 max-w-lg mx-auto overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              ref={active ? activeRef : null}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors shrink-0 min-w-[56px]"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 relative z-10 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {path === "/notifications" && hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background z-20 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] relative z-10 font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
