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
import { Search, Heart, UserPlus, Send, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const FRIEND_PILLS = [
  "hsl(270,55%,87%)", "hsl(200,70%,87%)", "hsl(140,55%,85%)",
  "hsl(25,70%,87%)",  "hsl(335,65%,87%)", "hsl(50,70%,87%)",
];

export default function Friends() {
  const [tab, setTab] = useState<"friends" | "search">("friends");
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

  const [complimentTarget, setComplimentTarget] = useState<{ id: number; name: string } | null>(null);
  const [complimentMsg, setComplimentMsg] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddFriend = (userId: number) => {
    addFriend.mutate(
      { data: { targetUserId: userId } },
      {
        onSuccess: () => {
          toast.success("Friend request sent!");
          void queryClient.invalidateQueries({ queryKey: getGetMyFriendsQueryKey() });
        },
        onError: () => toast.error("Failed to send request."),
      }
    );
  };

  const handleSendCompliment = () => {
    if (!complimentTarget || !complimentMsg.trim()) return;
    sendCompliment.mutate(
      { data: { targetUserId: complimentTarget.id, message: complimentMsg } },
      {
        onSuccess: () => {
          toast.success("Compliment sent anonymously! 💌");
          setIsDrawerOpen(false);
          setComplimentMsg("");
          setComplimentTarget(null);
        },
        onError: () => toast.error("Failed to send compliment."),
      }
    );
  };

  const openComplimentDrawer = (userId: number, name: string) => {
    setComplimentTarget({ id: userId, name });
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="text-3xl md:text-4xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
          Your People
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
          Bonds make the soul grow stronger.
        </p>
      </motion.div>

      {/* Tab switcher pills */}
      <div className="flex gap-3">
        {(["friends", "search"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-6 py-2.5 rounded-full font-black text-sm cursor-pointer transition-all"
            style={{
              background: tab === t ? "hsl(270,55%,87%)" : "hsl(0,0%,100%)",
              color: "hsl(270,40%,38%)",
              boxShadow: tab === t ? "0 2px 8px rgba(130,80,200,0.15)" : "0 1px 4px rgba(130,80,200,0.08)",
            }}
          >
            {t === "friends" ? "My Friends" : "Find People"}
          </button>
        ))}
      </div>

      {tab === "friends" && (
        <motion.div
          key="friends"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            {isFriendsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-full bg-muted/40" />)}
              </div>
            ) : friends && friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 px-5 py-3 rounded-full"
                    style={{ background: FRIEND_PILLS[i % FRIEND_PILLS.length] }}
                    data-testid={`friend-entry-${f.id}`}
                  >
                    <Link href={`/profile/${f.user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                        <AvatarImage src={f.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs font-black" style={{ background: "white", color: "hsl(270,45%,50%)" }}>
                          {f.user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-black text-sm truncate" style={{ color: "hsl(270,35%,28%)" }}>{f.user.displayName}</p>
                        <p className="text-xs font-semibold" style={{ color: "hsl(270,25%,55%)" }}>Lvl {f.user.level} • {f.bondXp} XP</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => openComplimentDrawer(f.user.id, f.user.displayName)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black cursor-pointer hover:scale-105 transition-transform shrink-0"
                      style={{ background: "rgba(130,80,200,0.14)", color: "hsl(270,45%,48%)" }}
                    >
                      <Heart className="w-3.5 h-3.5" /> Compliment
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-12 rounded-[1.25rem]"
                style={{ background: "hsl(270,35%,96%)" }}
              >
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "hsl(270,40%,55%)" }} />
                <p className="font-bold text-sm" style={{ color: "hsl(270,25%,55%)" }}>No friends yet — go find some!</p>
                <button
                  onClick={() => setTab("search")}
                  className="mt-2 text-xs font-black"
                  style={{ color: "hsl(270,50%,60%)" }}
                >
                  Search people →
                </button>
              </div>
            )}
          </div>

          {/* Anon compliment nudge pill */}
          <div
            className="mt-4 flex items-center justify-between px-6 py-4 rounded-full"
            style={{ background: "hsl(335,65%,87%)" }}
          >
            <div>
              <p className="font-black text-sm" style={{ color: "hsl(270,35%,30%)" }}>Anonymous Compliments</p>
              <p className="text-xs font-semibold" style={{ color: "hsl(270,25%,52%)" }}>Make someone's day — they won't know it's you</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(130,80,200,0.14)" }}>
              <Heart className="w-4 h-4" style={{ color: "hsl(270,45%,50%)" }} />
            </div>
          </div>
        </motion.div>
      )}

      {tab === "search" && (
        <motion.div
          key="search"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="bg-white rounded-[1.75rem] p-6" style={{ boxShadow: "0 4px 20px rgba(130,80,200,0.10)" }}>
            {/* Search bar styled as a pill */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(270,30%,60%)" }} />
              <Input
                placeholder="Search by username or vibe..."
                className="pl-10 rounded-full border-0 font-semibold h-12 text-sm"
                style={{ background: "hsl(270,55%,94%)", color: "hsl(270,35%,32%)" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isSearchLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-full bg-muted/40" />)}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((user, i) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 px-5 py-3 rounded-full"
                    style={{ background: FRIEND_PILLS[(i + 3) % FRIEND_PILLS.length] }}
                    data-testid={`search-result-${user.id}`}
                  >
                    <Avatar className="w-9 h-9 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs font-black" style={{ background: "white", color: "hsl(270,45%,50%)" }}>
                        {user.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${user.id}`} className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate" style={{ color: "hsl(270,35%,28%)" }}>{user.displayName}</p>
                      <p className="text-xs font-semibold" style={{ color: "hsl(270,25%,55%)" }}>@{user.username}</p>
                    </Link>
                    <button
                      onClick={() => handleAddFriend(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black cursor-pointer hover:scale-105 transition-transform shrink-0"
                      style={{ background: "rgba(130,80,200,0.14)", color: "hsl(270,45%,48%)" }}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                ))}
              </div>
            ) : debouncedSearch.length > 0 ? (
              <div className="text-center py-10">
                <p className="font-semibold text-sm" style={{ color: "hsl(270,25%,60%)" }}>No souls found matching "{debouncedSearch}"</p>
              </div>
            ) : (
              <div className="text-center py-10">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "hsl(270,45%,60%)" }} />
                <p className="font-semibold text-sm" style={{ color: "hsl(270,25%,60%)" }}>Type something to find new friends.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Compliment drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-white border-t border-border/30 rounded-t-[2rem]">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle className="text-2xl font-black font-display text-center" style={{ color: "hsl(270,45%,40%)" }}>
                To {complimentTarget?.name} 💌
              </DrawerTitle>
              <DrawerDescription className="text-center text-sm font-semibold" style={{ color: "hsl(270,25%,60%)" }}>
                They won't know it's from you. Keep it sweet!
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <Textarea
                placeholder="You always have the best energy..."
                className="rounded-3xl border-0 resize-none h-32 text-sm font-medium p-4"
                style={{ background: "hsl(270,55%,94%)", color: "hsl(270,35%,32%)" }}
                value={complimentMsg}
                onChange={(e) => setComplimentMsg(e.target.value)}
              />
            </div>
            <DrawerFooter className="gap-2.5">
              <button
                onClick={handleSendCompliment}
                disabled={!complimentMsg.trim() || sendCompliment.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-sm cursor-pointer disabled:opacity-60"
                style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,40%)" }}
              >
                <Send className="w-4 h-4" /> Send Anonymously
              </button>
              <DrawerClose asChild>
                <button
                  className="w-full py-3 rounded-full font-black text-sm cursor-pointer"
                  style={{ background: "hsl(270,20%,94%)", color: "hsl(270,25%,55%)" }}
                >
                  Cancel
                </button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
