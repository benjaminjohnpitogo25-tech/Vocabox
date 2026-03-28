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

    socket.on("join_bot_match", ({ username, elo }) => {
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
        status: "active",
        startTime: Date.now()
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

        // Bot "thinks" and submits a word every 5-8 seconds
        const botPlayer = match.players.find((p: any) => p.id === "bot_id");
        const tiers = [1, 1, 1, 2, 2, 3]; // Weighted towards common words
        const tier = tiers[Math.floor(Math.random() * tiers.length)];
        const points = tier === 3 ? 5 : (tier === 2 ? 2 : 1);
        
        // In a real app, we'd use a dictionary or Gemini to get a real word.
        // For this demo, we'll just simulate the score and a placeholder word.
        const placeholderWords: Record<string, string[]> = {
          'A': ['Apple', 'Ancient', 'Architect'],
          'B': ['Banana', 'Benevolent', 'Blueprint'],
          'C': ['Cat', 'Courageous', 'Component'],
          'D': ['Dog', 'Dazzling', 'Definition'],
          'E': ['Egg', 'Eloquent', 'Ephemeral'],
          'F': ['Fish', 'Flawless', 'Framework'],
          'G': ['Goat', 'Glistening', 'Graduation'],
          'H': ['Hat', 'Harmonious', 'Hierarchy'],
          'I': ['Ice', 'Illustrious', 'Infrastructure'],
          'J': ['Jar', 'Jovial', 'Jurisdiction'],
          'K': ['Kite', 'Kindhearted', 'Knowledge'],
          'L': ['Lion', 'Luminous', 'Linguist'],
          'M': ['Moon', 'Majestic', 'Mastery'],
          'N': ['Net', 'Nebulous', 'Navigation'],
          'O': ['Owl', 'Omniscient', 'Optimization'],
          'P': ['Pig', 'Picturesque', 'Prestige'],
          'Q': ['Queen', 'Quaint', 'Query'],
          'R': ['Rat', 'Radiant', 'Requirement'],
          'S': ['Sun', 'Serene', 'Scholar'],
          'T': ['Tree', 'Transcendent', 'Technology'],
          'U': ['Up', 'Ubiquitous', 'Utility'],
          'V': ['Van', 'Vibrant', 'Vocabulary'],
          'W': ['Web', 'Wondrous', 'Workflow'],
          'X': ['X-ray', 'Xenon', 'Xylophone'],
          'Y': ['Yak', 'Yearning', 'Yield'],
          'Z': ['Zebra', 'Zealous', 'Zenith']
        };

        const wordList = placeholderWords[match.letter] || ['Word'];
        const word = wordList[tier - 1] || wordList[0];

        botPlayer.score += points;
        match.words.push({ player: "VocaBot", word, tier, points });
        
        io.to(socket.id).emit("word_update", { words: match.words, players: match.players });
        
        if (tier === 3) {
          socket.emit("stunned");
        }
      }, 4000 + Math.random() * 4000); // Faster bot for practice

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

      // Basic validation: starts with letter
      if (word.toUpperCase().startsWith(match.letter)) {
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
