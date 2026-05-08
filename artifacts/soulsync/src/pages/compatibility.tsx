import { useRoute, Link } from "wouter";
import { useGetCompatibility } from "@workspace/api-client-react";
import { ArrowLeft, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BREAKDOWN_PILLS = [
  { key: "vibe",    label: "Vibe Match",      pill: "hsl(270,55%,87%)" },
  { key: "chaos",   label: "Chaos Alignment", pill: "hsl(335,65%,87%)" },
  { key: "loyalty", label: "Loyalty / Trust", pill: "hsl(200,70%,87%)" },
  { key: "humor",   label: "Humor Wavelength",pill: "hsl(140,55%,85%)" },
] as const;

export default function Compatibility() {
  const [, params] = useRoute("/compatibility/:userId");
  const userId = params?.userId ? parseInt(params.userId) : 0;

  const { data: result, isLoading, error } = useGetCompatibility(userId, {
    query: { enabled: !!userId }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-2xl font-black font-display" style={{ color: "hsl(270,45%,55%)" }}>
          Calculating vibes... 🔮
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <AlertTriangle className="w-10 h-10" style={{ color: "hsl(345,60%,58%)" }} />
        <h2 className="text-xl font-black font-display" style={{ color: "hsl(270,40%,38%)" }}>
          Could not read the stars
        </h2>
        <Link href="/friends">
          <div
            className="px-6 py-2.5 rounded-full font-black text-sm cursor-pointer"
            style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
          >
            ← Back to Friends
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-5 pb-12">
      <Link href={`/profile/${userId}`}>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm cursor-pointer"
          style={{ background: "hsl(0,0%,100%)", color: "hsl(270,40%,45%)", boxShadow: "0 2px 8px rgba(130,80,200,0.10)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </div>
      </Link>

      {/* Score reveal */}
      <motion.div
        className="text-center relative py-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          className="w-32 h-32 mx-auto rounded-full flex items-center justify-center font-black text-4xl font-display text-white mb-4"
          style={{ background: "linear-gradient(135deg, hsl(270,50%,62%), hsl(335,65%,72%))", boxShadow: "0 12px 32px rgba(130,80,200,0.30)" }}
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.1 }}
        >
          {result.score}%
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h1 className="text-2xl font-black font-display" style={{ color: "hsl(270,45%,38%)" }}>
            {result.title}
          </h1>
          <p className="text-sm font-semibold mt-2 max-w-xs mx-auto" style={{ color: "hsl(270,25%,58%)" }}>
            {result.verdict}
          </p>
        </motion.div>
      </motion.div>

      {/* Card with avatars + breakdown */}
      <motion.div
        className="bg-white rounded-[1.75rem] p-6 space-y-5"
        style={{ boxShadow: "0 8px 32px rgba(130,80,200,0.13)" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
      >
        {/* Avatars */}
        <div className="flex justify-center items-center gap-6">
          <Avatar className="w-16 h-16 border-4 border-white shadow-md" style={{ boxShadow: "0 0 0 3px hsl(270,55%,87%)" }}>
            <AvatarFallback className="font-black font-display text-sm" style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,48%)" }}>
              ME
            </AvatarFallback>
          </Avatar>
          <Sparkles className="w-6 h-6" style={{ color: "hsl(270,50%,62%)" }} />
          <Avatar className="w-16 h-16 border-4 border-white shadow-md" style={{ boxShadow: "0 0 0 3px hsl(335,65%,87%)" }}>
            <AvatarImage src={result.user.avatarUrl || undefined} />
            <AvatarFallback className="font-black font-display text-sm" style={{ background: "hsl(335,65%,87%)", color: "hsl(270,45%,48%)" }}>
              {result.user.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Breakdown pills */}
        <div className="space-y-2.5">
          {BREAKDOWN_PILLS.map(({ key, label, pill }) => {
            const pct = result.breakdown[key];
            return (
              <div key={key}>
                <div
                  className="flex items-center justify-between px-5 py-3 rounded-full"
                  style={{ background: pill }}
                >
                  <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>{label}</span>
                  <span className="font-black text-base" style={{ color: "hsl(270,45%,45%)" }}>{pct}%</span>
                </div>
                {/* Progress indicator as a thin bar below pill */}
                <div className="mx-4 mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(130,80,200,0.10)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "hsl(270,50%,62%)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bond XP bonus */}
        <div
          className="flex items-center justify-between px-5 py-3.5 rounded-full"
          style={{ background: "hsl(50,70%,87%)" }}
        >
          <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>Bond XP Bonus</span>
          <span className="font-black text-lg" style={{ color: "hsl(270,50%,50%)" }}>+{result.bondXp} XP</span>
        </div>
      </motion.div>
    </div>
  );
}
