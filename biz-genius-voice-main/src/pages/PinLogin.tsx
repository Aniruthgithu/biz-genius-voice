import { useState, useRef } from "react";
import { motion } from "framer-motion";

interface PinLoginProps {
  onSuccess: () => void;
}

const CORRECT_PIN = "1234";

const PinLogin = ({ onSuccess }: PinLoginProps) => {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigit = (digit: string, idx: number) => {
    if (!/^\d?$/.test(digit)) return;
    const newPin = [...pin];
    newPin[idx] = digit;
    setPin(newPin);
    setError(false);

    if (digit && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }

    if (idx === 3 && digit) {
      const entered = newPin.join("");
      if (entered === CORRECT_PIN) {
        setTimeout(() => onSuccess(), 200);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin(["", "", "", ""]);
          setShake(false);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 w-full max-w-xs"
      >
        <div>
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden">
              <img src="/biz-ai-logo.png" alt="Biz AI Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Biz AI</h1>
          <p className="text-sm text-primary font-medium mt-1">Your Business on Auto-Pilot</p>
          <p className="text-xs text-muted-foreground mt-3">அண்ணாச்சி கடை</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-4">Enter 4-digit PIN</p>
          <motion.div
            className="flex justify-center gap-4"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-secondary text-foreground outline-none transition-colors ${
                  error ? 'border-destructive' : digit ? 'border-primary' : 'border-border'
                }`}
                autoFocus={i === 0}
              />
            ))}
          </motion.div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-xs mt-3"
            >
              தவறான PIN ❌ Try again!
            </motion.p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">Default PIN: 1234</p>
      </motion.div>
    </div>
  );
};

export default PinLogin;
