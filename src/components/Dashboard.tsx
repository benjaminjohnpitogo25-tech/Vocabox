import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Megaphone, 
  PenTool, 
  Scroll, 
  GraduationCap, 
  Landmark, 
  Play, 
  Book, 
  Trophy, 
  RefreshCw, 
  XCircle, 
  Search, 
  Star, 
  ExternalLink,
  Settings,
  LogOut,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

import { RankFigure } from './RankFigure';

export interface UserData {
  username: string;
  email: string;
  elo: number;
  rank: string;
  vocaBank: string[];
  winStreak: number;
  createdAt: any;
}

const RANKS = [
  { title: 'Seedling', min: 0, icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { title: 'Speaker', min: 801, icon: Megaphone, color: 'text-slate-400', bg: 'bg-slate-50' },
  { title: 'Poet', min: 1201, icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-50' },
  { title: 'Scholar', min: 1601, icon: Scroll, color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: 'Linguist', min: 2001, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Architect', min: 2401, icon: Landmark, color: 'text-yellow-600', bg: 'bg-yellow-50' },
];

export function getRank(elo: number) {
  return [...RANKS].reverse().find(r => elo >= r.min) || RANKS[0];
}

interface DashboardProps {
  user: UserData;
  view: 'home' | 'voca-bank' | 'leaderboard';
  onViewChange: (view: 'home' | 'voca-bank' | 'leaderboard') => void;
  onPlay: () => void;
  onPractice: (difficulty: string) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, view, onViewChange, onPlay, onPractice, onLogout }: DashboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBotDifficulty, setShowBotDifficulty] = useState(false);

  const botDifficulties = [
    { id: 'easy', name: 'EASY SEED', description: 'Slow pace, simple words. Perfect for beginners.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'medium', name: 'NORMAL SPROUT', description: 'Moderate pace, mixed vocabulary. A balanced challenge.', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'hard', name: 'ELITE SCHOLAR', description: 'Fast pace, complex words. For true word masters.', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const handleBotPractice = (difficulty: string) => {
    setShowBotDifficulty(false);
    onPractice(difficulty);
  };

  useEffect(() => {
    if (view === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [view]);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'users'), orderBy('elo', 'desc'), limit(10));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const rank = getRank(user.elo);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const progress = nextRank ? ((user.elo - rank.min) / (nextRank.min - rank.min)) * 100 : 100;

  return (
    <div className="min-h-screen bg-page-bg text-slate-900 font-sans p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-primary border-4 border-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">V</div>
            <h1 className="text-3xl font-bold tracking-tight">VocaBox</h1>
          </div>
          
          <nav className="space-y-6">
            <button 
              onClick={() => onViewChange('home')}
              className={cn(
                "flex items-center gap-3 w-full p-4 cartoon-button font-bold text-lg transition-all",
                view === 'home' ? "bg-white text-primary" : "bg-transparent text-slate-500 hover:bg-white/50 border-transparent shadow-none"
              )}
            >
              <Sprout className="w-6 h-6" /> Home
            </button>
            <button 
              onClick={() => onViewChange('voca-bank')}
              className={cn(
                "flex items-center gap-3 w-full p-4 cartoon-button font-bold text-lg transition-all",
                view === 'voca-bank' ? "bg-white text-primary" : "bg-transparent text-slate-500 hover:bg-white/50 border-transparent shadow-none"
              )}
            >
              <Book className="w-6 h-6" /> Voca-Bank
            </button>
            <button 
              onClick={() => onViewChange('leaderboard')}
              className={cn(
                "flex items-center gap-3 w-full p-4 cartoon-button font-bold text-lg transition-all",
                view === 'leaderboard' ? "bg-white text-primary" : "bg-transparent text-slate-500 hover:bg-white/50 border-transparent shadow-none"
              )}
            >
              <Trophy className="w-6 h-6" /> Leaderboard
            </button>

            <div className="pt-8 border-t-2 border-slate-100 space-y-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-3 w-full p-4 cartoon-button font-bold text-lg bg-transparent text-slate-500 hover:bg-white/50 border-transparent shadow-none transition-all"
              >
                <Settings className="w-6 h-6" /> Settings
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 w-full p-4 cartoon-button font-bold text-lg bg-transparent text-coral-red hover:bg-coral-red/10 border-transparent shadow-none transition-all"
              >
                <LogOut className="w-6 h-6" /> Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col py-12">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative mb-16"
                >
                  <div className={cn("w-72 h-72 rounded-full flex items-center justify-center bg-white border-8 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]")}>
                    <RankFigure icon={rank.icon} color={rank.color} />
                  </div>
                  <motion.div 
                    animate={{ y: [0, -15, 0], rotate: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -top-6 -right-6 bg-accent border-4 border-slate-900 px-6 py-3 rounded-full shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] font-bold text-xl"
                  >
                    {rank.title}
                  </motion.div>
                </motion.div>

                <div className="text-center space-y-8 w-full max-w-md">
                  <h2 className="text-4xl font-bold tracking-tight">{user.username}</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-slate-500">
                      <span>{rank.title}</span>
                      <span>{nextRank?.title || 'Max Rank'}</span>
                    </div>
                    <div className="h-6 w-full bg-slate-200 border-4 border-slate-900 rounded-full overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-secondary"
                      />
                    </div>
                    <p className="text-lg font-bold text-slate-600">{user.elo} V-Points</p>
                  </div>

                  <div className="flex flex-col gap-6 w-full max-w-md">
                    <button 
                      onClick={onPlay}
                      className="group relative w-full py-6 bg-primary text-white cartoon-button font-bold text-2xl"
                    >
                      <span className="relative flex items-center justify-center gap-3">
                        <Play className="w-8 h-8 fill-current" /> DUEL NOW
                      </span>
                    </button>

                    <button 
                      onClick={() => setShowBotDifficulty(true)}
                      className="group relative w-full py-6 bg-white text-slate-600 cartoon-button font-bold text-2xl"
                    >
                      <span className="relative flex items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8" /> PRACTICE (BOT)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Daily Seed */}
                <div className="mt-24 p-8 bg-white cartoon-border w-full max-w-md flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Daily Seed</p>
                    <h3 className="text-2xl font-bold text-primary">Ephemeral</h3>
                    <p className="text-slate-500">Lasting for a very short time.</p>
                  </div>
                  <button 
                    onClick={() => onViewChange('voca-bank')}
                    className="w-16 h-16 rounded-2xl bg-accent border-4 border-slate-900 flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                  >
                    <Book className="w-8 h-8" />
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'voca-bank' && (
              <motion.div
                key="voca-bank"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black tracking-tight">VOCA-BANK</h2>
                    <p className="text-slate-500 font-bold">Your collection of mastered words.</p>
                  </div>
                  <div className="bg-white cartoon-border px-6 py-3 font-bold text-secondary">
                    {user.vocaBank?.length || 0} WORDS
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.vocaBank && user.vocaBank.length > 0 ? (
                    user.vocaBank.map((word, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={word} 
                        className="bg-white cartoon-border p-6 flex justify-between items-center group hover:bg-emerald-50 transition-colors"
                      >
                        <div>
                          <h4 className="text-2xl font-bold text-slate-900 capitalize">{word}</h4>
                          <p className="text-sm text-slate-500 font-medium">Mastered in Arena</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center space-y-4 bg-white cartoon-border border-dashed">
                      <Book className="w-16 h-16 text-slate-300 mx-auto" />
                      <p className="text-xl font-bold text-slate-400">Your Voca-Bank is empty. Play duels to collect words!</p>
                      <button onClick={onPlay} className="text-primary font-bold hover:underline">Start a Duel Now</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-5xl font-black tracking-tight uppercase">Leaderboard</h2>
                  <p className="text-slate-500 font-bold">The top word masters in the world.</p>
                </div>

                <div className="bg-white cartoon-border overflow-hidden">
                  <div className="grid grid-cols-[80px_1fr_120px_120px] p-6 bg-slate-900 text-white font-bold text-sm uppercase tracking-widest">
                    <span>Rank</span>
                    <span>Master</span>
                    <span>V-Points</span>
                    <span>Rank</span>
                  </div>
                  <div className="divide-y-4 divide-slate-900">
                    {loadingLeaderboard ? (
                      <div className="p-20 text-center">
                        <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto" />
                      </div>
                    ) : (
                      leaderboard.map((player, i) => (
                        <div key={player.id} className="grid grid-cols-[80px_1fr_120px_120px] p-6 items-center hover:bg-slate-50 transition-colors">
                          <span className="text-2xl font-black text-slate-400">#{i + 1}</span>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-200 border-2 border-slate-900 flex items-center justify-center font-bold text-xl">
                              {player.username[0]}
                            </div>
                            <span className="text-xl font-bold">{player.username}</span>
                          </div>
                          <span className="text-xl font-black text-secondary">{player.elo}</span>
                          <span className="font-bold text-slate-500">{player.rank}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white cartoon-border p-12 max-w-md w-full space-y-8 relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <XCircle className="w-8 h-8" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-accent border-4 border-slate-900 rounded-3xl mx-auto flex items-center justify-center text-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
                  <Settings className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black uppercase">Settings</h2>
                <p className="text-slate-500 font-bold">Customize your VocaBox experience.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-900">
                  <span className="font-bold">Sound Effects</span>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full border-2 border-slate-900 relative">
                    <div className="absolute right-1 top-1 bottom-1 w-4 bg-white rounded-full border-2 border-slate-900" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-900">
                  <span className="font-bold">Music</span>
                  <div className="w-12 h-6 bg-slate-200 rounded-full border-2 border-slate-900 relative">
                    <div className="absolute left-1 top-1 bottom-1 w-4 bg-white rounded-full border-2 border-slate-900" />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-900">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Account</p>
                  <p className="font-bold truncate">{user.email}</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-primary text-white cartoon-button font-bold text-xl"
              >
                SAVE CHANGES
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot Difficulty Modal */}
      <AnimatePresence>
        {showBotDifficulty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBotDifficulty(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white cartoon-border w-full max-w-lg p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black italic uppercase">Choose Bot Level</h3>
                <button onClick={() => setShowBotDifficulty(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <div className="space-y-4">
                {botDifficulties.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => handleBotPractice(diff.id)}
                    className={cn(
                      "w-full p-6 cartoon-border text-left group transition-all hover:-translate-y-1",
                      diff.bg
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={cn("font-black text-xl", diff.color)}>{diff.name}</span>
                      <Bot className={cn("w-6 h-6", diff.color)} />
                    </div>
                    <p className="text-slate-600 font-bold text-sm">{diff.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
