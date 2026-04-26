import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Globe, Bell, Shield, Palette, Info, Loader2, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useSettings, useUpdateSettings } from "@/hooks/use-database";
import { supabase } from "@/integrations/supabase/client";

import { Settings as SettingsType } from "@/hooks/use-database";

const Settings = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  
  const [localSettings, setLocalSettings] = useState<SettingsType | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setOwnerEmail(session.user.email);
      }
    };
    fetchSession();
  }, []);

  if (isLoading || !localSettings) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Loading settings da...</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<SettingsType>) => {
    const updated = { ...localSettings, ...updates };
    setLocalSettings(updated);
    updateSettingsMutation.mutate(updated);
  };

  const handleToggleNotif = (key: string) => {
    const newPrefs = { ...localSettings.notification_prefs, [key]: !localSettings.notification_prefs[key] };
    handleUpdate({ notification_prefs: newPrefs });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 pt-8">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">Customize your experience</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground">Owner Profile</h3>
              <p className="text-xs text-muted-foreground">{ownerEmail || "Loading email..."}</p>
            </div>
          </div>
        </motion.div>

        {/* Shop Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Shop Information</h3>
          </div>
          <label className="text-xs text-muted-foreground block mb-1.5">Shop Name</label>
          <div className="relative">
            <input
              type="text"
              value={localSettings.shop_name}
              onChange={e => setLocalSettings({ ...localSettings, shop_name: e.target.value })}
              onBlur={e => handleUpdate({ shop_name: e.target.value })}
              className="w-full bg-secondary text-foreground text-sm rounded-lg px-3 py-2.5 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {updateSettingsMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-primary" />
            )}
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Language</h3>
          </div>
          <div className="flex gap-2">
            {[
              { code: 'en' as const, label: 'English', flag: '🇬🇧' },
              { code: 'ta' as const, label: 'தமிழ்', flag: '🇮🇳' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => handleUpdate({ language: lang.code })}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  localSettings.language === lang.code ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <span>{lang.flag}</span>{lang.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(localSettings.notification_prefs || {}).map(([key, val]: [string, boolean]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <button
                  onClick={() => handleToggleNotif(key)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${val ? 'bg-primary' : 'bg-secondary'}`}
                  disabled={updateSettingsMutation.isPending}
                >
                  <motion.div
                    animate={{ x: val ? 18 : 2 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">About</h3>
          </div>
          <p className="text-xs text-muted-foreground">Biz AI v1.0</p>
          <div className="flex justify-center my-4">
            <img src="/biz-ai-logo.png" alt="Biz AI Logo" className="w-12 h-12 rounded-lg opacity-80" />
          </div>
          <p className="text-xs text-muted-foreground">Your Business on Auto-Pilot</p>
          <p className="text-[10px] text-muted-foreground mt-2">© 2026 Biz AI. All rights reserved.</p>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
          >
            Sign Out
          </button>
        </motion.div>
      </div>

      <BottomNav />
      <VoiceButton />
    </div>
  );
};

export default Settings;
