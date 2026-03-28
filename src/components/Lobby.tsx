import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, User, Swords, Search, Sprout, Megaphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { RankFigure } from './RankFigure';

interface LobbyProps {
  username: string;
  elo: number;
  onCancel: () => void;
  socket: any;
}

export default function Lobby({ username, elo, onCancel, socket }: LobbyProps) {
  const [searching, setSearching] = useState(false);

  const startSearch = () => {
    setSearching(true);
    socket.emit("join_queue", { username, elo });
  };

  const handleCancel = () => {
    socket.emit("leave_queue");
    onCancel();
  };

  return (
    <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
          {/* Player 1 */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-48 h-48 bg-white cartoon-border flex items-center justify-center">
              <RankFigure icon={Sprout} color="text-emerald-500" size="w-32 h-32" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{username}</h3>
              <p className="text-primary font-bold">{elo} V-Points</p>
            </div>
          </motion.div>

          {/* VS */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-24 h-24 bg-accent border-4 border-slate-900 rounded-full flex items-center justify-center text-4xl font-black shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          >
            VS
          </motion.div>

          {/* Player 2 (Searching) */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-48 h-48 bg-white cartoon-border flex items-center justify-center relative overflow-hidden">
              <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                  scale: { repeat: Infinity, duration: 2 }
                }}
                className="absolute inset-0 bg-secondary/10"
              />
              <Search className="w-24 h-24 text-secondary animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-400">Searching...</h3>
              <p className="text-slate-300 font-bold">Matching Skill</p>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-8">
          {!searching ? (
            <button 
              onClick={startSearch}
              className="px-16 py-6 bg-primary text-white cartoon-button font-bold text-3xl"
            >
              FIND MATCH
            </button>
          ) : (
            <div className="flex items-center gap-3 text-slate-500 font-bold">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Finding a worthy opponent...</span>
            </div>
          )}

          <button 
            onClick={handleCancel}
            className="px-12 py-4 bg-white text-slate-500 cartoon-button font-bold text-xl"
          >
            CANCEL DUEL
          </button>
        </div>
      </div>
    </div>
  );
}
