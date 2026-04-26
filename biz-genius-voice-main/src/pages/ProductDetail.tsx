import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Sparkles, Loader2, X, Trash2, PlusCircle, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useProducts, useUpdateProduct } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

const generateHistory = (sold: number) => {
  const days = 7;
  const base = Math.round(sold / 30) || 1;
  return Array.from({ length: days }, (_, i) => ({
    day: `D${i + 1}`,
    sold: Math.max(1, base + Math.round((Math.random() - 0.5) * base)),
  }));
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const updateProductMutation = useUpdateProduct();
  
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageQty, setDamageQty] = useState(1);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockQty, setRestockQty] = useState(10);
  
  const product = products?.find(p => p.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Fetching product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Product not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">Go Back</button>
      </div>
    );
  }

  const stockPercent = product.max_stock ? (product.stock / product.max_stock) * 100 : 0;
  const daysToExpiry = product.expiry_date ? Math.ceil((new Date(product.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : -1;
  const isLow = stockPercent < 30;
  const isExpiring = daysToExpiry >= 0 && daysToExpiry <= 5;
  const TrendIcon = trendIcon[product.trend as 'up' | 'down' | 'stable'] || Minus;
  const history = generateHistory(product.total_sold || 0);
  const profit = Number(product.total_sold || 0) * (Number(product.price) - Number(product.cost_price));

  const handleMarkDamaged = async () => {
    if (!product || damageQty <= 0 || damageQty > product.stock) return;
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        updates: {
          stock: product.stock - damageQty,
          damaged_stock: (product.damaged_stock || 0) + damageQty
        }
      });
      setShowDamageModal(false);
      setDamageQty(1);
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleRestock = async () => {
    if (!product || restockQty <= 0) return;
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        updates: {
          stock: product.stock + restockQty,
          total_added: (product.total_added || 0) + restockQty,
          max_stock: Math.max(product.max_stock || 0, product.stock + restockQty)
        }
      });
      setShowRestockModal(false);
      setRestockQty(10);
    } catch (e) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /><span className="text-xs">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            <p className="text-xs text-muted-foreground">{product.category} • ₹{product.price}/{product.unit}</p>
            {product.barcode && <p className="text-[10px] mt-1 bg-secondary inline-block px-1.5 py-0.5 rounded text-muted-foreground">🛒 {product.barcode}</p>}
          </div>
          <TrendIcon className={`w-6 h-6 ${product.trend === 'up' ? 'text-success' : product.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Stock Overview */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Added", value: product.total_added, color: "text-info" },
            { label: "Sold", value: product.total_sold, color: "text-success" },
            { label: "Available", value: product.stock, color: isLow ? "text-warning" : "text-foreground" },
            { label: "Damaged", value: product.damaged_stock || 0, color: "text-destructive" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-2 text-center flex flex-col justify-center">
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowRestockModal(true)} 
            className="flex-1 gradient-primary text-white font-bold gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Restock
          </Button>
          <Button 
            onClick={() => setShowDamageModal(true)} 
            disabled={product.stock <= 0}
            variant="outline" 
            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 gap-2"
          >
            <Trash2 className="w-4 h-4" /> Mark Damaged
          </Button>
        </div>

        {/* Stock Bar */}
        <div className="glass rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-muted-foreground">Stock Level</span>
            <span className={`text-xs font-semibold ${isLow ? 'text-warning' : 'text-success'}`}>{Math.round(stockPercent)}%</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stockPercent)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${isLow ? 'bg-warning' : 'gradient-primary'}`}
            />
          </div>
        </div>

        {/* Alerts */}
        {(isLow || isExpiring) && (
          <div className="space-y-2">
            {isLow && (
              <div className="glass rounded-xl p-3 border-l-4 border-l-warning flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <p className="text-xs text-foreground">Low stock — only <strong>{product.stock}</strong> units left</p>
              </div>
            )}
            {isExpiring && (
              <div className="glass rounded-xl p-3 border-l-4 border-l-destructive flex items-center gap-2">
                <Clock className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-foreground">Expires in <strong>{daysToExpiry}</strong> day{daysToExpiry !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        )}

        {/* Sales Chart */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Sales Trend (7 Days)</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="productGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="sold" stroke="hsl(174, 72%, 50%)" strokeWidth={2} fill="url(#productGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Profit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-bold text-foreground">₹{(Number(product.total_sold || 0) * Number(product.price)).toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Profit</p>
            <p className="text-lg font-bold text-success">₹{profit.toLocaleString()}</p>
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="glass rounded-xl p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Suggestion</h3>
          </div>
          <p className="text-xs text-foreground">
            {isLow
              ? `Restock immediately. Order at least ${(product.max_stock || 50) - product.stock} units to meet demand.`
              : isExpiring
              ? `Apply ${Math.min(30, daysToExpiry * 5)}% discount to clear stock before expiry.`
              : product.trend === 'down'
              ? 'Sales trending down. Consider a promotional discount or combo offer.'
              : 'Product performing well. Maintain current stock levels.'}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showDamageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Mark as Damaged</h2>
                <button onClick={() => setShowDamageModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">How many units of {product.name} are damaged or lost? This will remove them from available stock.</p>
              
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  onClick={() => setDamageQty(Math.max(1, damageQty - 1))} 
                  variant="outline" 
                  className="w-10 h-10 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">{damageQty}</span>
                  <p className="text-[10px] text-muted-foreground">Max: {product.stock}</p>
                </div>
                <Button 
                  onClick={() => setDamageQty(Math.min(product.stock, damageQty + 1))} 
                  variant="outline" 
                  className="w-10 h-10 p-0"
                >
                  +
                </Button>
              </div>
              
              <Button 
                onClick={handleMarkDamaged} 
                disabled={updateProductMutation.isPending}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {updateProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Damage"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm border border-border shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Restock Item</h2>
                <button onClick={() => setShowRestockModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">How many units of {product.name} did you receive?</p>
              
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  onClick={() => setRestockQty(Math.max(1, restockQty - 1))} 
                  variant="outline" 
                  className="w-10 h-10 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-primary">{restockQty}</span>
                  <p className="text-[10px] text-muted-foreground">New Total: {product.stock + restockQty}</p>
                </div>
                <Button 
                  onClick={() => setRestockQty(restockQty + 1)} 
                  variant="outline" 
                  className="w-10 h-10 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                onClick={handleRestock} 
                disabled={updateProductMutation.isPending}
                className="w-full gradient-primary text-white font-bold"
              >
                {updateProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Restock"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default ProductDetail;
