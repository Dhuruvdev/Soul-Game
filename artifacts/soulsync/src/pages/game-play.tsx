import React, { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useCreateGameSession, useCompleteGameSession } from "@workspace/api-client-react";
import { ArrowLeft, Gamepad2, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function GamePlay() {
  const [, params] = useRoute("/games/:type");
  const type = params?.type || "unknown";
  const [, setLocation] = useLocation();
  
  const [gameState, setGameState] = useState<"lobby" | "playing" | "results">("lobby");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [session, setSession] = useState<any>(null);

  const createSession = useCreateGameSession();
  const completeSession = useCompleteGameSession();

  // Map slug to id for demo purposes since we don't have the full list loaded here
  const getGameId = (type: string) => {
    const map: Record<string, number> = {
      'typing_chemistry': 1,
      'delulu_detector': 2,
      'emoji_panic': 3,
      'memory_lane': 4,
      'secret_voting': 5
    };
    return map[type] || 1;
  };

  const startGame = () => {
    createSession.mutate(
      { data: { minigameId: getGameId(type) } },
      {
        onSuccess: (data) => {
          setSession(data);
          setGameState("playing");
          setScore(0);
          setTimeLeft(15);
        },
        onError: () => toast.error("Could not start game")
      }
    );
  };

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "playing" && timeLeft === 0) {
      finishGame();
    }
  }, [gameState, timeLeft]);

  const finishGame = () => {
    if (!session) return;
    
    const won = score > 10; // arbitrary win condition for demo
    
    completeSession.mutate(
      { gameSessionId: session.id, data: { score, won } },
      {
        onSuccess: (data) => {
          setSession(data);
          setGameState("results");
        }
      }
    );
  };

  // Mock game interaction
  const handleInteract = () => {
    if (gameState !== "playing") return;
    setScore(s => s + 1);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" className="rounded-xl" asChild>
          <Link href="/games">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Link>
        </Button>
        <div className="font-bold px-4 py-2 bg-white/50 rounded-xl backdrop-blur-md">
          {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </div>
        <div className="w-20"></div> {/* spacer */}
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-xl p-8 relative overflow-hidden flex flex-col">
        
        <AnimatePresence mode="wait">
          {gameState === "lobby" && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Gamepad2 className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-extrabold">Ready to play?</h2>
              <p className="text-muted-foreground max-w-sm">
                Get ready to tap fast and earn some XP!
              </p>
              <Button 
                size="lg" 
                className="rounded-2xl h-14 px-12 text-lg mt-8 shadow-md"
                onClick={startGame}
                disabled={createSession.isPending}
              >
                {createSession.isPending ? "Preparing..." : "Start Game"}
              </Button>
            </motion.div>
          )}

          {gameState === "playing" && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="bg-primary/10 px-4 py-2 rounded-xl font-bold text-primary text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> {score}
                </div>
                <div className="bg-destructive/10 px-4 py-2 rounded-xl font-bold text-destructive text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5" /> {timeLeft}s
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInteract}
                  className="w-48 h-48 bg-gradient-to-br from-primary to-secondary rounded-full shadow-xl flex items-center justify-center text-white text-4xl font-bold select-none focus:outline-none focus:ring-8 focus:ring-primary/20"
                >
                  TAP ME!
                </motion.button>
              </div>
              
              <Progress value={(timeLeft / 15) * 100} className="h-3" />
            </motion.div>
          )}

          {gameState === "results" && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-6xl mb-4">{session?.won ? '🎉' : '💔'}</div>
              <h2 className="text-4xl font-extrabold text-foreground">
                {session?.won ? 'You Won!' : 'Time\'s Up!'}
              </h2>
              
              <div className="bg-muted/30 p-6 rounded-[2rem] w-full max-w-sm mt-8 border border-white/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground font-medium">Final Score</span>
                  <span className="text-2xl font-bold">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">XP Earned</span>
                  <span className="text-2xl font-bold text-secondary-foreground flex items-center gap-1">
                    +{session?.xpEarned || 0} XP
                  </span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="rounded-xl h-12 px-8" asChild>
                  <Link href="/games">Back to Lobby</Link>
                </Button>
                <Button className="rounded-xl h-12 px-8" onClick={() => setGameState("lobby")}>
                  Play Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
