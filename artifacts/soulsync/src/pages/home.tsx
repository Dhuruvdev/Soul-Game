import { useGetDashboard } from "@workspace/api-client-react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Activity, Trophy, Gamepad2, Users, ArrowRight, Zap, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: dashboard, isLoading, error } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-white/50 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 h-[600px] bg-white/50 rounded-[2rem]"></div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-32 bg-white/50 rounded-[2rem]"></div>
            <div className="h-64 bg-white/50 rounded-[2rem]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Oops, couldn't load your dashboard</h2>
        <p className="text-muted-foreground mt-2">Try refreshing the page or checking your connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{dashboard.profile.displayName}</span> ✨
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Ready to sync some souls today?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile */}
        <div className="lg:col-span-4 space-y-6">
          <ProfileCard profile={dashboard.profile} isHoverable />
          
          {/* Quick Stats Strip */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 shadow-sm flex justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                <Heart className="w-4 h-4 fill-destructive" />
                <span className="font-bold">{dashboard.heartsReceived}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Hearts</span>
            </div>
            <div className="w-px bg-border/50"></div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Zap className="w-4 h-4" />
                <span className="font-bold">{dashboard.streakDays}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Day Streak</span>
            </div>
            <div className="w-px bg-border/50"></div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-accent-foreground mb-1">
                <Gamepad2 className="w-4 h-4" />
                <span className="font-bold">{dashboard.gamesPlayedToday}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Games Today</span>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Daily Challenges */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Daily Challenges
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dashboard.dailyChallenges.map((challenge) => (
                <div 
                  key={challenge.id} 
                  className={`rounded-2xl p-4 border ${
                    challenge.completed 
                      ? 'bg-primary/5 border-primary/20 opacity-60' 
                      : 'bg-white border-primary/10 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold ${challenge.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {challenge.title}
                    </h3>
                    <span className="bg-secondary/20 text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      +{challenge.xpReward} XP
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Rooms */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary-foreground" />
                  Active Rooms
                </h2>
                <Link href="/rooms" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3 flex-1">
                {dashboard.activeRooms.length > 0 ? (
                  dashboard.activeRooms.slice(0, 3).map((room) => (
                    <Link key={room.id} href={`/rooms/${room.id}`}>
                      <div className="group bg-muted/30 hover:bg-white rounded-2xl p-3 border border-transparent hover:border-primary/20 transition-all cursor-pointer shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-lg">
                            {room.theme === 'sleepover' ? '⛺' : room.theme === 'study' ? '📚' : room.theme === 'heartbreak' ? '💔' : room.theme === 'arcade' ? '🕹️' : room.theme === 'gossip' ? '☕' : '🌪️'}
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{room.name}</p>
                            <p className="text-xs text-muted-foreground">{room.occupantCount}/{room.maxOccupants} chilling</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">No active rooms right now.</p>
                    <Link href="/rooms" className="text-primary text-sm font-bold mt-1 hover:underline">Start one!</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/50 flex flex-col">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-accent-foreground" />
                Activity
              </h2>
              <div className="space-y-4 flex-1">
                {dashboard.recentActivity.length > 0 ? (
                  dashboard.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {activity.type === 'heart_sent' ? <Heart className="w-4 h-4 text-destructive" /> :
                         activity.type === 'game_played' ? <Gamepad2 className="w-4 h-4 text-primary" /> :
                         <Sparkles className="w-4 h-4 text-secondary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-bold">{activity.username}</span> {activity.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">It's quiet... too quiet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
