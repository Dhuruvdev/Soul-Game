import { Link } from "wouter";
import { useListMinigames } from "@workspace/api-client-react";
import { Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const GAME_CONFIG: Record<string, { emoji: string; pill: string }> = {
  typing_chemistry: { emoji: "⌨️", pill: "hsl(270,55%,87%)" },
  delulu_detector:  { emoji: "🔮", pill: "hsl(345,60%,87%)" },
  emoji_panic:      { emoji: "😱", pill: "hsl(200,70%,87%)" },
  memory_lane:      { emoji: "🎞️", pill: "hsl(140,55%,85%)" },
  secret_voting:    { emoji: "🗳️", pill: "hsl(25,70%,87%)"  },
};

export default function GamesLobby() {
  const { data: games, isLoading } = useListMinigames();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="text-3xl md:text-4xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
          Mini-Games
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
          Play together, bond faster.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-full bg-white/70" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {games?.map((game, i) => {
            const cfg = GAME_CONFIG[game.type] ?? { emoji: "🎮", pill: "hsl(270,55%,87%)" };
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <Link href={`/games/${game.type}`}>
                  <div
                    className="flex items-center justify-between px-6 py-4 rounded-full cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    data-testid={`game-card-${game.id}`}
                    style={{
                      background: game.isAvailable ? cfg.pill : "hsl(270,15%,90%)",
                      boxShadow: "0 2px 8px rgba(130,80,200,0.08)",
                      opacity: game.isAvailable ? 1 : 0.65,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <div>
                        <p className="font-black text-base" style={{ color: "hsl(270,35%,30%)" }}>{game.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "hsl(270,25%,52%)" }}>
                            <Users className="w-3 h-3" /> {game.playerCount}p
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "hsl(270,25%,52%)" }}>
                            <Clock className="w-3 h-3" /> {game.duration}s
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-black px-3 py-1 rounded-full"
                        style={{ background: "rgba(130,80,200,0.13)", color: "hsl(270,45%,48%)" }}
                      >
                        +{game.xpReward} XP
                      </span>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ background: "rgba(130,80,200,0.14)", color: "hsl(270,45%,48%)" }}
                      >
                        {game.isAvailable ? "▶" : "🔒"}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
