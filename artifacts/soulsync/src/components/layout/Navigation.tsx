import React from "react";
import { Link, useLocation } from "wouter";
import { Home, User, Users, Gamepad2, Trophy, BarChart2, MessageCircleHeart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/rooms", icon: MessageCircleHeart, label: "Rooms" },
  { href: "/games", icon: Gamepad2, label: "Games" },
  { href: "/leaderboard", icon: Trophy, label: "Top Souls" },
  { href: "/stats", icon: BarChart2, label: "Wrapped" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 p-6 hidden md:flex flex-col z-40 bg-white/40 backdrop-blur-xl border-r border-white/60">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-md">
          S
        </div>
        <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          SoulSync
        </span>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="outline-none focus:ring-2 focus:ring-primary/20 rounded-xl">
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium",
                  isActive
                    ? "bg-white shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/50">
        <p className="text-sm font-medium text-foreground mb-1">Stay Cozy 🌙</p>
        <p className="text-xs text-muted-foreground">Keep up your daily streaks to unlock special profile titles.</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg rounded-3xl flex items-center justify-between px-6 py-3 pointer-events-auto">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
