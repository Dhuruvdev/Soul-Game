import React, { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetRoom, useJoinRoom, getGetRoomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Sparkles, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const REACTION_EMOJIS = ["💖", "✨", "💀", "😭", "🔥", "☕"];
const ROOM_PILL_COLORS = [
  "hsl(270,55%,87%)", "hsl(200,70%,87%)", "hsl(140,55%,85%)",
  "hsl(25,70%,87%)",  "hsl(335,65%,87%)", "hsl(50,70%,87%)",
];

export default function Room() {
  const [, params] = useRoute("/rooms/:roomId");
  const roomId = params?.roomId ? parseInt(params.roomId) : 0;
  const queryClient = useQueryClient();
  const joinRoom = useJoinRoom();

  const { data: room, isLoading, error } = useGetRoom(roomId, {
    query: { enabled: !!roomId }
  });

  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

  useEffect(() => {
    if (roomId && !isLoading && room) {
      joinRoom.mutate({ roomId });
    }
  }, [roomId, isLoading]);

  const sendReaction = (emoji: string) => {
    const r = { id: Date.now(), emoji, x: Math.random() * 80 + 10 };
    setReactions(prev => [...prev, r]);
    setTimeout(() => setReactions(prev => prev.filter(x => x.id !== r.id)), 2200);
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <p className="text-xl font-black font-display" style={{ color: "hsl(270,45%,55%)" }}>Setting up the room... ✨</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <AlertTriangle className="w-10 h-10" style={{ color: "hsl(345,60%,58%)" }} />
        <h2 className="text-xl font-black font-display" style={{ color: "hsl(270,40%,38%)" }}>Room not found</h2>
        <Link href="/rooms">
          <div className="px-6 py-2.5 rounded-full font-black text-sm cursor-pointer" style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}>
            Back to Lobby
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col relative overflow-hidden">
      {/* Floating Reactions */}
      <AnimatePresence>
        {reactions.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -220, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute bottom-28 text-3xl pointer-events-none z-50"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between mb-5 z-10">
        <Link href="/rooms">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm cursor-pointer"
            style={{ background: "hsl(0,0%,100%)", color: "hsl(270,40%,45%)", boxShadow: "0 2px 8px rgba(130,80,200,0.10)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Leave
          </div>
        </Link>

        <div
          className="px-6 py-2.5 rounded-full text-center"
          style={{ background: "hsl(0,0%,100%)", boxShadow: "0 2px 8px rgba(130,80,200,0.10)" }}
        >
          <h2 className="font-black text-sm" style={{ color: "hsl(270,40%,35%)" }}>{room.name}</h2>
          <p className="text-[10px] font-semibold flex items-center justify-center gap-1" style={{ color: "hsl(270,25%,60%)" }}>
            <Sparkles className="w-3 h-3" /> {room.ambience}
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-sm"
          style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
        >
          <Users className="w-4 h-4" />
          {room.occupants?.length ?? room.occupantCount}/{room.maxOccupants}
        </div>
      </div>

      {/* ── Occupant area ── */}
      <div
        className="flex-1 rounded-[1.75rem] relative overflow-hidden flex flex-wrap items-center justify-center p-8 gap-8"
        style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", boxShadow: "0 4px 24px rgba(130,80,200,0.10)" }}
      >
        {room.occupants?.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 18 }}
            className="flex flex-col items-center relative"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            >
              <Avatar
                className="w-24 h-24 border-4 border-white shadow-lg"
                style={{ boxShadow: `0 0 0 4px ${ROOM_PILL_COLORS[i % ROOM_PILL_COLORS.length]}, 0 8px 20px rgba(130,80,200,0.18)` }}
              >
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback
                  className="text-2xl font-black font-display"
                  style={{ background: ROOM_PILL_COLORS[i % ROOM_PILL_COLORS.length], color: "hsl(270,45%,45%)" }}
                >
                  {user.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div
              className="mt-3 px-4 py-1 rounded-full text-xs font-black"
              style={{ background: "hsl(0,0%,100%)", color: "hsl(270,40%,42%)", boxShadow: "0 2px 8px rgba(130,80,200,0.12)" }}
            >
              {user.displayName}
            </div>
            {user.mood && (
              <div
                className="absolute -top-3 -right-3 px-2 py-1 rounded-full text-[10px] font-bold z-20"
                style={{ background: "hsl(270,55%,87%)", color: "hsl(270,45%,45%)" }}
              >
                {user.mood}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Reaction bar ── */}
      <div className="mt-5 flex justify-center gap-3 z-10">
        {REACTION_EMOJIS.map((emoji, i) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => sendReaction(emoji)}
            className="w-12 h-12 rounded-full text-xl cursor-pointer flex items-center justify-center"
            style={{ background: ROOM_PILL_COLORS[i % ROOM_PILL_COLORS.length], boxShadow: "0 2px 8px rgba(130,80,200,0.12)" }}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
