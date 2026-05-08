import React, { useState } from "react";
import { Link } from "wouter";
import { 
  useGetMyFriends, 
  useListUsers, 
  useAddFriend, 
  useSendCompliment,
  getGetMyFriendsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Search, Heart, UserPlus, Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerTrigger } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Hook needed since it wasn't provided in the prompt but is common
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


export default function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounceValue(searchQuery, 500);
  
  const { data: friends, isLoading: isFriendsLoading } = useGetMyFriends();
  const { data: searchResults, isLoading: isSearchLoading } = useListUsers(
    { search: debouncedSearch },
    { query: { enabled: debouncedSearch.length > 0 } }
  );

  const queryClient = useQueryClient();
  const addFriend = useAddFriend();
  const sendCompliment = useSendCompliment();

  const [complimentTarget, setComplimentTarget] = useState<{id: number, name: string} | null>(null);
  const [complimentMsg, setComplimentMsg] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddFriend = (userId: number) => {
    addFriend.mutate(
      { data: { targetUserId: userId } },
      {
        onSuccess: () => {
          toast.success("Friend request sent!");
        },
        onError: () => {
          toast.error("Failed to send request.");
        }
      }
    );
  };

  const handleSendCompliment = () => {
    if (!complimentTarget || !complimentMsg.trim()) return;
    
    sendCompliment.mutate(
      { data: { targetUserId: complimentTarget.id, message: complimentMsg } },
      {
        onSuccess: () => {
          toast.success("Anonymous compliment sent! 💌");
          setIsDrawerOpen(false);
          setComplimentMsg("");
          setComplimentTarget(null);
        },
        onError: () => {
          toast.error("Failed to send compliment.");
        }
      }
    );
  };

  const openComplimentDrawer = (userId: number, name: string) => {
    setComplimentTarget({ id: userId, name });
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Your People
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Bonds make the soul grow stronger.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="w-full bg-white/50 backdrop-blur-md rounded-2xl p-1 border border-white/50">
              <TabsTrigger value="friends" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">My Friends</TabsTrigger>
              <TabsTrigger value="search" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Find People</TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends" className="mt-4 space-y-4">
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 min-h-[400px]">
                {isFriendsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : friends && friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.map(friendEntry => (
                      <div key={friendEntry.id} className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl bg-muted/30 hover:bg-white border border-transparent hover:border-primary/20 transition-all shadow-sm">
                        <Link href={`/profile/${friendEntry.user.id}`} className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                          <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                            <AvatarImage src={friendEntry.user.avatarUrl || undefined} />
                            <AvatarFallback>{friendEntry.user.displayName.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground truncate text-lg">{friendEntry.user.displayName}</h4>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Lvl {friendEntry.user.level} • {friendEntry.bondXp} XP
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl border-secondary/30 text-secondary-foreground hover:bg-secondary/10"
                            onClick={() => openComplimentDrawer(friendEntry.user.id, friendEntry.user.displayName)}
                          >
                            <Heart className="w-4 h-4 mr-2" /> Compliment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-muted/20 rounded-2xl border border-dashed border-border">
                    <Users className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                    <p className="font-bold text-foreground text-lg">It's a bit lonely here.</p>
                    <p className="text-sm text-muted-foreground mt-1">Search for friends and start building bonds.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-4">
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 min-h-[400px]">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input 
                    placeholder="Search by username or vibe..." 
                    className="pl-10 rounded-xl bg-white border-primary/20 h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isSearchLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map(user => (
                      <div key={user.id} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-transparent shadow-sm">
                        <Avatar className="w-12 h-12 border border-white shadow-sm">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>{user.displayName.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${user.id}`}>
                            <h4 className="font-bold text-foreground truncate hover:text-primary transition-colors">{user.displayName}</h4>
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20 shadow-none"
                          onClick={() => handleAddFriend(user.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : debouncedSearch.length > 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No souls found matching "{debouncedSearch}"</p>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                    <p className="text-muted-foreground">Type something to find new friends.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-[2rem] p-6 border border-white/50 shadow-sm text-center">
            <Heart className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Send Anonymous Compliments</h3>
            <p className="text-sm text-muted-foreground mb-4">Make someone's day. They won't know it was you, but they'll feel the love.</p>
          </div>
        </div>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white/95 backdrop-blur-xl border-t border-white/50 rounded-t-[2rem]">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle className="text-2xl text-center">Send to {complimentTarget?.name}</DrawerTitle>
              <DrawerDescription className="text-center">They won't know it's from you. Keep it sweet! 💌</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <Textarea 
                placeholder="You always have the best energy..." 
                className="rounded-xl border-primary/20 resize-none h-32 text-lg p-4 bg-primary/5"
                value={complimentMsg}
                onChange={(e) => setComplimentMsg(e.target.value)}
              />
            </div>
            <DrawerFooter className="mt-4">
              <Button 
                onClick={handleSendCompliment} 
                disabled={!complimentMsg.trim() || sendCompliment.isPending}
                className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white h-12 text-lg"
              >
                <Send className="w-5 h-5 mr-2" /> Send Anonymously
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="rounded-xl h-12">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
