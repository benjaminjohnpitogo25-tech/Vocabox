import React from 'react';
import { motion } from 'motion/react';
import { Sprout, Megaphone, PenTool, Scroll, GraduationCap, Landmark, Play, Book, Trophy, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

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
  onPlay: () => void;
  onPractice: () => void;
}

export default function Dashboard({ user, onPlay, onPractice }: DashboardProps) {
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
            <button className="flex items-center gap-3 w-full p-4 cartoon-button bg-white font-bold text-lg">
              <Sprout className="w-6 h-6 text-emerald-500" /> Home
            </button>
            <button className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-white/50 transition-colors text-slate-500 font-bold">
              <Book className="w-6 h-6" /> Voca-Bank
            </button>
            <button className="flex items-center gap-3 w-full p-4 rounded-2xl hover:bg-white/50 transition-colors text-slate-500 font-bold">
              <Trophy className="w-6 h-6" /> Leaderboard
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center py-12">
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
                onClick={onPractice}
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
            <button className="w-16 h-16 rounded-2xl bg-accent border-4 border-slate-900 flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <Book className="w-8 h-8" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
