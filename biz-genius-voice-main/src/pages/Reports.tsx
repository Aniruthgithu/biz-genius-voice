import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useSalesSummary, useProducts } from "@/hooks/use-database";
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis as RechartsXAxis, YAxis as RechartsYAxis, ResponsiveContainer as RechartsResponsiveContainer, Tooltip as RechartsTooltip, PieChart as RechartsPieChart, Pie as RechartsPie, Cell as RechartsCell, LineChart as RechartsLineChart, Line as RechartsLine } from "recharts";

const COLORS = ['hsl(174, 72%, 50%)', 'hsl(265, 70%, 60%)', 'hsl(38, 92%, 55%)', 'hsl(210, 80%, 58%)', 'hsl(152, 60%, 48%)'];

const Reports = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { data: salesData, isLoading: salesLoading } = useSalesSummary();
  const { data: products, isLoading: productsLoading } = useProducts();

  if (salesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Analyzing your business performance da...</p>
      </div>
    );
  }

  const totalRevenue = salesData?.reduce((a, s) => a + Number(s.revenue), 0) || 0;
  const totalProfit = salesData?.reduce((a, s) => a + Number(s.profit), 0) || 0;
  const totalItems = salesData?.reduce((a, s) => a + Number(s.orders), 0) || 0;
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const categoryRevenue = products?.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + Number(p.total_sold) * Number(p.price);
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

  const profitData = (salesData || []).map(s => ({
    day: new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric' }),
    revenue: Number(s.revenue),
    profit: Number(s.profit),
  })).reverse();

  const topProducts = products 
    ? [...products].sort((a, b) => (Number(b.total_sold) * Number(b.price)) - (Number(a.total_sold) * Number(a.price))).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8">
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-xs text-muted-foreground">Business analytics & insights</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Period Toggle */}
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                period === p ? 'gradient-primary text-primary-foreground' : 'glass text-muted-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, sub: "Total" },
            { label: "Profit", value: `₹${totalProfit.toLocaleString()}`, sub: `${profitMargin}% margin` },
            { label: "Orders", value: totalItems.toString(), sub: "Total units" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-3 text-center"
            >
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
              <p className="text-[10px] text-primary">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue vs Profit Chart */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Revenue vs Profit</h3>
          <div className="h-44">
            <RechartsResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={profitData}>
                <RechartsXAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                <RechartsYAxis hide />
                <RechartsTooltip
                  contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [`₹${v}`, name === 'revenue' ? 'Revenue' : 'Profit']}
                />
                <RechartsBar dataKey="revenue" fill="hsl(174, 72%, 50%)" radius={[4, 4, 0, 0]} />
                <RechartsBar dataKey="profit" fill="hsl(265, 70%, 60%)" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </RechartsResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Revenue by Category</h3>
          <div className="h-44 flex items-center">
            <RechartsResponsiveContainer width="50%" height="100%">
              <RechartsPieChart>
                <RechartsPie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <RechartsCell key={i} fill={COLORS[i % COLORS.length]} />)}
                </RechartsPie>
              </RechartsPieChart>
            </RechartsResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] text-foreground flex-1 truncate">{d.name}</span>
                  <span className="text-[11px] text-muted-foreground">₹{Math.round(d.value).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top Products by Sales</h3>
          <div className="space-y-2">
            {topProducts.map((p, i) => {
              const revenue = Number(p.total_sold) * Number(p.price);
              const maxRev = topProducts[0] ? Number(topProducts[0].total_sold) * Number(topProducts[0].price) : 1;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{p.name}</span>
                      <span className="text-xs text-muted-foreground">₹{revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(revenue / maxRev) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profit Trend Line */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Profit Trend</h3>
          <div className="h-36">
            <RechartsResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={profitData}>
                <RechartsXAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 12%, 55%)' }} axisLine={false} tickLine={false} />
                <RechartsYAxis hide />
                <RechartsTooltip
                  contentStyle={{ background: 'hsl(220, 18%, 10%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`₹${v}`, 'Profit']}
                />
                <RechartsLine type="monotone" dataKey="profit" stroke="hsl(152, 60%, 48%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(152, 60%, 48%)' }} />
              </RechartsLineChart>
            </RechartsResponsiveContainer>
          </div>
        </div>
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Reports;
