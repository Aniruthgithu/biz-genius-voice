import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, X, Send, Loader2, Bot, RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const getAIContext = async () => {
  try {
    const [{ data: products }, { data: sales }] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales_summary').select('*').order('date', { ascending: false }).limit(5),
    ]);

    const lowStock = products?.filter((p: any) => p.stock < 10) || [];
    const expiring = products?.filter((p: any) => p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 7 * 86400000)) || [];
    const inventoryCtx = products?.slice(0, 10).map((p: any) => `- ${p.name}: ${p.stock} units @ ₹${p.price}`).join('\n') || "No data";
    const stats = sales?.[0] || { revenue: 0, orders: 0, profit: 0 };

    return `You are "Biz AI" — the smart, friendly Tamil kirana shop assistant for "Annachi Kadai".
PERSONALITY: Warm Tanglish (Tamil+English), casual like a friend. Use "da", "unga shop", "super da". Keep answers SHORT (2-4 sentences). Use emojis 🔥💰📦.

LIVE SHOP DATA:
INVENTORY (Sample):
${inventoryCtx}

LOW STOCK: ${lowStock.map(p => p.name).join(', ') || 'None'}
EXPIRING SOON: ${expiring.map(p => p.name).join(', ') || 'None'}
TODAY'S STATS: Revenue: ₹${stats.revenue}, Orders: ${stats.orders}

RULES: Answer in Tanglish. Suggest discounts for expiring items. End with a tip or question.`;
  } catch (e) {
    return "You are Biz AI for Annachi Kadai. Answer in Tanglish.";
  }
};


// Model waterfall — tries each in order until one works
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

async function tryModel(
  model: string,
  body: object,
  key: string
): Promise<Response | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
  // retry up to 2 times on 503 (high demand)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000), // 25s timeout
      });
      if (res.ok) return res;
      if (res.status === 503) {
        // brief wait before retry: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      // non-503 failure — don't retry this model
      return null;
    } catch {
      // network error — try next model
      return null;
    }
  }
  return null; // all retries exhausted
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    onError("Gemini API Key missing! Add VITE_GEMINI_API_KEY to your .env file da.");
    return;
  }

  try {
    const systemInstruction = await getAIContext();
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
    };

    // Try each model in the waterfall
    for (const model of MODELS) {
      const response = await tryModel(model, body, GEMINI_API_KEY);
      if (response) {
        return processStream(response, onDelta, onDone, onError);
      }
    }

    // All models failed
    onError("All AI models are busy right now da! Try again in a minute. 🙏");
  } catch (error) {
    onError("Connection failed. Check internet da!");
  }
}


async function processStream(response: Response, onDelta: any, onDone: any, onError: any) {
    const reader = response.body?.getReader();
    if (!reader) { onError("No response stream da!"); return; }
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]" || !jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onDelta(text);
        } catch { /* skip */ }
      }
    }
    onDone();
}

export const VoiceButton = () => {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages(prev => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Network error, try again da!" }]);
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice not supported in this browser da!");
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ta-IN";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        setTranscript("");
        setListening(false);
        sendMessage(text);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setTranscript("");
  }, []);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{ 
        role: "assistant", 
        content: "வணக்கம்! 🙏 I'm Biz AI da. Your shop assistant! Ask me about stock, sales, or any business help. How can I help you today?" 
      }]);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-xl border-2 border-white/20"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      >
        <Bot className="w-7 h-7 text-white" />
        <motion.div 
          className="absolute inset-0 rounded-full bg-primary opacity-30"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Biz AI Chat</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Online • Tanglish</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMessages([])} 
                  className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setOpen(false); recognitionRef.current?.stop(); }} 
                  className="p-2 rounded-lg bg-secondary/50 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-primary/5">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'gradient-primary text-primary-foreground rounded-br-none'
                      : 'glass border-white/10 rounded-bl-none text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start items-center gap-2">
                   <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-white animate-spin" />
                  </div>
                  <div className="glass px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div 
                        key={i} 
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-none px-4 py-2.5 text-sm bg-primary/10 text-primary border border-primary/20 italic">
                    🎤 {transcript}...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md">
              <form onSubmit={(e) => { e.preventDefault(); if(textInput.trim()){ sendMessage(textInput); setTextInput(""); } }} className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask anything da..."
                  className="flex-1 bg-secondary/80 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={!textInput.trim() || isLoading}
                  className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-40 shadow-lg shadow-primary/20"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
                <motion.button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    listening ? 'bg-destructive shadow-lg shadow-destructive/20' : 'gradient-primary shadow-lg shadow-primary/20'
                  }`}
                  whileTap={{ scale: 0.9 }}
                  animate={listening ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                  disabled={isLoading}
                >
                  {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
