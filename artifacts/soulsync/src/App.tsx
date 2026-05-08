import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/home";
import Profile from "@/pages/profile";
import UserProfile from "@/pages/user-profile";
import Friends from "@/pages/friends";
import RoomsLobby from "@/pages/rooms-lobby";
import Room from "@/pages/room";
import GamesLobby from "@/pages/games-lobby";
import GamePlay from "@/pages/game-play";
import Stats from "@/pages/stats";
import Leaderboard from "@/pages/leaderboard";
import Compatibility from "@/pages/compatibility";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/:userId" component={UserProfile} />
        <Route path="/friends" component={Friends} />
        <Route path="/rooms" component={RoomsLobby} />
        <Route path="/rooms/:roomId" component={Room} />
        <Route path="/games" component={GamesLobby} />
        <Route path="/games/:type" component={GamePlay} />
        <Route path="/stats" component={Stats} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/compatibility/:userId" component={Compatibility} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
