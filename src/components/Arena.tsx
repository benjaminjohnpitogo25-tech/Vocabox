import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Clock, Zap, AlertCircle, Loader2, User, XCircle, Sprout, Megaphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeWord, WordAnalysis } from '../services/gemini';
import { RankFigure } from './RankFigure';

interface ArenaProps {
  matchId: string;
  opponent: { username: string; elo: number };
  letter: string;
  socket: any;
  onMatchEnd: (results: any) => void;
  onForfeit: () => void;
}

export default function Arena({ matchId, opponent, letter, socket, onMatchEnd, onForfeit }: ArenaProps) {
  const [input, setInput] = useState("");
  const [words, setWords] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [stunned, setStunned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("word_update", (data: any) => {
      setWords(data.words);
      const me = data.players.find((p: any) => p.id === socket.id);
      const them = data.players.find((p: any) => p.id !== socket.id);
      setScore(me.score);
      setOppScore(them.score);
      setTimer(10); // Reset timer on word update
      setError(null);
    });

    socket.on("stunned", () => {
      setStunned(true);
      setTimeout(() => setStunned(false), 2000);
    });

    socket.on("word_error", (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on("match_end", (results: any) => {
      onMatchEnd(results);
    });

    const interval = setInterval(() => {
      setTimer(prev => Math.max(0, prev - 0.1));
    }, 100);

    return () => {
      socket.off("word_update");
      socket.off("stunned");
      clearInterval(interval);
    };
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [words]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || stunned) return;

    setLoading(true);
    const analysis = await analyzeWord(input.trim(), letter);
    setLoading(false);

    if (analysis.isValid) {
      socket.emit("submit_word", { matchId, word: input.trim(), tier: analysis.tier });
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex flex-col p-8">
      {/* Header */}
      <header className="mb-12 flex justify-between items-center bg-white cartoon-border p-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 flex items-center justify-center">
            <RankFigure icon={Sprout} color="text-emerald-500" size="w-16 h-16" eyeSize="w-2 h-2" legSize="w-2 h-4" gap="gap-2" legGap="gap-4" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">You</h3>
            <div className="flex items-center gap-2">
              <div className="w-32 h-4 bg-slate-200 border-2 border-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${(timer / 10) * 100}%` }}
                  className={cn("h-full transition-colors", timer < 3 ? "bg-primary" : "bg-secondary")}
                />
              </div>
              <span className="font-bold text-xl text-emerald-600">{score} pts</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 bg-accent border-4 border-slate-900 rounded-[2rem] flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            {letter}
          </div>
          <button 
            onClick={onForfeit}
            className="px-4 py-1 bg-white text-coral-red border-2 border-slate-900 rounded-xl font-bold text-xs hover:bg-coral-red hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            FORFEIT
          </button>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <h3 className="text-2xl font-bold">{opponent.username}</h3>
            <div className="flex items-center gap-2 justify-end">
              <span className="font-bold text-xl text-slate-400">{oppScore} pts</span>
              <div className="w-32 h-4 bg-slate-200 border-2 border-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: 100 }} 
                  className="h-full bg-slate-400"
                />
              </div>
            </div>
          </div>
          <div className="w-20 h-20 flex items-center justify-center">
            <RankFigure icon={Megaphone} color="text-slate-400" size="w-16 h-16" eyeSize="w-2 h-2" legSize="w-2 h-4" gap="gap-2" legGap="gap-4" />
          </div>
        </div>
      </header>

      {/* Volley Rail */}
      <main className="flex-1 overflow-hidden relative flex flex-col mb-12">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-white cartoon-border scroll-smooth">
          <AnimatePresence initial={false}>
            {words.map((w, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: w.player === opponent.username ? 50 : -50, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                className={cn(
                  "flex items-center gap-4",
                  w.player === opponent.username ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "px-6 py-3 border-2 border-slate-900 rounded-2xl font-bold text-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
                  w.tier === 3 ? "bg-accent" : 
                  w.tier === 2 ? "bg-secondary text-white" :
                  "bg-white"
                )}>
                  {w.word}
                  {w.tier === 3 && <Zap className="inline-block w-5 h-5 ml-2 text-primary fill-current" />}
                </div>
                <div className="text-sm font-bold text-slate-400">+{w.points}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Stun Overlay */}
        <AnimatePresence>
          {stunned && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-20 rounded-[2rem]"
            >
              <div className="bg-primary text-white px-12 py-6 border-4 border-slate-900 rounded-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex items-center gap-4 animate-bounce">
                <Zap className="w-10 h-10 fill-current" />
                <span className="text-3xl font-black">STUNNED!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Zone */}
      <footer className="max-w-3xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="relative">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-12 left-0 right-0 flex justify-center"
              >
                <div className="bg-coral-red text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={stunned}
            placeholder={stunned ? "..." : `Type a word starting with ${letter}...`}
            className={cn(
              "w-full p-8 bg-white cartoon-border text-3xl font-bold outline-none placeholder:text-slate-200 transition-all",
              stunned && "bg-slate-100 opacity-50"
            )}
            autoFocus
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading || stunned}
            className="absolute right-4 top-4 bottom-4 px-12 bg-primary text-white cartoon-button font-bold text-2xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "SOW"}
          </button>
        </form>

        <div className="flex justify-center gap-8 mt-8 text-sm font-bold uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border-2 border-slate-900" /> Common</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary border-2 border-slate-900" /> Poetic</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent border-2 border-slate-900" /> Linguist</div>
        </div>
      </footer>
    </div>
  );
}
