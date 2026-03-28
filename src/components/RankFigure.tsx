import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RankFigureProps {
  icon: any;
  color: string;
  size?: string;
  eyeSize?: string;
  legSize?: string;
  gap?: string;
  legGap?: string;
}

export const RankFigure = ({ 
  icon: Icon, 
  color, 
  size = "w-40 h-40",
  eyeSize = "w-3 h-3",
  legSize = "w-4 h-6",
  gap = "gap-4",
  legGap = "gap-8"
}: RankFigureProps) => (
  <div className="relative flex flex-col items-center">
    <motion.div 
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="relative"
    >
      <Icon className={cn(size, color)} />
      {/* Cute Eyes */}
      <div className={cn("absolute top-1/3 left-1/2 -translate-x-1/2 flex", gap)}>
        <div className={cn(eyeSize, "bg-slate-900 rounded-full animate-bounce")} />
        <div className={cn(eyeSize, "bg-slate-900 rounded-full animate-bounce")} style={{ animationDelay: '0.2s' }} />
      </div>
    </motion.div>
    {/* Cute Legs */}
    <div className={cn("flex -mt-2", legGap)}>
      <div className={cn(legSize, "bg-slate-900 rounded-full")} />
      <div className={cn(legSize, "bg-slate-900 rounded-full")} />
    </div>
  </div>
);
