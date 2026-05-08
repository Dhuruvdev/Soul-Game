import { useRoute, Link } from "wouter";
import {
  useGetUserProfile,
  useGetBond,
  useSendHeart,
  useAddFriend,
  getGetUserProfileQueryKey,
  getGetBondQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Heart, UserPlus, Sparkles, AlertTriangle, ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function UserProfile() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId ? parseInt(params.userId) : 0;
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useGetUserProfile(userId, {
    query: { enabled: !!userId }
  });
  const { data: bond } = useGetBond(userId, {
    query: { enabled: !!userId }
  });

  const sendHeart = useSendHeart();
  const addFriend = useAddFriend();

  const handleSendHeart = () => {
    sendHeart.mutate(
      { data: { targetUserId: userId } },
      {
        onSuccess: () => {
          toast.success(`Heart sent to ${profile?.displayName}! 💖`);
          void queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
          void queryClient.invalidateQueries({ queryKey: getGetBondQueryKey(userId) });
        },
        onError: () => toast.error("Failed to send heart."),
      }
    );
  };

  const handleAddFriend = () => {
    addFriend.mutate(
      { data: { targetUserId: userId } },
      {
        onSuccess: () => toast.success(`Friend request sent! 💌`),
        onError: () => toast.error("Couldn't send friend request."),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto space-y-4 mt-8 animate-pulse">
        <Skeleton className="h-10 w-28 rounded-full bg-white/60" />
        <Skeleton className="h-[560px] w-full rounded-[1.75rem] bg-white/60" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <AlertTriangle className="w-10 h-10" style={{ color: "hsl(345,60%,58%)" }} />
        <h2 className="text-xl font-black font-display" style={{ color: "hsl(270,40%,38%)" }}>User not found</h2>
        <Link href="/">
          <div className="px-6 py-2.5 rounded-full font-black text-sm cursor-pointer" style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}>
            Go Home
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-5 mt-4 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/friends">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm cursor-pointer"
            style={{ background: "hsl(0,0%,100%)", color: "hsl(270,40%,45%)", boxShadow: "0 2px 8px rgba(130,80,200,0.10)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        <ProfileCard profile={profile} />
      </motion.div>

      {/* Bond indicator */}
      {bond && (
        <motion.div
          className="flex items-center justify-between px-5 py-3.5 rounded-full"
          style={{ background: "hsl(270,55%,87%)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "hsl(270,45%,50%)" }} />
            <span className="font-black text-sm" style={{ color: "hsl(270,35%,30%)" }}>
              Bond Level {bond.level}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold" style={{ color: "hsl(270,35%,50%)" }}>{bond.xp} XP</span>
            <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "hsl(270,45%,48%)" }}>
              <Zap className="w-3 h-3" /> {bond.streak}d
            </span>
          </div>
        </motion.div>
      )}

      {/* Action pills */}
      <motion.div
        className="space-y-2.5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleSendHeart}
            disabled={sendHeart.isPending}
            className="flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-sm cursor-pointer hover:scale-[1.02] transition-transform disabled:opacity-60"
            style={{ background: "hsl(335,65%,87%)", color: "hsl(270,35%,30%)" }}
            data-testid="button-send-heart"
          >
            <Heart className="w-4 h-4 fill-current" style={{ color: "hsl(345,60%,55%)" }} /> Send Heart
          </button>
          <button
            onClick={handleAddFriend}
            disabled={addFriend.isPending}
            className="flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-sm cursor-pointer hover:scale-[1.02] transition-transform disabled:opacity-60"
            style={{ background: "hsl(200,70%,87%)", color: "hsl(270,35%,30%)" }}
            data-testid="button-add-friend"
          >
            <UserPlus className="w-4 h-4" /> Add Friend
          </button>
        </div>

        <Link href={`/compatibility/${profile.id}`} data-testid="button-check-compatibility">
          <div
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-sm cursor-pointer hover:scale-[1.01] transition-transform"
            style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,40%)" }}
          >
            🔮 Check Compatibility
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
