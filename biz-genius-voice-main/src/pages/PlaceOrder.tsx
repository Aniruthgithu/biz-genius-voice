import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Search, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { Product } from "@/data/dummyData";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { products } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState<{ id: string; name: string; quantity: number; price: number }[]>([]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToOrder = (product: Product) => {
    const existing = orderItems.find(item => item.id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { id: product.id, name: product.name, quantity: 1, price: product.costPrice }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const total = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const confirmOrder = () => {
    if (orderItems.length === 0) return;
    
    toast.success("Purchase order placed successfully!");
    setTimeout(() => navigate('/'), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="p-4 pt-8 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /><span className="text-xs">Back</span>
        </button>
        <h1 className="text-xl font-bold text-foreground">Place Purchase Order</h1>
        <p className="text-xs text-muted-foreground">Restock your inventory</p>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products to order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-border/50 rounded-xl"
          />
        </div>

        {/* Product List */}
        {searchTerm && (
          <div className="glass rounded-xl overflow-hidden divide-y divide-border/50">
            {filteredProducts.slice(0, 5).map(p => (
              <div key={p.id} className="p-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">Current Stock: {p.stock} {p.unit}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => addToOrder(p)} className="h-8 w-8 p-0 rounded-full bg-primary/10 text-primary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Order Basket */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Order Items</h3>
          {orderItems.length > 0 ? (
            <div className="space-y-2">
              {orderItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">₹{item.price} per unit</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-secondary rounded">
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-secondary rounded">
                      <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <ShoppingCart className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Your order basket is empty</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Bottom Bar */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass rounded-2xl p-4 shadow-2xl border-primary/20"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Amount</p>
                <p className="text-xl font-bold text-foreground">₹{total.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Items</p>
                <p className="text-sm font-semibold text-foreground">{orderItems.length}</p>
              </div>
            </div>
            <Button onClick={confirmOrder} className="w-full gradient-primary text-primary-foreground h-12 rounded-xl text-md font-semibold">
              Confirm Purchase Order
            </Button>
          </motion.div>
        </div>
      )}

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default PlaceOrder;
