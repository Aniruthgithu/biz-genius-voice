import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, Loader2, Plus, QrCode, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useProducts } from "@/hooks/use-database";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };

const Inventory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useProducts();
  
  const [viewMode, setViewMode] = useState<"all" | "damaged">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", stock: 0, price: 0, cost_price: 0, category: "", barcode: "" });
  const [adding, setAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Checking the shelves da...</p>
      </div>
    );
  }

  const lowStock = products?.filter(p => p.stock / p.max_stock < 0.3) || [];
  const expiringSoon = products?.filter(p => {
    if (!p.expiry_date) return false;
    const days = (new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 5;
  }) || [];

  const displayedProducts = viewMode === "all" 
    ? products 
    : products?.filter(p => (p.damaged_stock || 0) > 0);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const insertData: any = {
        ...newProduct,
        max_stock: newProduct.stock,
        trend: 'stable'
      };
      
      // Prevent unique constraint errors for empty barcodes
      if (!insertData.barcode) {
        delete insertData.barcode;
      }

      const { error } = await supabase.from('products').insert([insertData]);
      if (error) throw error;
      
      toast.success("Product added successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAddModal(false);
      setNewProduct({ name: "", stock: 0, price: 0, cost_price: 0, category: "", barcode: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <p className="text-xs text-muted-foreground">{products?.length || 0} products tracked</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="gradient-primary gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="px-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("all")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${viewMode === "all" ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
          >
            All Stock
          </button>
          <button
            onClick={() => setViewMode("damaged")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${viewMode === "damaged" ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-secondary text-muted-foreground"}`}
          >
            Damaged / Lost
          </button>
        </div>

        {viewMode === "all" && (lowStock.length > 0 || expiringSoon.length > 0) && (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {lowStock.length > 0 && (
              <div className="shrink-0 glass rounded-xl p-3 border-l-4 border-l-warning flex items-center gap-2 min-w-[200px]">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <p className="text-xs text-foreground"><strong>{lowStock.length}</strong> items low stock</p>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="shrink-0 glass rounded-xl p-3 border-l-4 border-l-destructive flex items-center gap-2 min-w-[200px]">
                <Clock className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-foreground"><strong>{expiringSoon.length}</strong> items expiring soon</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {displayedProducts?.map((product, i) => {
            const stockPercent = product.max_stock ? (product.stock / product.max_stock) * 100 : 0;
            const daysToExpiry = product.expiry_date ? Math.ceil((new Date(product.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : -1;
            const TrendIcon = trendIcon[product.trend as 'up' | 'down' | 'stable'] || Minus;
            const isLow = stockPercent < 30;
            const isExpiring = daysToExpiry >= 0 && daysToExpiry <= 5;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/inventory/${product.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{product.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{product.category || "Uncategorized"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">₹{product.price} {product.barcode ? `• 🛒 ${product.barcode}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <TrendIcon className={`w-3.5 h-3.5 ${product.trend === 'up' ? 'text-success' : product.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`} />
                      <span className={`text-lg font-bold ${isLow ? 'text-warning' : 'text-foreground'}`}>{product.stock}</span>
                    </div>
                    {product.damaged_stock > 0 && (
                      <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                        {product.damaged_stock} Damaged
                      </span>
                    )}
                  </div>
                </div>
                {viewMode === "all" && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, stockPercent)}%` }}
                        transition={{ delay: i * 0.05 + 0.3, duration: 0.5 }}
                        className={`h-full rounded-full ${isLow ? 'bg-warning' : 'gradient-primary'}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(stockPercent)}%</span>
                  </div>
                )}
                {isExpiring && viewMode === "all" && (
                  <p className="text-[11px] text-destructive mt-2 font-medium">⚠️ Expires in {daysToExpiry} day{daysToExpiry !== 1 ? 's' : ''} — consider a discount</p>
                )}
              </motion.div>
            );
          })}
          {displayedProducts?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No products found in this view.</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
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
                <h2 className="text-lg font-bold text-foreground">Add Product</h2>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <input type="text" placeholder="Product Name" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2 border border-border/50" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Price (₹)" required value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2 border border-border/50" />
                  <input type="number" placeholder="Cost (₹)" required value={newProduct.cost_price || ''} onChange={e => setNewProduct({...newProduct, cost_price: Number(e.target.value)})} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2 border border-border/50" />
                </div>
                <div className="flex gap-2">
                  <input type="number" placeholder="Stock Qty" required value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2 border border-border/50" />
                  <input type="text" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2 border border-border/50" />
                </div>
                <div className="relative">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Barcode ID (Optional)" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} className="w-full bg-secondary text-foreground text-sm rounded-lg pl-9 pr-3 py-2 border border-border/50" />
                </div>
                <Button type="submit" disabled={adding} className="w-full gradient-primary text-primary-foreground mt-2">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Product"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Inventory;
