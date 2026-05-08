import { useGetDashboard } from "@workspace/api-client-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Zap, Gamepad2, Trophy, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ROOM_EMOJI: Record<string, string> = {
  sleepover: "🛌", study: "📚", heartbreak: "💔",
  arcade: "🕹️", gossip: "☕", chaotic_vc: "🌪️",
};

const ACTIVITY_ICON: Record<string, string> = {
  heart_sent: "💖", compliment_received: "✨", game_played: "🎮",
  bond_leveled: "🔥", friend_added: "👯", room_joined: "🛋️", level_up: "⭐",
};

export default function Home() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-52 rounded-2xl bg-white/60" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-[560px] rounded-[1.75rem] bg-white/60" />
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-44 rounded-[1.75rem] bg-white/60" />
            <Skeleton className="h-64 rounded-[1.75rem] bg-white/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-3xl md:text-4xl font-black font-display leading-tight"
          style={{ color: "hsl(270,45%,40%)" }}
        >
          Welcome back,{" "}
          <span style={{ color: "hsl(270,50%,62%)" }}>
            {dashboard.profile.displayName}
          </span>
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
          Ready to sync some souls today?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left: Profile + quick stats ── */}
        <motion.div
          className="lg:col-span-4 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
        >
          <ProfileCard profile={dashboard.profile} isHoverable />

          {/* Quick stats row (white card) */}
          <div className="bg-white rounded-[1.5rem] p-4 flex justify-around" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            {[
              { icon: Heart, value: dashboard.heartsReceived, label: "Hearts", color: "hsl(345,60%,58%)" },
              { icon: Zap,   value: dashboard.streakDays,     label: "Streak", color: "hsl(270,50%,62%)" },
              { icon: Gamepad2, value: dashboard.gamesPlayedToday, label: "Games",  color: "hsl(200,55%,52%)" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color }}>
                  <Icon className="w-4 h-4" />
                  <span className="font-black text-lg">{value}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "hsl(270,20%,62%)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right: Challenges + rooms + activity ── */}
        <motion.div
          className="lg:col-span-8 space-y-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          {/* Daily Challenges */}
          <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5" style={{ color: "hsl(270,50%,62%)" }} />
              <h2 className="text-xl font-black font-display" style={{ color: "hsl(270,40%,38%)" }}>Daily Challenges</h2>
            </div>
            <div className="space-y-3">
              {dashboard.dailyChallenges.map((c, i) => {
                const pillColors = ["hsl(270,55%,87%)", "hsl(200,70%,87%)", "hsl(140,55%,85%)"];
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-5 py-3.5 rounded-full"
                    style={{
                      background: c.completed ? "hsl(270,20%,93%)" : pillColors[i % pillColors.length],
                      opacity: c.completed ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)", textDecoration: c.completed ? "line-through" : "none" }}>
                        {c.title}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{c.description}</span>
                    </div>
                    <span
                      className="text-xs font-black px-3 py-1 rounded-full shrink-0"
                      style={{ background: "rgba(130,80,200,0.12)", color: "hsl(270,45%,48%)" }}
                    >
                      +{c.xpReward} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Active Rooms */}
            <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black font-display" style={{ color: "hsl(270,40%,38%)" }}>Active Rooms</h2>
                <Link href="/rooms" className="flex items-center gap-1 text-xs font-black" style={{ color: "hsl(270,50%,62%)" }}>
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {dashboard.activeRooms.slice(0, 3).map((room, i) => {
                  const pillColors = ["hsl(200,70%,87%)", "hsl(140,55%,85%)", "hsl(25,70%,87%)"];
                  return (
                    <Link key={room.id} href={`/rooms/${room.id}`}>
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-full cursor-pointer hover:scale-[1.01] transition-transform"
                        style={{ background: pillColors[i % pillColors.length] }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{ROOM_EMOJI[room.theme] ?? "🏠"}</span>
                          <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>{room.name}</span>
                        </div>
                        <span className="text-xs font-black" style={{ color: "hsl(270,35%,50%)" }}>
                          {room.occupantCount}/{room.maxOccupants}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
              <h2 className="text-lg font-black font-display mb-4" style={{ color: "hsl(270,40%,38%)" }}>Activity</h2>
              <div className="space-y-3">
                {dashboard.recentActivity.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5">{ACTIVITY_ICON[a.type] ?? "✨"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug" style={{ color: "hsl(270,35%,32%)" }}>
                        <span className="font-black">{a.username}</span>{" "}
                        {a.message}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(270,20%,62%)" }}>
                        {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {a.xpGained && (
                      <span className="text-xs font-black shrink-0" style={{ color: "hsl(270,50%,58%)" }}>+{a.xpGained}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
