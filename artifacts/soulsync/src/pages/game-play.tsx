import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useCreateGameSession, useCompleteGameSession } from "@workspace/api-client-react";
import { ArrowLeft, Trophy, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const GAME_EMOJIS: Record<string, string> = {
  typing_chemistry: "⌨️",
  delulu_detector:  "🔮",
  emoji_panic:      "😱",
  memory_lane:      "🎞️",
  secret_voting:    "🗳️",
};

const GAME_ID: Record<string, number> = {
  typing_chemistry: 1,
  delulu_detector:  2,
  emoji_panic:      3,
  memory_lane:      4,
  secret_voting:    5,
};

export default function GamePlay() {
  const [, params] = useRoute("/games/:type");
  const type = params?.type ?? "typing_chemistry";

  const [gameState, setGameState] = useState<"lobby" | "playing" | "results">("lobby");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [session, setSession] = useState<{ id: number; won?: boolean; xpEarned?: number } | null>(null);

  const createSession = useCreateGameSession();
  const completeSession = useCompleteGameSession();

  const gameName = type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const startGame = () => {
    createSession.mutate(
      { data: { minigameId: GAME_ID[type] ?? 1 } },
      {
        onSuccess: (data) => {
          setSession(data);
          setGameState("playing");
          setScore(0);
          setTimeLeft(15);
        },
        onError: () => toast.error("Could not start game"),
      }
    );
  };

  const finishGame = () => {
    if (!session) return;
    const won = score > 10;
    completeSession.mutate(
      { gameSessionId: session.id, data: { score, won } },
      {
        onSuccess: (data) => {
          setSession(data);
          setGameState("results");
        },
      }
    );
  };

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
      return () => clearTimeout(t);
    } else if (gameState === "playing" && timeLeft === 0) {
      finishGame();
    }
  }, [gameState, timeLeft]);

  const handleInteract = () => {
    if (gameState !== "playing") return;
    setScore((s) => s + 1);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/games">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm cursor-pointer"
            style={{ background: "hsl(0,0%,100%)", color: "hsl(270,40%,45%)", boxShadow: "0 2px 8px rgba(130,80,200,0.10)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </div>
        </Link>
        <div
          className="px-5 py-2 rounded-full font-black text-sm"
          style={{ background: "hsl(270,55%,87%)", color: "hsl(270,40%,38%)" }}
        >
          {GAME_EMOJIS[type] ?? "🎮"} {gameName}
        </div>
        <div className="w-20" />
      </div>

      {/* ── Game area (white card) ── */}
      <div
        className="flex-1 rounded-[1.75rem] p-8 relative overflow-hidden flex flex-col"
        style={{ background: "hsl(0,0%,100%)", boxShadow: "0 8px 32px rgba(130,80,200,0.12)" }}
      >
        <AnimatePresence mode="wait">
          {/* LOBBY */}
          {gameState === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-5"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{ background: "hsl(270,55%,87%)" }}
              >
                {GAME_EMOJIS[type] ?? "🎮"}
              </div>
              <h2 className="text-3xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
                Ready to play?
              </h2>
              <p className="text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
                Get ready to tap fast and earn some XP!
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={startGame}
                disabled={createSession.isPending}
                className="mt-4 px-12 py-4 rounded-full font-black text-base cursor-pointer disabled:opacity-60"
                style={{ background: "hsl(270,50%,62%)", color: "white", boxShadow: "0 4px 16px rgba(130,80,200,0.28)" }}
              >
                {createSession.isPending ? "Preparing..." : "Start Game"}
              </motion.button>
            </motion.div>
          )}

          {/* PLAYING */}
          {gameState === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              className="flex-1 flex flex-col"
            >
              {/* Score + Timer pills */}
              <div className="flex justify-between items-center mb-8">
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-lg"
                  style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
                >
                  <Trophy className="w-5 h-5" /> {score}
                </div>
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-lg"
                  style={{ background: "hsl(335,65%,87%)", color: "hsl(345,45%,45%)" }}
                >
                  <Clock className="w-5 h-5" /> {timeLeft}s
                </div>
              </div>

              {/* Progress bar */}
              <div className="mx-4 h-2 rounded-full overflow-hidden mb-6" style={{ background: "hsl(270,30%,92%)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(270,50%,62%), hsl(335,65%,72%))" }}
                  animate={{ width: `${(timeLeft / 15) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Tap target */}
              <div className="flex-1 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={handleInteract}
                  className="w-44 h-44 rounded-full font-black text-2xl text-white cursor-pointer select-none focus:outline-none font-display"
                  style={{
                    background: "linear-gradient(135deg, hsl(270,50%,62%), hsl(335,65%,72%))",
                    boxShadow: "0 16px 40px rgba(130,80,200,0.30)",
                  }}
                >
                  TAP!
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* RESULTS */}
          {gameState === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-5"
            >
              <div className="text-6xl">{session?.won ? "🎉" : "💔"}</div>
              <h2 className="text-3xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
                {session?.won ? "You Won!" : "Time's Up!"}
              </h2>

              <div className="w-full max-w-xs space-y-2.5 mt-2">
                <div
                  className="flex items-center justify-between px-5 py-3.5 rounded-full"
                  style={{ background: "hsl(270,55%,87%)" }}
                >
                  <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>Final Score</span>
                  <span className="font-black text-lg" style={{ color: "hsl(270,45%,45%)" }}>{score}</span>
                </div>
                <div
                  className="flex items-center justify-between px-5 py-3.5 rounded-full"
                  style={{ background: "hsl(140,55%,85%)" }}
                >
                  <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>XP Earned</span>
                  <span className="font-black text-lg" style={{ color: "hsl(270,45%,45%)" }}>+{(session as Record<string, unknown>)?.xpEarned as number ?? 0}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Link href="/games">
                  <div
                    className="px-6 py-3 rounded-full font-black text-sm cursor-pointer"
                    style={{ background: "hsl(270,20%,93%)", color: "hsl(270,30%,45%)" }}
                  >
                    Lobby
                  </div>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setGameState("lobby")}
                  className="px-6 py-3 rounded-full font-black text-sm cursor-pointer"
                  style={{ background: "hsl(270,50%,62%)", color: "white", boxShadow: "0 4px 12px rgba(130,80,200,0.28)" }}
                >
                  Play Again
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
