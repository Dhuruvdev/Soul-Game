import { useGetProfileStats } from "@workspace/api-client-react";
import { Sparkles, Heart, Gamepad2, Zap, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";

const STAT_PILLS = [
  { icon: Heart,    key: "totalHearts",   label: "Hearts Got", pill: "hsl(335,65%,87%)" },
  { icon: Zap,      key: "longestStreak", label: "Max Streak", pill: "hsl(50,70%,87%)"  },
  { icon: Gamepad2, key: "gamesWon",      label: "Games Won",  pill: "hsl(200,70%,87%)" },
  { icon: Sparkles, key: "chaosLevel",    label: "Chaos Lvl",  pill: "hsl(270,55%,87%)" },
] as const;

export default function Stats() {
  const { data: stats, isLoading } = useGetProfileStats();

  const handleShare = () => {
    toast.success("Wrapped card copied! Ready to post on Discord 🎉");
  };

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto mt-8 space-y-3 animate-pulse">
        <Skeleton className="h-10 w-48 mx-auto rounded-2xl bg-white/60" />
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-16 rounded-full bg-white/60" />)}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-12">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="text-3xl md:text-4xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
          Wrapped
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
          Your social aesthetic, quantified.
        </p>
      </motion.div>

      {/* Wrapped card — white with pastel gradient header */}
      <motion.div
        className="bg-white rounded-[1.75rem] overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(130,80,200,0.16)" }}
        initial={{ rotate: -1, scale: 0.97, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
      >
        {/* Gradient header strip */}
        <div
          className="px-6 pt-8 pb-6 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(135deg, hsl(270,55%,87%) 0%, hsl(335,65%,87%) 50%, hsl(25,70%,87%) 100%)" }}
        >
          <img
            src={stats.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${stats.user.username}`}
            alt="Avatar"
            className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white mb-3"
          />
          <h2 className="text-3xl font-black font-display" style={{ color: "hsl(270,45%,38%)" }}>
            {stats.user.displayName}
          </h2>
          <p className="text-sm font-bold mt-1" style={{ color: "hsl(270,35%,52%)" }}>
            Lvl {stats.user.level} • {stats.user.title || "Main Character"}
          </p>
        </div>

        {/* Stat pills inside white card body */}
        <div className="p-5 space-y-2.5">
          {STAT_PILLS.map(({ icon: Icon, key, label, pill }) => {
            const value = (stats as Record<string, unknown>)[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between px-5 py-3.5 rounded-full"
                style={{ background: pill }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(130,80,200,0.13)" }}>
                    <Icon className="w-4 h-4" style={{ color: "hsl(270,45%,50%)" }} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>{label}</span>
                </div>
                <span className="font-black text-lg" style={{ color: "hsl(270,45%,45%)" }}>
                  {key === "chaosLevel" ? `${value}%` : String(value)}
                </span>
              </div>
            );
          })}

          {/* Extra details */}
          <div
            className="flex items-center justify-between px-5 py-3.5 rounded-full"
            style={{ background: "hsl(140,55%,85%)" }}
          >
            <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>Favorite Room</span>
            <span className="font-black text-sm" style={{ color: "hsl(270,45%,45%)" }}>{stats.favoriteRoom || "Sleepover"}</span>
          </div>

          {stats.topBond && (
            <div
              className="flex items-center justify-between px-5 py-3.5 rounded-full"
              style={{ background: "hsl(200,70%,87%)" }}
            >
              <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>Top Bond</span>
              <span className="font-black text-sm" style={{ color: "hsl(270,45%,45%)" }}>{stats.topBond.user.displayName}</span>
            </div>
          )}

          {stats.topEmojis.length > 0 && (
            <div
              className="flex items-center justify-between px-5 py-3.5 rounded-full"
              style={{ background: "hsl(50,70%,87%)" }}
            >
              <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>Top Emojis</span>
              <span className="text-base tracking-widest">{stats.topEmojis.join(" ")}</span>
            </div>
          )}

          {stats.toxicDuoTitle && (
            <div
              className="flex items-center justify-between px-5 py-3.5 rounded-full"
              style={{ background: "hsl(335,65%,87%)" }}
            >
              <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>Duo Title</span>
              <span className="font-black text-sm italic" style={{ color: "hsl(270,45%,45%)" }}>"{stats.toxicDuoTitle}"</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Share button */}
      <motion.button
        onClick={handleShare}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-black text-sm cursor-pointer"
        style={{ background: "hsl(270,50%,62%)", color: "white", boxShadow: "0 4px 16px rgba(130,80,200,0.30)" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Share2 className="w-4 h-4" /> Share to Discord
      </motion.button>
    </div>
  );
}
