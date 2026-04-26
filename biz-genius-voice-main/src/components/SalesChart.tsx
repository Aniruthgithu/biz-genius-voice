import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SalesSummary } from "@/hooks/use-database";

interface SalesChartProps {
  data?: SalesSummary[];
}

// Empty wave for when there's no data
const EMPTY_WAVE = [
  { day: "Mon", sales: 0 },
  { day: "Tue", sales: 0 },
  { day: "Wed", sales: 0 },
  { day: "Thu", sales: 0 },
  { day: "Fri", sales: 0 },
  { day: "Sat", sales: 0 },
  { day: "Sun", sales: 0 },
];

export const SalesChart = ({ data }: SalesChartProps) => {
  const hasRealData = data && data.length > 0;

  const chartData = hasRealData
    ? data!
        .map(s => ({
          day: new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          sales: Number(s.revenue),
        }))
        .reverse()
    : EMPTY_WAVE;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Sales Trend</h3>
        {!hasRealData && (
          <span className="text-[9px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">No Data</span>
        )}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(174, 72%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(215, 12%, 55%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(210, 20%, 85%)" }}
              formatter={(v: number) => [`₹${v.toLocaleString()}`, "Sales"]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(174, 72%, 50%)"
              strokeWidth={2.5}
              fill="url(#salesGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "hsl(174, 72%, 50%)", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
