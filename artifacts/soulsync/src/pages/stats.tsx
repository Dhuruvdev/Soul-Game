import React from "react";
import { useGetProfileStats } from "@workspace/api-client-react";
import { Sparkles, Heart, Gamepad2, Zap, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Stats() {
  const { data: stats, isLoading } = useGetProfileStats();

  const handleShare = () => {
    toast.success("Wrapped card copied to clipboard! Ready to post on Discord.");
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto h-[800px] bg-white/50 rounded-[3rem] animate-pulse mt-8"></div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-md mx-auto pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Your SoulSync Wrapped</h1>
        <p className="text-muted-foreground mt-2">Your social aesthetic, quantified.</p>
      </div>

      {/* The Wrapped Card */}
      <motion.div 
        className="bg-gradient-to-br from-primary via-secondary to-accent p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-white"
        initial={{ rotate: -2, scale: 0.95 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="relative z-10 flex flex-col h-full space-y-8">
          <div className="flex justify-between items-center">
            <span className="font-bold text-xl tracking-tight">SoulSync</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">Vibe Check</span>
          </div>

          <div className="text-center space-y-2">
            <img src={stats.user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${stats.user.username}`} alt="Avatar" className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 shadow-lg object-cover bg-white" />
            <h2 className="text-3xl font-black mt-4">{stats.user.displayName}</h2>
            <p className="text-white/80 font-medium">Lvl {stats.user.level} • {stats.user.title || "Main Character"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <Heart className="w-5 h-5 mb-2 text-white" />
              <p className="text-3xl font-black">{stats.totalHearts}</p>
              <p className="text-xs uppercase tracking-wider font-bold text-white/70">Hearts Got</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <Zap className="w-5 h-5 mb-2 text-white" />
              <p className="text-3xl font-black">{stats.longestStreak}</p>
              <p className="text-xs uppercase tracking-wider font-bold text-white/70">Max Streak</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <Gamepad2 className="w-5 h-5 mb-2 text-white" />
              <p className="text-3xl font-black">{stats.gamesWon}</p>
              <p className="text-xs uppercase tracking-wider font-bold text-white/70">Games Won</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <Sparkles className="w-5 h-5 mb-2 text-white" />
              <p className="text-3xl font-black">{stats.chaosLevel}%</p>
              <p className="text-xs uppercase tracking-wider font-bold text-white/70">Chaos Lvl</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-sm font-medium text-white/80">Favorite Room</span>
              <span className="font-bold">{stats.favoriteRoom || "Sleepover"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-sm font-medium text-white/80">Top Bond</span>
              <span className="font-bold">{stats.topBond?.user.displayName || "Lone Wolf"}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-sm font-medium text-white/80">Top Emojis</span>
              <span className="font-bold tracking-widest">{stats.topEmojis.join(" ")}</span>
            </div>
          </div>
          
          {stats.toxicDuoTitle && (
            <div className="text-center pt-2">
              <p className="text-xs font-medium text-white/70 uppercase tracking-widest mb-1">Duo Title</p>
              <p className="font-black text-xl italic">"{stats.toxicDuoTitle}"</p>
            </div>
          )}
        </div>
      </motion.div>

      <Button 
        className="w-full mt-8 rounded-xl h-14 text-lg font-bold shadow-md bg-foreground text-background hover:bg-foreground/90"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5 mr-2" /> Share to Discord
      </Button>
    </div>
  );
}
