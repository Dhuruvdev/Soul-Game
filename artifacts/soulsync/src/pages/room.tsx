import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetRoom, useJoinRoom, getGetRoomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Heart, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Room() {
  const [, params] = useRoute("/rooms/:roomId");
  const roomId = params?.roomId ? parseInt(params.roomId) : 0;
  const queryClient = useQueryClient();
  const joinRoom = useJoinRoom();

  const { data: room, isLoading, error } = useGetRoom(roomId, {
    query: { enabled: !!roomId }
  });

  const [reactions, setReactions] = useState<{id: number, emoji: string, x: number}[]>([]);

  useEffect(() => {
    if (roomId && !isLoading && room) {
      joinRoom.mutate(
        { roomId },
        {
          onError: () => {
            // Might already be in room or full, ignore for UI sake
          }
        }
      );
    }
  }, [roomId, isLoading]);

  const sendReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now(),
      emoji,
      x: Math.random() * 80 + 10 // 10% to 90% across screen
    };
    setReactions(prev => [...prev, newReaction]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2000);
  };

  if (isLoading) {
    return <div className="h-[80vh] flex items-center justify-center">Loading room...</div>;
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Room not found</h2>
        <Button variant="outline" className="mt-6 rounded-xl" asChild>
          <Link href="/rooms">Back to Lobby</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-700 relative overflow-hidden">
      {/* Floating Reactions */}
      <AnimatePresence>
        {reactions.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 100, scale: 0.5, x: `${r.x}vw` }}
            animate={{ opacity: [0, 1, 0], y: -200, scale: 1.5, x: `${r.x}vw` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute bottom-20 text-4xl pointer-events-none z-50"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10">
        <Button variant="ghost" className="rounded-xl bg-white/50 backdrop-blur-md shadow-sm hover:bg-white" asChild>
          <Link href="/rooms">
            <ArrowLeft className="w-4 h-4 mr-2" /> Leave
          </Link>
        </Button>
        
        <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-2xl shadow-sm border border-white/50 text-center">
          <h2 className="font-bold text-lg">{room.name}</h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> {room.ambience}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/50 flex items-center gap-2 font-bold">
          <Users className="w-4 h-4 text-primary" />
          {room.occupants?.length || room.occupantCount}/{room.maxOccupants}
        </div>
      </div>

      {/* Room Content (Avatars) */}
      <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/50 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-center p-8 gap-8">
        
        {room.occupants?.map((user, i) => (
          <motion.div 
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center group relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            >
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-50 blur-md transition-opacity"></div>
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg relative z-10 cursor-pointer">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl">{user.displayName.substring(0, 2)}</AvatarFallback>
                </Avatar>
              </div>
            </motion.div>
            <div className="mt-3 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity">
              {user.displayName}
            </div>
            {user.mood && (
              <div className="absolute -top-4 -right-4 bg-white px-2 py-1 rounded-xl shadow-sm text-xs border border-muted z-20">
                {user.mood}
              </div>
            )}
          </motion.div>
        ))}

      </div>

      {/* Reaction Bar */}
      <div className="mt-6 flex justify-center gap-4 z-10">
        {['💖', '✨', '💀', '😭', '🔥', '☕'].map(emoji => (
          <Button 
            key={emoji}
            variant="outline" 
            size="icon"
            className="w-14 h-14 rounded-2xl text-2xl bg-white/80 backdrop-blur-md shadow-sm border-white/50 hover:bg-white hover:scale-110 transition-all"
            onClick={() => sendReaction(emoji)}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  );
}
