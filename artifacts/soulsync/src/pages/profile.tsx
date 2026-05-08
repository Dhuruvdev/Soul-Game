import React from "react";
import { Link, useRoute } from "wouter";
import { Heart, Activity, Trophy, Gamepad2, Users, ArrowRight, Zap, Sparkles, Plus, Send, Copy } from "lucide-react";
import { useGetMyProfile, useGetMyFriends, useGetMyBonds, UserProfile } from "@workspace/api-client-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function MyProfile() {
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfile();
  const { data: friends, isLoading: isFriendsLoading } = useGetMyFriends();
  const { data: bonds, isLoading: isBondsLoading } = useGetMyBonds();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile?.id}`);
    toast.success("Profile link copied to clipboard!");
  };

  if (isProfileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="h-[600px] w-full bg-white/50 rounded-[2rem]"></div>
      </div>
    );
  }

  if (!profile) return <div>Failed to load profile</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Your Aesthetics
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">This is how the world sees your soul.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" /> Share Profile
          </Button>
          <Button className="rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <ProfileCard profile={profile} />
        </div>

        <div className="md:col-span-7">
          <Tabs defaultValue="bonds" className="w-full">
            <TabsList className="w-full bg-white/50 backdrop-blur-md rounded-2xl p-1 border border-white/50">
              <TabsTrigger value="bonds" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Top Bonds</TabsTrigger>
              <TabsTrigger value="titles" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Titles</TabsTrigger>
              <TabsTrigger value="friends" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Friends List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bonds" className="mt-4 space-y-4">
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 min-h-[400px]">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-destructive fill-destructive/20" /> 
                  Soul Ties
                </h3>
                
                {isBondsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : bonds && bonds.length > 0 ? (
                  <div className="space-y-3">
                    {bonds.map(bond => (
                      <Link key={bond.id} href={`/profile/${bond.user.id}`}>
                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 hover:bg-white border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                          <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                            <AvatarImage src={bond.user.avatarUrl || undefined} />
                            <AvatarFallback>{bond.user.displayName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-bold text-foreground truncate">{bond.user.displayName}</h4>
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Lvl {bond.level}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{bond.title || "Growing Bond"}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-xs font-bold text-accent-foreground">
                              <Zap className="w-3 h-3 fill-accent-foreground" /> {bond.streak}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-muted/20 rounded-2xl border border-dashed border-border">
                    <Users className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                    <p className="font-bold text-foreground">No soul ties yet</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Start interacting with friends to build bonds.</p>
                    <Button variant="outline" className="rounded-xl border-primary/20" asChild>
                      <Link href="/friends">Find Friends</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="titles" className="mt-4">
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 min-h-[400px]">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary-foreground" /> 
                  Unlocked Titles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
                    <span className="text-sm font-medium text-muted-foreground mb-1">Equipped</span>
                    <span className="font-bold text-lg text-primary">{profile.title || "The Newcomer"}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col justify-center items-center text-center opacity-70">
                    <span className="text-sm font-medium text-muted-foreground mb-1">Locked</span>
                    <span className="font-bold text-lg text-foreground">Night Owl</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col justify-center items-center text-center opacity-70">
                    <span className="text-sm font-medium text-muted-foreground mb-1">Locked</span>
                    <span className="font-bold text-lg text-foreground">Chaos Coordinator</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="friends" className="mt-4">
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-foreground" /> 
                    Friends
                  </h3>
                  <Button size="sm" variant="ghost" className="rounded-xl text-primary font-bold" asChild>
                    <Link href="/friends">Manage</Link>
                  </Button>
                </div>
                
                {isFriendsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                  </div>
                ) : friends && friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.map(friendEntry => (
                      <Link key={friendEntry.id} href={`/profile/${friendEntry.user.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-2xl bg-muted/30 hover:bg-white border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                          <Avatar className="w-10 h-10 border border-white">
                            <AvatarImage src={friendEntry.user.avatarUrl || undefined} />
                            <AvatarFallback>{friendEntry.user.displayName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{friendEntry.user.displayName}</h4>
                            <p className="text-xs text-muted-foreground truncate">Lvl {friendEntry.user.level}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">Your friends list is empty.</p>
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
