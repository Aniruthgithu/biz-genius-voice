import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Tag, Package, Percent, MessageSquare, Plus, Sparkles,
  Send, Loader2, X, Phone, Mail, Users, TrendingUp, Zap, Gift, Star, Store
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useOffers, useProducts, useCustomers, useSalesSummary } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Offer } from "@/data/dummyData";
import { toast } from "sonner";

const statusConfig: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  active:    { color: "text-success",          bg: "bg-success/10",          label: "Active",    dot: "bg-success" },
  scheduled: { color: "text-blue-400",         bg: "bg-blue-400/10",         label: "Scheduled", dot: "bg-blue-400" },
  expired:   { color: "text-muted-foreground", bg: "bg-secondary",           label: "Expired",   dot: "bg-muted-foreground" },
};

const typeIcon: Record<string, any> = {
  discount: Percent,
  combo: Package,
  bogo: Tag,
  campaign: Megaphone,
};

const typeColor: Record<string, string> = {
  discount: "text-amber-400 bg-amber-400/10",
  combo: "text-blue-400 bg-blue-400/10",
  bogo: "text-emerald-400 bg-emerald-400/10",
  campaign: "text-primary bg-primary/10",
};



const Marketing = () => {
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showNewOffer, setShowNewOffer] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"offers" | "campaigns" | "reach">("offers");
  const { data: offers, isLoading } = useOffers();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const [localOffers, setLocalOffers] = useState<Offer[]>([]);

  const [broadcastQueue, setBroadcastQueue] = useState<any[]>([]);
  const [broadcastOffer, setBroadcastOffer] = useState<Offer | null>(null);
  const [currentBroadcastIndex, setCurrentBroadcastIndex] = useState(0);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const { data: salesSummary } = useSalesSummary();

  const dynamicOffers = useMemo(() => {
    if (!products || products.length === 0) return [];
    const dynOffers: Offer[] = [];
    
    // 1. Expiry offer (expanded to 14 days)
    const expiring = products.filter(p => {
        if (!p.expiry_date) return false;
        const days = (new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 14;
    });
    if (expiring.length > 0) {
      dynOffers.push({
        id: 'dyn_expiry',
        title: 'Clearance Sale (Up to 30% Off)!',
        description: `Massive discounts on items nearing expiry. Quality assured, prices slashed!`,
        type: 'campaign',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        target_products: expiring.map(p => p.name).slice(0, 5)
      } as Offer);
    }

    // 2. Overstock offer (Adjusted threshold for smaller shops)
    const overstock = products.filter(p => p.stock > 15);
    if (overstock.length > 0) {
      dynOffers.push({
        id: 'dyn_overstock',
        title: 'Bulk Discount Special!',
        description: `Buy more, save more on our fully stocked items! Grab them before they're gone.`,
        type: 'discount',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        target_products: overstock.map(p => p.name).slice(0, 5)
      } as Offer);
    }
    
    // 3. Sales Data: Smart Combo (Pair Top Seller with Slow Mover)
    const sortedBySales = [...products].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0));
    const topSellers = sortedBySales.slice(0, 3);
    const slowMovers = sortedBySales.filter(p => p.stock > 0).reverse().slice(0, 3);
    
    if (topSellers.length > 0 && slowMovers.length > 0 && topSellers[0].id !== slowMovers[0].id) {
        dynOffers.push({
            id: 'dyn_combo',
            title: 'Smart Combo Deal!',
            description: `Pair your best-selling ${topSellers[0].name} with ${slowMovers[0].name} to clear out slow-moving inventory quickly!`,
            type: 'combo',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            target_products: [topSellers[0].name, slowMovers[0].name]
        } as Offer);
    }

    // 4. Sales Data: Dead Stock Alert (High stock, zero or very low sales)
    const deadStock = products.filter(p => p.stock > 5 && (p.total_sold === 0 || !p.total_sold));
    if (deadStock.length > 0) {
        dynOffers.push({
            id: 'dyn_bogo',
            title: 'Buy 1 Get 1 Free!',
            description: `Generate interest in untouched inventory by offering a BOGO deal on these items.`,
            type: 'bogo',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 5 * 86400000).toISOString(),
            target_products: deadStock.map(p => p.name).slice(0, 3)
        } as Offer);
    }

    return dynOffers;
  }, [products]);

  if (isLoading || productsLoading || customersLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Loading marketing hub da...</p>
      </div>
    );
  }

  const combinedOffers = [...localOffers, ...(offers || []), ...dynamicOffers];
  const activeOffers = combinedOffers.filter(o => o.status === "active");

  const whatsappReach = customers?.filter(c => c.phone).length || 0;
  const totalCustomers = customers?.length || 0;
  const totalOffersCount = offers?.length || 0;
  // Let's define "New" customers as those created within the last 30 days. If created_at isn't available, we just guess 0.
  const newCustomersCount = customers?.filter(c => c.created_at && (Date.now() - new Date(c.created_at).getTime() < 30 * 24 * 60 * 60 * 1000)).length || 0;
  const regularCustomersCount = totalCustomers - newCustomersCount;

  const shareOffer = (offer: Offer) => {
    const text = encodeURIComponent(
      `🎉 *Annachi Kadai Special Offer!*\n\n*${offer.title}*\n${offer.description}\n\n*Products:* ${offer.target_products?.join(", ") || "Various"}\n\nVisit us today!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("Opening WhatsApp da!");
  };

  const getBroadcastText = () => {
    let text = `🎉 *Annachi Kadai – Today's Special Offers!*\n\n`;
    
    if (broadcastOffer) {
        text = `🎉 *Annachi Kadai Special Offer!*\n\n🔹 *${broadcastOffer.title}*\n${broadcastOffer.description}\n`;
        if (broadcastOffer.target_products && broadcastOffer.target_products.length > 0) {
            text += `*Items:* ${broadcastOffer.target_products.join(", ")}\n`;
        }
        text += `\nThank you for your support! 🙏`;
        return text;
    }

    if (activeOffers.length > 0) {
      activeOffers.forEach(o => { 
        text += `🔹 *${o.title}*\n${o.description}\n`;
        if (o.target_products && o.target_products.length > 0) {
            text += `*Items:* ${o.target_products.join(", ")}\n`;
        }
        text += `\n`;
      });
    } else {
      text += `Visit our store today for surprise discounts!\n\n`;
    }
    text += `Thank you for your support!`;
    return text;
  };

  const startBroadcastQueue = (offer?: Offer) => {
    if (!customers || customers.length === 0) {
        toast.error("No saved customers found!");
        return;
    }
    const customersWithPhones = customers.filter(c => c.phone);
    if (customersWithPhones.length === 0) {
        toast.error("No customers with valid phone numbers!");
        return;
    }
    setBroadcastOffer(offer || null);
    setBroadcastQueue(customersWithPhones);
    setCurrentBroadcastIndex(0);
    setShowBroadcast(true);
  };

  const sendNextBroadcast = () => {
      if (currentBroadcastIndex >= broadcastQueue.length) {
          setShowBroadcast(false);
          toast.success("All broadcasts sent da! 🚀");
          return;
      }
      const customer = broadcastQueue[currentBroadcastIndex];
      const phone = customer.phone.replace(/[^0-9]/g, '');
      const text = getBroadcastText();
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      
      setCurrentBroadcastIndex(prev => prev + 1);
  };



  const sendSMS = () => {
    const text = "🎉 Annachi Kadai Special Offer! Visit us today for great deals. Thank you for your support! 🙏";
    window.open(`sms:?body=${encodeURIComponent(text)}`, "_blank");
    setShowSms(false);
    toast.success("Opening SMS app da! 📱");
  };

  const sendEmail = () => {
    const subject = "Special Offers from Annachi Kadai!";
    const body = "Dear Customer,\n\nWe have exciting offers for you! Visit us today for surprise discounts.\n\nThank you for your continuous support.\n\nBest Regards,\nAnnachi Kadai";
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    setShowEmail(false);
    toast.success("Opening Email app da! 📧");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="p-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground">Marketing</h1>
            <p className="text-xs text-muted-foreground">Offers, campaigns & customer reach</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewOffer(true)}
            className="gradient-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/30"
          >
            <Plus className="w-4 h-4" /> New Offer
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Active Offers", value: activeOffers.length.toString(), icon: Zap, color: "text-primary" },
            { label: "Total Offers", value: totalOffersCount.toString(), icon: Tag, color: "text-amber-400" },
            { label: "Reach Est.", value: totalCustomers.toString(), icon: Users, color: "text-emerald-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-3 text-center"
            >
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
              <p className={`text-base font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex bg-secondary/50 rounded-2xl p-1">
          {(["offers", "campaigns", "reach"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? "gradient-primary text-primary-foreground shadow" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* OFFERS TAB */}
        {activeTab === "offers" && (
          <>
            {/* AI Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 border border-primary/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg gradient-primary">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-foreground">AI Marketing Ideas</h3>
                <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">SMART</span>
              </div>
              <div className="space-y-2">
                {dynamicOffers.length > 0 ? dynamicOffers.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-pointer group"
                    onClick={() => shareOffer(s)}
                  >
                    <span className="text-lg mt-0.5">{s.type === 'discount' ? '📦' : '📅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startBroadcastQueue(s); }}
                      className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Broadcast
                    </button>
                  </motion.div>
                )) : (
                  <p className="text-xs text-muted-foreground italic p-2">No AI suggestions at the moment. Keep your inventory updated!</p>
                )}
              </div>
            </motion.div>

            {/* Current Offers */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                Current Offers
                {activeOffers.length > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold">
                    {activeOffers.length} ACTIVE
                  </span>
                )}
                {activeOffers.length > 0 && (
                  <button
                    onClick={() => startBroadcastQueue()}
                    className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Send className="w-3 h-3" /> Broadcast All
                  </button>
                )}
              </h3>
              <div className="space-y-3">
                {combinedOffers.map((offer, i) => {
                  const status = statusConfig[offer.status as keyof typeof statusConfig] || statusConfig.expired;
                  const Icon = typeIcon[offer.type as keyof typeof typeIcon] || Percent;
                  const iconColor = typeColor[offer.type as keyof typeof typeColor] || "text-primary bg-primary/10";
                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${iconColor} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 className="text-sm font-bold text-foreground">{offer.title}</h4>
                            <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${status.bg} ${status.color} font-bold`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{offer.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {offer.target_products?.map((p: string) => (
                              <span key={p} className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(offer.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} —{" "}
                              {new Date(offer.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </p>
                            <button
                              onClick={() => startBroadcastQueue(offer)}
                              className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Send className="w-3 h-3" />Broadcast
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {combinedOffers.length === 0 && (
                  <div className="glass rounded-2xl p-10 text-center">
                    <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No offers yet da!</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Click "+ New Offer" to create one</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* WhatsApp Broadcast */}
            <div className="glass rounded-2xl p-5 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">WhatsApp Broadcast</h3>
                  <p className="text-[10px] text-muted-foreground">Send bulk offers to all customers</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-base font-black text-emerald-400">{activeOffers.length}</p>
                  <p className="text-[9px] text-muted-foreground">Active Offers</p>
                </div>
                <div className="bg-secondary/40 rounded-xl p-3 text-center">
                  <p className="text-base font-black text-primary">{totalCustomers}</p>
                  <p className="text-[9px] text-muted-foreground">Customers</p>
                </div>
              </div>
              <Button
                onClick={() => startBroadcastQueue()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 rounded-xl"
              >
                <Send className="w-4 h-4" />
                Broadcast All Active Offers
              </Button>
            </div>

            {/* SMS Campaign */}
            <div className="glass rounded-2xl p-5 border border-blue-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-400/15 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">SMS Campaign</h3>
                  <p className="text-[10px] text-muted-foreground">Reach customers without internet</p>
                </div>
              </div>
              <Button
                onClick={() => setShowSms(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold gap-2 rounded-xl"
              >
                <Phone className="w-4 h-4" />
                Send SMS to Customers
              </Button>
            </div>

            {/* Email Campaign */}
            <div className="glass rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Email Campaign</h3>
                  <p className="text-[10px] text-muted-foreground">Professional email to your customer list</p>
                </div>
              </div>
              <Button
                onClick={() => setShowEmail(true)}
                variant="outline"
                className="w-full font-bold gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              >
                <Mail className="w-4 h-4" />
                Compose Email Campaign
              </Button>
            </div>
          </motion.div>
        )}

        {/* REACH TAB */}
        {activeTab === "reach" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Estimated Reach
              </h3>
              {[
                { channel: "WhatsApp", reach: whatsappReach, color: "bg-emerald-400", icon: MessageSquare },
                { channel: "Walk-in", reach: totalCustomers > whatsappReach ? totalCustomers - whatsappReach : 0, color: "bg-primary", icon: Store },
              ].map((c, i) => {
                const max = Math.max(totalCustomers, 1);
                return (
                  <div key={c.channel} className="mb-3 last:mb-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-foreground font-medium flex items-center gap-1.5">
                        <c.icon className="w-3 h-3" />{c.channel}
                      </span>
                      <span className="text-xs font-bold text-foreground">{c.reach}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.reach / max) * 100}%` }}
                        transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
                        className={`h-full rounded-full ${c.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" /> Loyalty Program
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Regular", count: regularCustomersCount, color: "text-muted-foreground" },
                  { label: "New", count: newCustomersCount, color: "text-emerald-400" },
                ].map(t => (
                  <div key={t.label} className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className={`text-lg font-black ${t.color}`}>{t.count}</p>
                    <p className="text-[9px] text-muted-foreground">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end p-4"
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">📱 Broadcast Queue</h3>
                <button onClick={() => setShowBroadcast(false)} className="p-2 rounded-xl bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Sending to {broadcastQueue.length} customers. Click 'Send Next' to safely open WhatsApp for each one.
              </p>
              
              <div className="bg-secondary/20 rounded-2xl p-4 mb-4 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Up Next</p>
                {currentBroadcastIndex < broadcastQueue.length ? (
                    <>
                        <p className="text-lg font-black text-foreground">{broadcastQueue[currentBroadcastIndex].name}</p>
                        <p className="text-xs text-emerald-400 font-bold">{broadcastQueue[currentBroadcastIndex].phone}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Progress: {currentBroadcastIndex} / {broadcastQueue.length}
                        </p>
                    </>
                ) : (
                    <p className="text-sm font-bold text-success">All done! 🎉</p>
                )}
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-1 mb-4 max-h-[150px] overflow-y-auto no-scrollbar">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Message Preview</p>
                <div className="whitespace-pre-wrap text-xs text-foreground">
                    {getBroadcastText()}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setShowBroadcast(false)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
                <Button 
                    onClick={sendNextBroadcast} 
                    disabled={currentBroadcastIndex >= broadcastQueue.length}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {currentBroadcastIndex >= broadcastQueue.length ? "Done" : "Send Next"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Offer Modal */}
      <AnimatePresence>
        {showNewOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNewOffer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full max-w-sm border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">➕ New Offer</h3>
                <button onClick={() => setShowNewOffer(false)} className="p-2 rounded-xl bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "discount", label: "Discount", icon: Percent, color: "text-amber-400 bg-amber-400/10" },
                  { type: "combo", label: "Combo Deal", icon: Package, color: "text-blue-400 bg-blue-400/10" },
                  { type: "bogo", label: "Buy 1 Get 1", icon: Gift, color: "text-emerald-400 bg-emerald-400/10" },
                  { type: "campaign", label: "Campaign", icon: Megaphone, color: "text-primary bg-primary/10" },
                ].map(t => (
                  <button
                    key={t.type}
                    onClick={() => {
                      const newOffer: Offer = {
                        id: `local_${Date.now()}`,
                        title: `${t.label} Special!`,
                        description: `Automatically generated ${t.label.toLowerCase()} for your customers.`,
                        type: t.type,
                        status: "active",
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
                        target_products: ["All items"],
                        created_at: new Date().toISOString()
                      };
                      setLocalOffers([newOffer, ...localOffers]);
                      toast.success(`Generated a new ${t.label} da! 🚀`);
                      setShowNewOffer(false);
                    }}
                    className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`p-3 rounded-xl ${t.color}`}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Marketing;
