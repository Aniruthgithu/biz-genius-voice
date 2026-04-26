import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, CalendarDays, PartyPopper, Cake, Users2, Tag, Clock, Loader2, X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { VoiceButton } from "@/components/VoiceButton";
import { useEvents } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  festival: { icon: PartyPopper, color: "text-warning", label: "Festival" },
  birthday: { icon: Cake, color: "text-accent", label: "Birthday" },
  function: { icon: Users2, color: "text-info", label: "Function" },
  sale: { icon: Tag, color: "text-success", label: "Sale" },
};

const Events = () => {
  const { data: events, isLoading } = useEvents();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState("festival");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground italic">Syncing the calendar da...</p>
      </div>
    );
  }

  const getDaysLeft = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowAddModal(true);
  };

  const saveEvent = () => {
    if (!newEventName) {
      toast.error("Please enter an event name da!");
      return;
    }
    // In a real app, we would mutate the DB here. For now, simulate saving:
    toast.success(`${newEventName} marked on calendar successfully! 📅`);
    setShowAddModal(false);
    setNewEventName("");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="p-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Events Calendar
            </h1>
            <p className="text-xs text-muted-foreground">{events?.length || 0} upcoming events</p>
          </div>
          <button 
            onClick={() => { setSelectedDate(new Date()); setShowAddModal(true); }}
            className="gradient-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        {/* Interactive Calendar Grid */}
        <div className="glass rounded-3xl p-5 mb-6 border border-border shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 bg-secondary/50 rounded-xl text-muted-foreground hover:bg-secondary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 bg-secondary/50 rounded-xl text-muted-foreground hover:bg-secondary">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[10px] font-bold text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map(empty => <div key={`empty-${empty}`} />)}
            {days.map(day => {
              const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              const eventOnDay = events?.find(e => {
                const eDate = new Date(e.date);
                return eDate.getDate() === day && eDate.getMonth() === currentDate.getMonth() && eDate.getFullYear() === currentDate.getFullYear();
              });

              return (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-secondary/30 text-foreground hover:bg-secondary'
                  }`}
                >
                  {day}
                  {eventOnDay && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">Upcoming Schedule</h3>
          {events?.map((event, i) => {
            const daysLeft = getDaysLeft(event.date);
            const config = typeConfig[event.type as keyof typeof typeConfig] || typeConfig.function;
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl bg-secondary/50 shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-foreground">{event.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full bg-secondary font-bold ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{event.description}</p>

                    <div className="flex items-center gap-1.5 mt-2 bg-secondary/30 rounded-lg p-2 w-fit">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className={`text-[10px] font-bold ${daysLeft <= 7 ? 'text-warning' : 'text-primary'}`}>
                        {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Today!' : 'Past'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 border-l border-border pl-1.5 ml-1">
                        {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {events?.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground italic">No events planned yet da.</div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 w-full border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">🗓️ Mark Event</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-primary font-bold mb-4 bg-primary/10 px-3 py-1.5 rounded-lg inline-block">
                Selected Date: {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Event Name</label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="e.g. Diwali Sale, Shop Anniversary..."
                    className="w-full bg-secondary text-sm text-foreground rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Event Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setNewEventType(key)}
                        className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all ${
                          newEventType === key ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-transparent'
                        }`}
                      >
                        <config.icon className="w-4 h-4" /> {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowAddModal(false)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={saveEvent} className="flex-1 gradient-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
                  Save Event
                </Button>
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

export default Events;
