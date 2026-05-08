import { Link } from "wouter";
import { useGetMyProfile, useGetMyFriends, useGetMyBonds } from "@workspace/api-client-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Copy, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const BOND_PILLS = [
  "hsl(270,55%,87%)", "hsl(200,70%,87%)", "hsl(140,55%,85%)",
  "hsl(25,70%,87%)",  "hsl(335,65%,87%)", "hsl(50,70%,87%)",
];

export default function MyProfile() {
  const { data: profile, isLoading: loadingProfile } = useGetMyProfile();
  const { data: friends, isLoading: loadingFriends } = useGetMyFriends();
  const { data: bonds, isLoading: loadingBonds } = useGetMyBonds();

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile?.id}`);
    toast.success("Profile link copied!");
  };

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-2xl bg-white/60" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-4 h-[560px] rounded-[1.75rem] bg-white/60" />
          <div className="md:col-span-8 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-full bg-white/60" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
            Your Aesthetics
          </h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
            This is how the world sees your soul.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer hover:scale-[1.02] transition-transform"
          style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
          data-testid="button-copy-profile"
        >
          <Copy className="w-4 h-4" /> Share
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile card */}
        <motion.div
          className="md:col-span-4"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <ProfileCard profile={profile} />
        </motion.div>

        {/* Right panel */}
        <motion.div
          className="md:col-span-8 space-y-5"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Soul Ties (bonds) */}
          <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            <h3 className="text-lg font-black font-display mb-4" style={{ color: "hsl(270,40%,38%)" }}>
              Soul Ties
            </h3>
            {loadingBonds ? (
              <div className="space-y-2.5">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-full bg-muted/40" />)}
              </div>
            ) : bonds && bonds.length > 0 ? (
              <div className="space-y-2.5">
                {bonds.map((bond, i) => (
                  <Link key={bond.id} href={`/profile/${bond.user.id}`}>
                    <div
                      className="flex items-center gap-4 px-5 py-3 rounded-full cursor-pointer hover:scale-[1.01] transition-transform"
                      style={{ background: BOND_PILLS[i % BOND_PILLS.length] }}
                      data-testid={`bond-item-${bond.id}`}
                    >
                      <Avatar className="w-9 h-9 border-2 border-white shadow-sm shrink-0">
                        <AvatarImage src={bond.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs font-black" style={{ background: "white", color: "hsl(270,45%,50%)" }}>
                          {bond.user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm" style={{ color: "hsl(270,35%,28%)" }}>{bond.user.displayName}</p>
                        <p className="text-xs font-semibold" style={{ color: "hsl(270,25%,55%)" }}>{bond.title ?? "Growing Bond"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Zap className="w-4 h-4" style={{ color: "hsl(270,45%,52%)" }} />
                        <span className="font-black text-sm" style={{ color: "hsl(270,45%,45%)" }}>{bond.streak}d</span>
                        <span
                          className="text-xs font-black px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(130,80,200,0.14)", color: "hsl(270,45%,45%)" }}
                        >
                          Lvl {bond.level}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-8 rounded-[1.25rem]"
                style={{ background: "hsl(270,35%,95%)" }}
              >
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "hsl(270,40%,55%)" }} />
                <p className="font-bold text-sm" style={{ color: "hsl(270,25%,55%)" }}>No soul ties yet</p>
                <Link href="/friends" className="text-xs font-black mt-1 block" style={{ color: "hsl(270,50%,60%)" }}>
                  Find friends →
                </Link>
              </div>
            )}
          </div>

          {/* Titles */}
          <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            <h3 className="text-lg font-black font-display mb-4" style={{ color: "hsl(270,40%,38%)" }}>
              Titles
            </h3>
            <div className="space-y-2.5">
              {[
                { label: profile.title ?? "The Newcomer", equipped: true,  pill: "hsl(270,55%,87%)" },
                { label: "Night Owl",         equipped: false, pill: "hsl(270,20%,91%)" },
                { label: "Chaos Coordinator", equipped: false, pill: "hsl(270,20%,91%)" },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 rounded-full"
                  style={{ background: t.pill, opacity: t.equipped ? 1 : 0.6 }}
                >
                  <span className="font-black text-sm" style={{ color: "hsl(270,35%,30%)" }}>{t.label}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(130,80,200,0.14)" }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: t.equipped ? "hsl(270,50%,52%)" : "hsl(270,20%,65%)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friends */}
          <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black font-display" style={{ color: "hsl(270,40%,38%)" }}>Friends</h3>
              <Link href="/friends" className="text-xs font-black" style={{ color: "hsl(270,50%,60%)" }}>Manage →</Link>
            </div>
            {loadingFriends ? (
              <div className="space-y-2">
                {[1,2].map(i => <Skeleton key={i} className="h-14 rounded-full bg-muted/40" />)}
              </div>
            ) : friends && friends.length > 0 ? (
              <div className="space-y-2">
                {friends.slice(0, 4).map((f, i) => (
                  <Link key={f.id} href={`/profile/${f.user.id}`}>
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer hover:scale-[1.01] transition-transform"
                      style={{ background: BOND_PILLS[(i + 2) % BOND_PILLS.length] }}
                      data-testid={`friend-item-${f.id}`}
                    >
                      <Avatar className="w-8 h-8 border-2 border-white shadow-sm shrink-0">
                        <AvatarImage src={f.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs font-black" style={{ background: "white", color: "hsl(270,45%,50%)" }}>
                          {f.user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate" style={{ color: "hsl(270,35%,28%)" }}>{f.user.displayName}</p>
                      </div>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 capitalize"
                        style={{ background: "rgba(130,80,200,0.13)", color: "hsl(270,45%,48%)" }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-center py-4" style={{ color: "hsl(270,25%,60%)" }}>
                No friends yet — go make some!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
