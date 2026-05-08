import { FloatingBackground } from "./FloatingBackground";
import { Sidebar, MobileNav } from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex bg-transparent">
      <FloatingBackground />
      <Sidebar />
      <main className="flex-1 md:ml-64 p-5 md:p-8 lg:p-12 pb-28 md:pb-12 max-w-[1240px] mx-auto w-full z-10 relative">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
