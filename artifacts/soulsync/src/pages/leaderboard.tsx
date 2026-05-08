import { Link } from "wouter";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const RANK_PILL = [
  "hsl(50,70%,87%)",    // #1 gold-ish
  "hsl(270,35%,88%)",   // #2 silver-ish
  "hsl(25,70%,87%)",    // #3 bronze-ish
];

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 10 });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="text-3xl md:text-4xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
          Top Souls
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
          The most active and adored players.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-full bg-white/70" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard?.map((entry, i) => {
            const pillBg = i < 3 ? RANK_PILL[i] : "hsl(0,0%,100%)";
            const rankLabel = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${entry.rank}`;

            return (
              <motion.div
                key={entry.user.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Link href={`/profile/${entry.user.id}`}>
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 rounded-full cursor-pointer hover:scale-[1.01] transition-transform"
                    data-testid={`leaderboard-entry-${entry.rank}`}
                    style={{
                      background: pillBg,
                      boxShadow: i === 0
                        ? "0 4px 16px rgba(200,160,60,0.18)"
                        : "0 2px 8px rgba(130,80,200,0.08)",
                    }}
                  >
                    {/* Rank */}
                    <span className="text-xl w-8 text-center font-black shrink-0">
                      {rankLabel}
                    </span>

                    {/* Avatar */}
                    <Avatar className="border-2 border-white shadow-sm w-10 h-10 shrink-0">
                      <AvatarImage src={entry.user.avatarUrl || undefined} />
                      <AvatarFallback
                        className="text-xs font-black"
                        style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,48%)" }}
                      >
                        {entry.user.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + level */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate" style={{ color: "hsl(270,35%,28%)" }}>
                        {entry.user.displayName}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "hsl(270,25%,55%)" }}>
                        Lvl {entry.user.level}
                      </p>
                    </div>

                    {/* XP */}
                    <div className="text-right shrink-0">
                      <p className="font-black text-base" style={{ color: "hsl(270,50%,55%)" }}>
                        {entry.totalXp.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "hsl(270,20%,60%)" }}>
                        XP
                      </p>
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
