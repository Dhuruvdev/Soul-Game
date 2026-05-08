import { motion } from "framer-motion";
import { UserProfile } from "@workspace/api-client-react";
import { Heart, MapPin, Sparkles, Zap, Activity, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileCardProps {
  profile: UserProfile;
  isHoverable?: boolean;
  compact?: boolean;
}

const STAT_PILLS = [
  { key: "delulu",             label: "Delulu",   color: "hsl(270,55%,87%)", icon: Activity        },
  { key: "redFlag",            label: "Red Flag", color: "hsl(345,60%,87%)", icon: AlertTriangle   },
  { key: "chronicallyOnline",  label: "Online",   color: "hsl(200,70%,87%)", icon: Zap             },
  { key: "mainCharacterEnergy",label: "MC Energy",color: "hsl(140,55%,85%)", icon: Sparkles        },
] as const;

export function ProfileCard({ profile, isHoverable = false, compact = false }: ProfileCardProps) {
  const pct = Math.min(100, Math.max(0, (profile.xp / profile.xpToNext) * 100));

  return (
    <motion.div
      whileHover={isHoverable ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-white rounded-[1.75rem] p-6 relative overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(130,80,200,0.13)" }}
    >
      {/* Inner pastel corner blobs */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "hsl(270,55%,87%)", opacity: 0.35 }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "hsl(200,70%,87%)", opacity: 0.30 }}
      />

      {/* ── Avatar centered at top (reference style — no spinning ring) ── */}
      <div className="flex flex-col items-center text-center relative z-10">
        <div className="relative mb-1">
          <Avatar
            className={`border-4 border-white shadow-md ${compact ? "w-20 h-20" : "w-28 h-28"}`}
            style={{ boxShadow: "0 0 0 4px hsl(270,55%,87%), 0 6px 20px rgba(130,80,200,0.18)" }}
          >
            <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
            <AvatarFallback
              className="font-black text-2xl font-display"
              style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,50%)" }}
            >
              {profile.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Level badge pill */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-black whitespace-nowrap"
            style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
          >
            Lvl {profile.level}
          </div>
        </div>

        {/* ── Big display name — matching reference "Lylac" style ── */}
        <h2
          className={`font-black font-display mt-5 leading-none ${compact ? "text-3xl" : "text-4xl"}`}
          style={{ color: "hsl(270,45%,60%)" }}
        >
          {profile.displayName}
        </h2>

        {/* ── Bullet-separated tags (reference style) ── */}
        {profile.tags && profile.tags.length > 0 && (
          <p className="text-sm font-semibold mt-2 leading-relaxed" style={{ color: "hsl(270,35%,62%)" }}>
            {profile.tags.map((t, i) => (
              <span key={i}>{i > 0 && " • "}{t}</span>
            ))}
          </p>
        )}

        {profile.title && (
          <span
            className="mt-3 px-4 py-1 rounded-full text-xs font-bold"
            style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
          >
            {profile.title}
          </span>
        )}
      </div>

      {/* ── XP Bar ── */}
      <div className="mt-5 relative z-10">
        <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: "hsl(270,30%,60%)" }}>
          <span>XP {profile.xp.toLocaleString()}</span>
          <span>Next {profile.xpToNext.toLocaleString()}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(270,55%,91%)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(270,50%,65%), hsl(335,65%,72%))" }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Mood ── */}
      {profile.mood && (
        <div
          className="mt-4 rounded-2xl px-4 py-2.5 text-center text-sm font-semibold relative z-10"
          style={{ background: "hsl(290,40%,94%)", color: "hsl(270,35%,48%)" }}
        >
          {profile.mood}
        </div>
      )}

      {/* ── Stat pills (wide rows matching reference) ── */}
      <div className="mt-4 space-y-2.5 relative z-10">
        {STAT_PILLS.map(({ key, label, color, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between px-5 py-3 rounded-full"
            style={{ background: color }}
          >
            <span className="font-bold text-sm" style={{ color: "hsl(270,35%,32%)" }}>{label}</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-base" style={{ color: "hsl(270,45%,45%)" }}>
                {(profile as Record<string, unknown>)[key] as number}%
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(130,80,200,0.12)" }}
              >
                <Icon className="w-4 h-4" style={{ color: "hsl(270,45%,50%)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer row ── */}
      <div
        className="mt-5 pt-4 flex items-center justify-between text-sm relative z-10"
        style={{ borderTop: "1px solid hsl(270,30%,91%)" }}
      >
        <div className="flex items-center gap-1.5 font-bold" style={{ color: "hsl(345,60%,58%)" }}>
          <Heart className="w-4 h-4 fill-current" />
          <span>{profile.totalHearts} hearts</span>
        </div>
        {profile.currentRoom && (
          <div className="flex items-center gap-1.5 font-semibold text-xs" style={{ color: "hsl(270,25%,60%)" }}>
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[110px]">{profile.currentRoom}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
