import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard, { UserData, getRank } from './components/Dashboard';
import Lobby from './components/Lobby';
import Arena from './components/Arena';
import Review from './components/Review';
import ErrorBoundary from './components/ErrorBoundary';
import MusicPlayer from './components/MusicPlayer';
import PreGameTips from './components/PreGameTips';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { LogIn, Loader2 } from 'lucide-react';

type Screen = 'dashboard' | 'lobby' | 'arena' | 'review' | 'tips';
type DashboardView = 'home' | 'voca-bank' | 'leaderboard';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardView>('home');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);

  const socket = useMemo(() => io(), []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("waiting_for_opponent", () => {
      console.log("Waiting for opponent...");
      setScreen('lobby');
    });

    socket.on("match_found", (data: any) => {
      console.log("Match found:", data);
      setMatchData(data);
      setScreen('tips');
    });

    socket.on("match_end", (finalResults: any) => {
      console.log("Match ended:", finalResults);
      handleMatchEnd(finalResults);
    });

    return () => {
      socket.off("connect");
      socket.off("waiting_for_opponent");
      socket.off("match_found");
      socket.off("match_end");
    };
  }, [socket, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser(userSnap.data() as UserData);
          } else {
            // Create new user profile
            const newUser: UserData = {
              username: firebaseUser.displayName || 'New Seedling',
              email: firebaseUser.email || '',
              elo: 0,
              rank: 'Seedling',
              vocaBank: [],
              winStreak: 0,
              createdAt: serverTimestamp() as any
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync user data in real-time
  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUser(snap.data() as UserData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleMatchEnd = async (finalResults: any) => {
    setResults(finalResults);
    setScreen('review');
    
    if (auth.currentUser && user) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      // Allow Elo changes for both real and bot matches
      // "added every win" - we'll ensure elo only increases or stays same
      const eloChange = Math.max(0, finalResults.eloChange);
      const newElo = user.elo + eloChange;
      const newRank = getRank(newElo).title;
      
      // Collect new words for Voca-Bank
      const matchWords = finalResults.words
        .filter((w: any) => w.player === 'You' || w.player === user.username)
        .map((w: any) => w.word.toLowerCase());
      
      const currentVocaBank = user.vocaBank || [];
      const newVocaBank = Array.from(new Set([...currentVocaBank, ...matchWords]));
      
      try {
        await updateDoc(userRef, {
          elo: newElo,
          rank: newRank,
          vocaBank: newVocaBank,
          winStreak: finalResults.winner === 'You' ? (user.winStreak || 0) + 1 : 0
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }
  };

  const handlePractice = (difficulty: string = 'medium') => {
    if (user && socket) {
      console.log("Joining bot match with difficulty:", difficulty);
      socket.emit("join_bot_match", { 
        username: user.username, 
        elo: user.elo,
        difficulty 
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setScreen('dashboard');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleForfeit = () => {
    if (matchData && socket) {
      console.log("Forfeiting match...");
      socket.emit("forfeit_match", { matchId: matchData.matchId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-8 text-center space-y-12">
        <motion.div 
          animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-32 h-32 bg-primary border-8 border-slate-900 rounded-[2rem] flex items-center justify-center text-white text-6xl font-bold shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
        >
          V
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">VocaBox</h1>
          <p className="text-slate-500 text-xl font-medium max-w-xs mx-auto italic">Grow your words. Master your world.</p>
        </div>
        <button 
          onClick={handleLogin}
          className="flex items-center justify-center gap-4 px-12 py-6 bg-accent text-slate-900 cartoon-button font-bold text-2xl"
        >
          <LogIn className="w-8 h-8" /> SIGN IN WITH GOOGLE
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-page-bg relative overflow-hidden">
        <MusicPlayer />
        <AnimatePresence mode="wait">
          {screen === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              <Dashboard 
                user={user} 
                view={dashboardView}
                onViewChange={setDashboardView}
                onPlay={() => setScreen('lobby')} 
                onPractice={handlePractice}
                onLogout={handleLogout}
              />
            </motion.div>
          )}
          
          {screen === 'lobby' && user && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
            >
              <Lobby 
                username={user.username} 
                elo={user.elo} 
                socket={socket}
                onCancel={() => setScreen('dashboard')}
              />
            </motion.div>
          )}

          {screen === 'tips' && matchData && (
            <motion.div
              key="tips"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              <PreGameTips 
                opponent={matchData.opponent}
                onStart={() => setScreen('arena')}
              />
            </motion.div>
          )}

          {screen === 'arena' && matchData && (
            <motion.div
              key="arena"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <Arena 
                matchId={matchData.matchId}
                opponent={matchData.opponent}
                letter={matchData.letter}
                socket={socket}
                onMatchEnd={handleMatchEnd}
                onForfeit={handleForfeit}
              />
            </motion.div>
          )}

          {screen === 'review' && results && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              <Review 
                results={results}
                onHome={() => setScreen('dashboard')}
                onRematch={() => setScreen('lobby')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
