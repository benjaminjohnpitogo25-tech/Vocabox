import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Matchmaking Queue
  let waitingPlayer: { id: string; username: string; elo: number } | null = null;
  const activeMatches = new Map<string, any>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_queue", ({ username, elo }) => {
      // Clear any existing waiting player if it's the same socket
      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null;
      }

      if (waitingPlayer) {
        const opponent = waitingPlayer;
        const matchId = `match_${opponent.id}_${socket.id}`;
        waitingPlayer = null;

        const matchState = {
          id: matchId,
          players: [
            { id: opponent.id, username: opponent.username, elo: opponent.elo, score: 0 },
            { id: socket.id, username: username, elo: elo, score: 0 }
          ],
          round: 1,
          letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
          words: [],
          usedWords: new Set<string>(),
          status: "active",
          startTime: Date.now()
        };

        activeMatches.set(matchId, matchState);
        
        io.to(opponent.id).emit("match_found", { matchId, opponent: { username, elo }, letter: matchState.letter });
        io.to(socket.id).emit("match_found", { matchId, opponent: { username: opponent.username, elo: opponent.elo }, letter: matchState.letter });

        // End match after 60 seconds
        setTimeout(() => {
          const finalMatch = activeMatches.get(matchId);
          if (finalMatch && finalMatch.status === "active") {
            finalMatch.status = "finished";
            const winner = finalMatch.players[0].score > finalMatch.players[1].score ? finalMatch.players[0] : finalMatch.players[1];
            
            io.to(finalMatch.players[0].id).emit("match_end", { 
              winner: winner.id === finalMatch.players[0].id ? 'You' : 'Opponent',
              score: finalMatch.players[0].score,
              oppScore: finalMatch.players[1].score,
              eloChange: winner.id === finalMatch.players[0].id ? 24 : -18,
              words: finalMatch.words
            });
            
            io.to(finalMatch.players[1].id).emit("match_end", { 
              winner: winner.id === finalMatch.players[1].id ? 'You' : 'Opponent',
              score: finalMatch.players[1].score,
              oppScore: finalMatch.players[0].score,
              eloChange: winner.id === finalMatch.players[1].id ? 24 : -18,
              words: finalMatch.words
            });
            
            activeMatches.delete(matchId);
          }
        }, 60000);
      } else {
        waitingPlayer = { id: socket.id, username, elo };
        socket.emit("waiting_for_opponent");
      }
    });

    socket.on("leave_queue", () => {
      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null;
        console.log("User left queue:", socket.id);
      }
    });

    socket.on("join_bot_match", ({ username, elo, difficulty = 'medium' }) => {
      const matchId = `bot_match_${socket.id}_${Date.now()}`;
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      
      const matchState = {
        id: matchId,
        players: [
          { id: socket.id, username: username, elo: elo, score: 0 },
          { id: "bot_id", username: "VocaBot", elo: 1500, score: 0 }
        ],
        round: 1,
        letter: letter,
        words: [],
        usedWords: new Set<string>(),
        status: "active",
        startTime: Date.now(),
        difficulty
      };

      activeMatches.set(matchId, matchState);
      
      socket.emit("match_found", { 
        matchId, 
        opponent: { username: "VocaBot", elo: 1500 }, 
        letter: matchState.letter 
      });

      // Bot simulation logic
      const botInterval = setInterval(() => {
        const match = activeMatches.get(matchId);
        if (!match || match.status !== "active") {
          clearInterval(botInterval);
          return;
        }

        // Bot "thinks" and submits a word based on difficulty
        const botPlayer = match.players.find((p: any) => p.id === "bot_id");
        const placeholderWords: Record<string, string[]> = {
          'A': ['Apple', 'Ancient', 'Architect', 'Avenue', 'Action', 'Active', 'Artist', 'Aspect'],
          'B': ['Banana', 'Benevolent', 'Blueprint', 'Bridge', 'Bright', 'Button', 'Better', 'Beyond'],
          'C': ['Cat', 'Courageous', 'Component', 'Circle', 'Center', 'Create', 'Common', 'Client'],
          'D': ['Dog', 'Dazzling', 'Definition', 'Device', 'Detail', 'Design', 'Direct', 'Double'],
          'E': ['Egg', 'Eloquent', 'Ephemeral', 'Energy', 'Effect', 'Expert', 'Entire', 'Enable'],
          'F': ['Fish', 'Flawless', 'Framework', 'Future', 'Factor', 'Figure', 'Finish', 'Follow'],
          'G': ['Goat', 'Glistening', 'Graduation', 'Growth', 'Garden', 'Global', 'Gather', 'Gentle'],
          'H': ['Hat', 'Harmonious', 'Hierarchy', 'Health', 'History', 'Happen', 'Highly', 'Handle'],
          'I': ['Ice', 'Illustrious', 'Infrastructure', 'Impact', 'Inside', 'Island', 'Ignore', 'Intent'],
          'J': ['Jar', 'Jovial', 'Jurisdiction', 'Journey', 'Journal', 'Justice', 'Jacket', 'Junior'],
          'K': ['Kite', 'Kindhearted', 'Knowledge', 'Kitchen', 'Kingdom', 'Keynote', 'Keyword', 'Kinetic'],
          'L': ['Lion', 'Luminous', 'Linguist', 'Library', 'Logical', 'Legend', 'Listen', 'Layout'],
          'M': ['Moon', 'Majestic', 'Mastery', 'Modern', 'Method', 'Memory', 'Motion', 'Manage'],
          'N': ['Net', 'Nebulous', 'Navigation', 'Nature', 'Notice', 'Normal', 'Number', 'Native'],
          'O': ['Owl', 'Omniscient', 'Optimization', 'Object', 'Office', 'Option', 'Online', 'Output'],
          'P': ['Pig', 'Picturesque', 'Prestige', 'Public', 'Player', 'Policy', 'Proper', 'Period'],
          'Q': ['Queen', 'Quaint', 'Query', 'Quality', 'Quartz', 'Quiver', 'Quench', 'Quorum'],
          'R': ['Rat', 'Radiant', 'Requirement', 'Recent', 'Report', 'Result', 'Review', 'Record'],
          'S': ['Sun', 'Serene', 'Scholar', 'System', 'Simple', 'Social', 'Status', 'Source'],
          'T': ['Tree', 'Transcendent', 'Technology', 'Target', 'Theory', 'Travel', 'Ticket', 'Timing'],
          'U': ['Up', 'Ubiquitous', 'Utility', 'Unique', 'Update', 'Useful', 'Urgent', 'Unlock'],
          'V': ['Van', 'Vibrant', 'Vocabulary', 'Vision', 'Volume', 'Values', 'Verify', 'Visual'],
          'W': ['Web', 'Wondrous', 'Workflow', 'Window', 'Weight', 'Worker', 'Writer', 'Weekly'],
          'X': ['X-ray', 'Xenon', 'Xylophone', 'Xerox', 'Xylem', 'Xenon', 'Xenon', 'Xenon'],
          'Y': ['Yak', 'Yearning', 'Yield', 'Yellow', 'Youth', 'Yonder', 'Yearly', 'Yogurt'],
          'Z': ['Zebra', 'Zealous', 'Zenith', 'Zigzag', 'Zodiac', 'Zephyr', 'Zinger', 'Zestful']
        };

        const wordList = placeholderWords[match.letter] || ['Word'];
        const availableWords = wordList.filter(w => !match.usedWords.has(w.toLowerCase()));
        
        if (availableWords.length === 0) return;

        // Difficulty adjustments
        let selectedWord;
        if (difficulty === 'easy') {
          // Easy: Prefer shorter words
          const easyWords = availableWords.filter(w => w.length <= 5);
          selectedWord = easyWords.length > 0 
            ? easyWords[Math.floor(Math.random() * easyWords.length)]
            : availableWords[Math.floor(Math.random() * availableWords.length)];
        } else if (difficulty === 'hard') {
          // Hard: Prefer longer words
          const hardWords = availableWords.filter(w => w.length > 7);
          selectedWord = hardWords.length > 0 
            ? hardWords[Math.floor(Math.random() * hardWords.length)]
            : availableWords[Math.floor(Math.random() * availableWords.length)];
        } else {
          selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        }

        match.usedWords.add(selectedWord.toLowerCase());

        const tier = selectedWord.length > 8 ? 3 : (selectedWord.length > 5 ? 2 : 1);
        const points = tier === 3 ? 5 : (tier === 2 ? 2 : 1);

        botPlayer.score += points;
        match.words.push({ player: "VocaBot", word: selectedWord, tier, points });
        
        io.to(socket.id).emit("word_update", { words: match.words, players: match.players });
        
        if (tier === 3) {
          socket.emit("stunned");
        }
      }, difficulty === 'easy' ? 8000 + Math.random() * 4000 : (difficulty === 'hard' ? 3000 + Math.random() * 2000 : 5000 + Math.random() * 3000));

      // End match after 60 seconds
      setTimeout(() => {
        const finalMatch = activeMatches.get(matchId);
        if (finalMatch && finalMatch.status === "active") {
          finalMatch.status = "finished";
          clearInterval(botInterval);
          
          const winner = finalMatch.players[0].score > finalMatch.players[1].score ? finalMatch.players[0] : finalMatch.players[1];
          
          socket.emit("match_end", { 
            winner: winner.id === socket.id ? 'You' : 'Opponent',
            score: finalMatch.players[0].score,
            oppScore: finalMatch.players[1].score,
            eloChange: winner.id === socket.id ? 10 : -5, // Lower stakes for bot matches
            words: finalMatch.words
          });
          
          activeMatches.delete(matchId);
        }
      }, 60000);
    });

    socket.on("submit_word", ({ matchId, word, tier }) => {
      const match = activeMatches.get(matchId);
      if (!match || match.status !== "active") return;

      const player = match.players.find((p: any) => p.id === socket.id);
      if (!player) return;

      // Check if word was already used in this match
      const normalizedWord = word.toLowerCase();
      if (match.usedWords.has(normalizedWord)) {
        socket.emit("word_error", { message: "Word already used!" });
        return;
      }

      // Basic validation: starts with letter
      if (word.toUpperCase().startsWith(match.letter)) {
        match.usedWords.add(normalizedWord);
        const points = tier === 3 ? 5 : (tier === 2 ? 2 : 1);
        player.score += points;
        
        match.words.push({ player: player.username, word, tier, points });
        
        // Broadcast to all real players in the match
        match.players.forEach((p: any) => {
          if (p.id !== "bot_id") {
            io.to(p.id).emit("word_update", { words: match.words, players: match.players });
          }
        });

        if (tier === 3) {
          const opponent = match.players.find((p: any) => p.id !== socket.id);
          if (opponent && opponent.id !== "bot_id") {
            io.to(opponent.id).emit("stunned");
          }
        }
      }
    });

    socket.on("forfeit_match", ({ matchId }) => {
      const match = activeMatches.get(matchId);
      if (match && match.status === "active") {
        match.status = "finished";
        
        const opponent = match.players.find((p: any) => p.id !== socket.id);
        
        // Notify the forfeiter
        socket.emit("match_end", {
          winner: 'Opponent',
          score: match.players.find((p: any) => p.id === socket.id).score,
          oppScore: opponent.score,
          eloChange: matchId.startsWith('bot_') ? 0 : -20,
          words: match.words,
          forfeited: true
        });

        // Notify the opponent if they are a real player
        if (opponent && opponent.id !== "bot_id") {
          io.to(opponent.id).emit("match_end", {
            winner: 'You',
            score: opponent.score,
            oppScore: match.players.find((p: any) => p.id === socket.id).score,
            eloChange: 20,
            words: match.words,
            opponentForfeited: true
          });
        }

        activeMatches.delete(matchId);
      }
    });

    socket.on("disconnect", () => {
      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null;
      }
      // Handle match abandonment if needed
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
