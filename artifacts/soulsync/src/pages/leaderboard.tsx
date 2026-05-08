import React from "react";
import { Link } from "wouter";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Trophy, Star, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 10 });

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Top Souls</h1>
        <p className="text-muted-foreground mt-3 font-medium">The most active and adored profiles.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard?.map((entry, index) => {
            const isTop3 = index < 3;
            return (
              <motion.div 
                key={entry.user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/profile/${entry.user.id}`}>
                  <div className={`
                    flex items-center gap-4 p-4 rounded-[2rem] border transition-all cursor-pointer group
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-md scale-[1.02]' : 
                      index === 1 ? 'bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-sm' :
                      index === 2 ? 'bg-gradient-to-r from-orange-50 to-white border-orange-200 shadow-sm' :
                      'bg-white/60 hover:bg-white border-white/50 hover:border-primary/20 shadow-sm'}
                  `}>
                    
                    <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-full shrink-0
                      ${index === 0 ? 'text-yellow-600 bg-yellow-100' : 
                        index === 1 ? 'text-slate-600 bg-slate-200' :
                        index === 2 ? 'text-orange-700 bg-orange-100' :
                        'text-muted-foreground bg-muted/50'}
                    `}>
                      #{entry.rank}
                    </div>

                    <Avatar className={`border-2 ${index === 0 ? 'w-16 h-16 border-yellow-400' : 'w-12 h-12 border-white'} shadow-sm`}>
                      <AvatarImage src={entry.user.avatarUrl || undefined} />
                      <AvatarFallback>{entry.user.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${index === 0 ? 'text-xl' : 'text-lg'}`}>
                        {entry.user.displayName}
                        {index === 0 && <Star className="inline w-4 h-4 text-yellow-500 ml-1 fill-yellow-500 mb-1" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">Lvl {entry.user.level} • {entry.bondsCount} bonds</p>
                    </div>

                    <div className="text-right shrink-0 px-2">
                      <div className="font-black text-primary text-lg">{entry.totalXp.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total XP</div>
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
