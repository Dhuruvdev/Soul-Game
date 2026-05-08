import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfile() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId ? parseInt(params.userId) : 0;
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading, error } = useGetUserProfile(userId, {
    query: { enabled: !!userId }
  });
  
  const { data: bond, isLoading: isBondLoading } = useGetBond(userId, {
    query: { enabled: !!userId }
  });

  const sendHeart = useSendHeart();
  const addFriend = useAddFriend();

  const handleSendHeart = () => {
    sendHeart.mutate(
      { data: { targetUserId: userId } },
      {
        onSuccess: () => {
          toast.success(`Sent a heart to ${profile?.displayName}! 💖`);
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
          queryClient.invalidateQueries({ queryKey: getGetBondQueryKey(userId) });
        },
        onError: () => {
          toast.error("Failed to send heart. They might be too popular right now.");
        }
      }
    );
  };

  const handleAddFriend = () => {
    addFriend.mutate(
      { data: { targetUserId: userId } },
      {
        onSuccess: () => {
          toast.success(`Friend request sent to ${profile?.displayName}! 💌`);
        },
        onError: () => {
          toast.error("Couldn't send friend request.");
        }
      }
    );
  };

  if (isProfileLoading) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-pulse mt-8">
        <div className="h-10 w-32 bg-white/50 rounded-xl"></div>
        <div className="h-[600px] w-full bg-white/50 rounded-[2rem]"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">User not found</h2>
        <p className="text-muted-foreground mt-2">They might have changed their username or deleted their account.</p>
        <Button variant="outline" className="mt-6 rounded-xl" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4 pb-12">
      <Button variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground" asChild>
        <Link href="/friends">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
      </Button>

      <ProfileCard profile={profile} />

      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm space-y-3">
        {bond && (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Bond Level {bond.level}</p>
                <p className="text-xs text-muted-foreground">{bond.title || "Growing Bond"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-primary">{bond.xp} XP</p>
              <p className="text-[10px] text-muted-foreground">{bond.streak} day streak</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
            onClick={handleSendHeart}
            disabled={sendHeart.isPending}
            data-testid="button-send-heart"
          >
            <Heart className="w-4 h-4 mr-2 fill-current" /> Send Heart
          </Button>
          <Button 
            className="w-full rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm"
            onClick={handleAddFriend}
            disabled={addFriend.isPending}
            data-testid="button-add-friend"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Friend
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold shadow-sm mt-2"
          asChild
          data-testid="button-check-compatibility"
        >
          <Link href={`/compatibility/${profile.id}`}>
            Check Compatibility 🔮
          </Link>
        </Button>
      </div>
    </div>
  );
}
