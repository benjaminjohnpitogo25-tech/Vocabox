import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Loader2, Play, Pause } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateMusic = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContentStream({
        model: "lyria-3-pro-preview",
        contents: "Generate a fun, upbeat, cartoony background music loop for a word game. Playful, orchestral, bouncy, and catchy. No lyrics.",
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsPlaying(true);
    } catch (err) {
      console.error("Music generation error:", err);
      setError("Failed to load music");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioUrl]);

  const togglePlay = () => {
    if (!audioUrl && !isLoading) {
      generateMusic();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={togglePlay}
          disabled={isLoading}
          className="w-16 h-16 bg-white border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center text-slate-900 hover:scale-110 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : isPlaying ? (
            <Volume2 className="w-8 h-8" />
          ) : (
            <VolumeX className="w-8 h-8 text-slate-400" />
          )}
        </button>
        
        <AnimatePresence>
          {isPlaying && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border-4 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3"
            >
              <div className="flex gap-1 items-end h-4">
                {[0, 1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [4, 16, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    className="w-1 bg-primary rounded-full"
                  />
                ))}
              </div>
              <span className="font-bold text-xs uppercase tracking-widest">Voca-Beats</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          loop 
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
