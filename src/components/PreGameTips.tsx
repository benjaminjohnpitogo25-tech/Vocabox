import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Zap, Shield, Target, Play } from 'lucide-react';

interface PreGameTipsProps {
  opponent: { username: string; elo: number };
  onStart: () => void;
}

const TIPS = [
  {
    icon: Zap,
    title: "SPEED IS KEY",
    text: "The faster you submit, the more pressure you put on your opponent!",
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  {
    icon: Shield,
    title: "STUN DEFENSE",
    text: "Longer words (Tier 3) stun your opponent for 3 seconds. Use them wisely!",
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  {
    icon: Target,
    title: "VOCA-BANK",
    text: "Words you use are saved in your Voca-Bank. Master them to climb ranks!",
    color: "text-emerald-500",
    bg: "bg-emerald-50"
  },
  {
    icon: Lightbulb,
    title: "VOCABULARY",
    text: "Don't just use simple words. Higher tiers give significantly more points!",
    color: "text-purple-500",
    bg: "bg-purple-50"
  }
];

export default function PreGameTips({ opponent, onStart }: PreGameTipsProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onStart();
    }
  }, [countdown, onStart]);

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block px-6 py-2 bg-slate-900 text-white font-black italic text-sm rounded-full"
          >
            MATCH READY!
          </motion.div>
          <h2 className="text-6xl font-black tracking-tight uppercase">
            VS <span className="text-primary">{opponent.username}</span>
          </h2>
          <p className="text-xl font-bold text-slate-500 italic">Master these tips before the duel begins...</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white cartoon-border p-8 flex gap-6 items-start group hover:-translate-y-1 transition-transform"
            >
              <div className={`p-4 rounded-2xl border-4 border-slate-900 ${tip.bg} ${tip.color} shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]`}>
                <tip.icon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black italic">{tip.title}</h4>
                <p className="text-slate-600 font-bold leading-relaxed">{tip.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-6 bg-primary text-white cartoon-button font-black text-3xl flex items-center gap-4"
          >
            <Play className="w-10 h-10 fill-current" />
            READY ({countdown})
          </motion.button>
          <p className="text-slate-400 font-bold animate-pulse">Game starts automatically in {countdown}s...</p>
        </div>
      </div>
    </div>
  );
}
