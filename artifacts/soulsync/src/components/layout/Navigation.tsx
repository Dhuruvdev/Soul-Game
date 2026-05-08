import { Link, useLocation } from "wouter";
import { Home, User, Users, Gamepad2, Trophy, BarChart2, MessageCircleHeart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",            icon: Home,               label: "Home",       pill: "pill-blue"   },
  { href: "/profile",     icon: User,               label: "Profile",    pill: "pill-purple" },
  { href: "/friends",     icon: Users,              label: "Friends",    pill: "pill-mint"   },
  { href: "/rooms",       icon: MessageCircleHeart, label: "Rooms",      pill: "pill-peach"  },
  { href: "/games",       icon: Gamepad2,           label: "Games",      pill: "pill-lime"   },
  { href: "/leaderboard", icon: Trophy,             label: "Top Souls",  pill: "pill-pink"   },
  { href: "/stats",       icon: BarChart2,          label: "Wrapped",    pill: "pill-yellow" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 p-5 hidden md:flex flex-col z-40 bg-white shadow-[4px_0_24px_rgba(140,80,220,0.08)]">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2 pt-1">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg font-display"
          style={{ background: "linear-gradient(135deg, hsl(270,50%,65%), hsl(335,65%,75%))" }}
        >
          S
        </div>
        <span
          className="font-black text-2xl font-display tracking-tight"
          style={{ color: "hsl(270,50%,60%)" }}
        >
          SoulSync
        </span>
      </div>

      {/* Pill nav items */}
      <nav className="flex flex-col gap-2.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="outline-none">
              <div
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5 rounded-full transition-all duration-200 cursor-pointer group",
                  item.pill,
                  isActive
                    ? "shadow-sm scale-[1.02]"
                    : "opacity-80 hover:opacity-100 hover:scale-[1.01]"
                )}
              >
                <span
                  className="font-bold text-[15px]"
                  style={{ color: "hsl(270,35%,32%)" }}
                >
                  {item.label}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(130,80,200,0.12)" }}
                >
                  <item.icon className="w-4 h-4" style={{ color: "hsl(270,45%,50%)" }} />
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div
        className="mt-6 p-4 rounded-3xl text-center"
        style={{ background: "hsl(290,55%,91%)" }}
      >
        <p className="text-xs font-bold" style={{ color: "hsl(270,40%,55%)" }}>
          Daily streak keeps your bond alive
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 p-3 z-50 pointer-events-none">
      <div
        className="bg-white shadow-lg rounded-3xl flex items-center justify-between px-4 py-2.5 pointer-events-auto"
        style={{ boxShadow: "0 -2px 20px rgba(130,80,200,0.12)" }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-200",
                  isActive ? `${item.pill} scale-105` : "hover:bg-muted/50"
                )}
              >
                <item.icon
                  className="w-5 h-5"
                  style={{ color: isActive ? "hsl(270,45%,50%)" : "hsl(270,20%,60%)" }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
