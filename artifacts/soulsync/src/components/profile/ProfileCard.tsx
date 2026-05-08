import React from "react";
import { motion } from "framer-motion";
import { UserProfile } from "@workspace/api-client-react";
import { Heart, Activity, AlertTriangle, Zap, MapPin, Hash, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface ProfileCardProps {
  profile: UserProfile;
  isHoverable?: boolean;
}

export function ProfileCard({ profile, isHoverable = false }: ProfileCardProps) {
  const percentToNextLevel = Math.min(100, Math.max(0, (profile.xp / profile.xpToNext) * 100));

  return (
    <motion.div
      whileHover={isHoverable ? { scale: 1.02, y: -5 } : undefined}
      className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl border border-white/50 relative overflow-hidden"
    >
      {/* Top Section */}
      <div className="flex flex-col items-center text-center relative z-10">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-70 blur-md"
          />
          <Avatar className="w-28 h-28 border-4 border-white relative z-10 shadow-sm">
            <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {profile.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm z-20">
            <div className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Lvl {profile.level}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold mt-4 text-foreground">{profile.displayName}</h2>
        <p className="text-muted-foreground font-medium flex items-center gap-1">
          <Hash className="w-4 h-4" /> {profile.username}
        </p>

        {profile.title && (
          <Badge variant="outline" className="mt-2 bg-primary/5 text-primary border-primary/20">
            {profile.title}
          </Badge>
        )}
      </div>

      {/* Middle Section - XP & Mood */}
      <div className="mt-6 space-y-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>XP {profile.xp}</span>
            <span>Next {profile.xpToNext}</span>
          </div>
          <Progress value={percentToNextLevel} className="h-2.5 bg-primary/10" />
        </div>

        {profile.mood && (
          <div className="bg-accent/20 rounded-xl p-3 text-center text-sm font-medium text-accent-foreground border border-accent/20">
            💭 {profile.mood}
          </div>
        )}

        {profile.tags && profile.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-secondary/15 text-secondary-foreground text-xs font-medium border border-secondary/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lower Section - Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-primary/10">
          <Activity className="w-5 h-5 text-primary mb-1" />
          <span className="text-lg font-bold text-foreground">{profile.delulu}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Delulu Meter</span>
        </div>
        <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive mb-1" />
          <span className="text-lg font-bold text-foreground">{profile.redFlag}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Red Flag</span>
        </div>
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-accent/10">
          <Zap className="w-5 h-5 text-accent-foreground mb-1" />
          <span className="text-lg font-bold text-foreground">{profile.chronicallyOnline}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Chronically Online</span>
        </div>
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-secondary/10">
          <Sparkles className="w-5 h-5 text-secondary-foreground mb-1" />
          <span className="text-lg font-bold text-foreground">{profile.mainCharacterEnergy}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">MC Energy</span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm relative z-10">
        <div className="flex items-center gap-1.5 font-medium text-destructive">
          <Heart className="w-4 h-4 fill-destructive" />
          <span>{profile.totalHearts} received</span>
        </div>
        
        {profile.currentRoom && (
          <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-[100px]">{profile.currentRoom}</span>
          </div>
        )}
      </div>

      {/* Decorative blobs inside card */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
}
