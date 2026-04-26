import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Login from "./pages/Login";
import Index from "./pages/Index.tsx";
import Billing from "./pages/Billing.tsx";
import Inventory from "./pages/Inventory.tsx";
import Sales from "./pages/Sales.tsx";
import Customers from "./pages/Customers.tsx";
import CustomerDetail from "./pages/CustomerDetail.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Events from "./pages/Events.tsx";
import Notifications from "./pages/Notifications.tsx";
import Reports from "./pages/Reports.tsx";
import Marketing from "./pages/Marketing.tsx";
import Credit from "./pages/Credit.tsx";
import Settings from "./pages/Settings.tsx";
import SavedBills from "./pages/SavedBills.tsx";
import AIInsights from "./pages/AIInsights.tsx";
import NotFound from "./pages/NotFound.tsx";
import { StockAlertChecker } from "./components/StockAlertChecker";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <StockAlertChecker />
        {session ? (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/:id" element={<ProductDetail />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/credit" element={<Credit />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/saved-bills" element={<SavedBills />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        ) : (
          <Login />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
