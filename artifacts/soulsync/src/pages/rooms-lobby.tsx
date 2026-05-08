import { Link } from "wouter";
import { useListRooms } from "@workspace/api-client-react";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const THEME_CONFIG: Record<string, { emoji: string; pill: string; label: string }> = {
  sleepover:  { emoji: "🛌", pill: "hsl(270,55%,87%)", label: "lo-fi & cozy" },
  study:      { emoji: "📚", pill: "hsl(200,70%,87%)", label: "ambient focus" },
  heartbreak: { emoji: "💔", pill: "hsl(345,60%,87%)", label: "sad indie vibes" },
  arcade:     { emoji: "🕹️", pill: "hsl(140,55%,85%)", label: "energetic" },
  gossip:     { emoji: "☕", pill: "hsl(25,70%,87%)",  label: "mystery whispers" },
  chaotic_vc: { emoji: "🌪️", pill: "hsl(50,70%,87%)",  label: "LOUD & chaotic" },
};

export default function RoomsLobby() {
  const { data: rooms, isLoading } = useListRooms();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="text-3xl md:text-4xl font-black font-display" style={{ color: "hsl(270,45%,40%)" }}>
          Rooms Lobby
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: "hsl(270,25%,58%)" }}>
          Find your vibe and jump in.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-20 rounded-full bg-white/70" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {rooms?.map((room, i) => {
            const cfg = THEME_CONFIG[room.theme] ?? { emoji: "🏠", pill: "hsl(270,55%,87%)", label: "" };
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Link href={`/rooms/${room.id}`}>
                  <div
                    className="flex items-center justify-between px-6 py-4 rounded-full cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    data-testid={`room-card-${room.id}`}
                    style={{ background: cfg.pill, boxShadow: "0 2px 8px rgba(130,80,200,0.08)" }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <div>
                        <p className="font-black text-base" style={{ color: "hsl(270,35%,30%)" }}>{room.name}</p>
                        <p className="text-xs font-semibold" style={{ color: "hsl(270,25%,52%)" }}>{cfg.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" style={{ color: "hsl(270,35%,52%)" }} />
                        <span className="text-sm font-black" style={{ color: "hsl(270,35%,40%)" }}>
                          {room.occupantCount}/{room.maxOccupants}
                        </span>
                      </div>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ background: "rgba(130,80,200,0.14)", color: "hsl(270,45%,48%)" }}
                      >
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
