import React from "react";
import { useRoute, Link } from "wouter";
import { useGetCompatibility } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Compatibility() {
  const [, params] = useRoute("/compatibility/:userId");
  const userId = params?.userId ? parseInt(params.userId) : 0;

  const { data: result, isLoading, error } = useGetCompatibility(userId, {
    query: { enabled: !!userId }
  });

  if (isLoading) {
    return <div className="h-[80vh] flex items-center justify-center animate-pulse text-2xl font-bold text-primary">Calculating vibes... 🔮</div>;
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Could not read the stars</h2>
        <Button variant="outline" className="mt-6 rounded-xl" asChild>
          <Link href="/friends">Back to Friends</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-12">
      <Button variant="ghost" className="rounded-xl bg-white/50 backdrop-blur-md mb-4 hover:bg-white" asChild>
        <Link href={`/profile/${userId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Link>
      </Button>

      <div className="text-center space-y-4 relative">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-primary/20 relative z-10"
        >
          {result.score}%
        </motion.div>
        
        {/* Glow effect behind score */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/30 rounded-full blur-2xl z-0"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          <h1 className="text-3xl font-extrabold text-foreground">{result.title}</h1>
          <p className="text-muted-foreground font-medium max-w-md mx-auto mt-2">
            {result.verdict}
          </p>
        </motion.div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-8 shadow-xl border border-white/50 space-y-8 relative overflow-hidden mt-8">
        <div className="flex justify-center items-center gap-8 mb-4">
          <Avatar className="w-20 h-20 border-4 border-white shadow-md">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <Avatar className="w-20 h-20 border-4 border-white shadow-md">
            <AvatarImage src={result.user.avatarUrl || undefined} />
            <AvatarFallback>{result.user.displayName.substring(0,2)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Vibe Match</span>
              <span className="text-primary">{result.breakdown.vibe}%</span>
            </div>
            <Progress value={result.breakdown.vibe} className="h-3 bg-primary/10" indicatorColor="bg-primary" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Chaos Alignment</span>
              <span className="text-destructive">{result.breakdown.chaos}%</span>
            </div>
            <Progress value={result.breakdown.chaos} className="h-3 bg-destructive/10" indicatorColor="bg-destructive" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Loyalty / Trust</span>
              <span className="text-accent-foreground">{result.breakdown.loyalty}%</span>
            </div>
            <Progress value={result.breakdown.loyalty} className="h-3 bg-accent/20" indicatorColor="bg-accent-foreground" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Humor Wavelength</span>
              <span className="text-secondary-foreground">{result.breakdown.humor}%</span>
            </div>
            <Progress value={result.breakdown.humor} className="h-3 bg-secondary/20" indicatorColor="bg-secondary-foreground" />
          </div>
        </div>
        
        <div className="pt-4 border-t border-border text-center">
          <p className="text-sm font-bold text-muted-foreground">Bond XP Bonus</p>
          <p className="text-xl font-black text-primary">+{result.bondXp} XP</p>
        </div>
      </div>
    </div>
  );
}
