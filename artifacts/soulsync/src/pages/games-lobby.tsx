import React from "react";
import { Link } from "wouter";
import { useListMinigames } from "@workspace/api-client-react";
import { Gamepad2, Clock, Users, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function GamesLobby() {
  const { data: games, isLoading } = useListMinigames();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Mini-Games
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Play together, bond faster.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" /> Win to earn XP
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games?.map((game) => (
            <div 
              key={game.id}
              className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 flex flex-col relative overflow-hidden group"
            >
              {/* Decorative background shape based on game type */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40
                ${game.type === 'typing_chemistry' ? 'bg-primary' : 
                  game.type === 'delulu_detector' ? 'bg-destructive' : 
                  game.type === 'emoji_panic' ? 'bg-accent-foreground' : 'bg-secondary'}`} 
              />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-2xl font-bold text-foreground">{game.name}</h3>
                <span className="bg-secondary/20 text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  +{game.xpReward} XP
                </span>
              </div>

              <p className="text-muted-foreground mb-6 relative z-10 flex-1">{game.description}</p>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-1.5 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-xl">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  {game.playerCount} Players
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {game.duration}s
                </div>
              </div>

              <Button 
                className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold h-12 text-lg shadow-sm hover:opacity-90 relative z-10"
                asChild
                disabled={!game.isAvailable}
              >
                <Link href={`/games/${game.type}`}>
                  {game.isAvailable ? "Play Now" : "Coming Soon"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
