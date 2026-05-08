import React from "react";
import { Link } from "wouter";
import { useListRooms, useJoinRoom } from "@workspace/api-client-react";
import { Users, DoorOpen, Coffee, BookOpen, HeartCrack, Gamepad2, Mic2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoomsLobby() {
  const { data: rooms, isLoading } = useListRooms();

  const getThemeIcon = (theme: string) => {
    switch(theme) {
      case 'sleepover': return <Coffee className="w-6 h-6 text-primary" />;
      case 'study': return <BookOpen className="w-6 h-6 text-accent-foreground" />;
      case 'heartbreak': return <HeartCrack className="w-6 h-6 text-destructive" />;
      case 'arcade': return <Gamepad2 className="w-6 h-6 text-secondary-foreground" />;
      case 'gossip': return <Mic2 className="w-6 h-6 text-primary" />;
      case 'chaotic_vc': return <Zap className="w-6 h-6 text-accent-foreground" />;
      default: return <Coffee className="w-6 h-6 text-primary" />;
    }
  };

  const getThemeColor = (theme: string) => {
    switch(theme) {
      case 'sleepover': return 'from-primary/20 to-primary/5 border-primary/20';
      case 'study': return 'from-accent/20 to-accent/5 border-accent/20';
      case 'heartbreak': return 'from-destructive/20 to-destructive/5 border-destructive/20';
      case 'arcade': return 'from-secondary/20 to-secondary/5 border-secondary/20';
      case 'gossip': return 'from-primary/20 to-secondary/20 border-primary/20';
      case 'chaotic_vc': return 'from-accent/20 to-destructive/20 border-accent/20';
      default: return 'from-muted to-muted/50 border-border';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Rooms Lobby
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Find your vibe and jump in.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms?.map((room) => (
            <div 
              key={room.id}
              className={`bg-gradient-to-br ${getThemeColor(room.theme)} rounded-[2rem] p-6 border shadow-sm flex flex-col relative overflow-hidden group`}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 rounded-full blur-2xl group-hover:bg-white/60 transition-all"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm">
                  {getThemeIcon(room.theme)}
                </div>
                <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  <Users className="w-3 h-3" />
                  {room.occupantCount}/{room.maxOccupants}
                </div>
              </div>

              <div className="mb-6 relative z-10 flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">{room.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>
              </div>

              <div className="relative z-10">
                <Button 
                  className="w-full rounded-xl shadow-sm bg-white/80 hover:bg-white text-foreground font-bold"
                  asChild
                >
                  <Link href={`/rooms/${room.id}`}>
                    <DoorOpen className="w-4 h-4 mr-2" /> Join Room
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
