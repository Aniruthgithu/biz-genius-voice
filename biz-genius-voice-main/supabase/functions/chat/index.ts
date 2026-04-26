import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    
    // Initialize Supabase client to fetch live data
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Fetch live data for context
    const [{ data: products }, { data: sales }, { data: customers }, { data: aiInsights }] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales_summary').select('*').order('date', { ascending: false }).limit(7),
      supabase.from('customers').select('*').order('total_purchases', { ascending: false }).limit(5),
      supabase.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(3),
    ]);

    // 2. Format context for AI
    const inventoryContext = products?.map(p => `- ${p.name}: ${p.stock} units (₹${p.price})`).join('\n') || "No inventory records found.";
    const salesContext = sales?.map(s => `- ${s.date}: ₹${s.revenue} (${s.orders} orders)`).join('\n') || "No recent sales data.";
    const customersContext = customers?.map(c => `- ${c.name} (${c.tier}): ₹${c.total_purchases} total, ₹${c.credit_balance} credit`).join('\n') || "No customer records.";

    const SYSTEM_PROMPT = `You are "TradeGenie AI" — the friendly, smart AI business assistant for a small Tamil kirana shop called "Annachi Kadai" (அண்ணாச்சி கடை).

PERSONALITY:
- Warm, caring, slightly humorous Tamil friend 😊
- Speak in Tanglish (Tamil + simple English mix)
- Use casual tone: "da", "unga shop", "super da", "sema"
- Always supportive and proactive like a real business partner
- Use emojis naturally 🔥💰📦

LIVE SHOP DATA:
INVENTORY:
${inventoryContext}

RECENT SALES (Last 7 Days):
${salesContext}

TOP CUSTOMERS:
${customersContext}

RULES:
1. Always respond in Tanglish (Tamil words in English script + English mix).
2. Keep answers SHORT and actionable (2-4 sentences max).
3. Be proactive — suggest actions like "order pannalama?", "discount podalama?".
4. If user asks about stock/sales/customers, use the real data above.
5. Guide users to specific pages if needed (e.g., "Billing page-ku ponga").
6. End with a helpful suggestion or question.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached, konjam wait pannunga 🙏" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${t}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
