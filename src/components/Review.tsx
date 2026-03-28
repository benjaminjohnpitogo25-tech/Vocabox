import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ArrowRight, RefreshCw, Home, Zap, Sprout } from 'lucide-react';
import { cn } from '../lib/utils';
import { RankFigure } from './RankFigure';

interface ReviewProps {
  results: {
    winner: string;
    score: number;
    oppScore: number;
    eloChange: number;
    words: any[];
    forfeited?: boolean;
    opponentForfeited?: boolean;
  };
  onHome: () => void;
  onRematch: () => void;
}

export default function Review({ results, onHome, onRematch }: ReviewProps) {
  const isWinner = results.winner === 'You';

  return (
    <div className="min-h-screen bg-page-bg p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full space-y-12">
        {/* Result Header */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: isWinner ? [0, -10, 10, 0] : 0 }}
            transition={{ rotate: { repeat: Infinity, duration: 2 } }}
            className="flex justify-center mb-8"
          >
            <div className={cn(
              "inline-flex items-center justify-center w-48 h-48 bg-white cartoon-border",
              isWinner ? "text-accent" : "text-slate-300"
            )}>
              <RankFigure icon={isWinner ? Trophy : Sprout} color={isWinner ? "text-accent" : "text-slate-300"} size="w-32 h-32" />
            </div>
          </motion.div>
          
          <h1 className="text-7xl font-black tracking-tight uppercase">
            {results.forfeited ? "Forfeited" : results.opponentForfeited ? "Opponent Fled!" : isWinner ? "Victory!" : "Defeat"}
          </h1>

          {results.opponentForfeited && (
            <p className="text-xl font-bold text-secondary">Your opponent couldn't handle the pressure!</p>
          )}

          <div className="flex items-center justify-center gap-6 text-4xl font-black">
            <span className={cn(isWinner ? "text-secondary" : "text-slate-400")}>{results.score}</span>
            <span className="text-slate-900">VS</span>
            <span className={cn(!isWinner ? "text-primary" : "text-slate-400")}>{results.oppScore}</span>
          </div>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-block px-8 py-4 bg-white cartoon-border text-secondary font-black text-2xl"
          >
            {results.eloChange > 0 ? '+' : ''}{results.eloChange} V-Points
          </motion.div>
        </div>

        {/* Word Map */}
        <div className="bg-white cartoon-border p-10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">The Word-Map</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.words.map((w, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-page-bg border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "w-4 h-4 rounded-full border-2 border-slate-900",
                    w.tier === 3 ? "bg-accent" : w.tier === 2 ? "bg-secondary" : "bg-white"
                  )} />
                  <span className="text-xl font-bold">{w.word}</span>
                </div>
                <div className="text-sm font-bold text-slate-400 uppercase">+{w.points}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <button 
            onClick={onRematch}
            className="flex items-center justify-center gap-3 px-16 py-6 bg-primary text-white cartoon-button font-bold text-2xl"
          >
            <RefreshCw className="w-8 h-8" /> REMATCH
          </button>
          <button 
            onClick={onHome}
            className="flex items-center justify-center gap-3 px-16 py-6 bg-white text-slate-500 cartoon-button font-bold text-2xl"
          >
            <Home className="w-8 h-8" /> BACK HOME
          </button>
        </div>
      </div>
    </div>
  );
}
