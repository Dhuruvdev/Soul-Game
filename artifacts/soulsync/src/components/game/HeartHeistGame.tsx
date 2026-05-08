import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ──── Constants ────────────────────────────────────────────────────────────
const GRID_W = 100;
const GRID_H = 75;
const BASE_TICK = 88;          // ms per game tick
const NUM_BOTS = 7;
const INITIAL_SIZE = 5;
const MAX_TRAIL = 350;
const VIEWPORT_W = 28;         // cells visible horizontally
const VIEWPORT_H = 21;         // cells visible vertically
const CAM_LERP = 0.08;         // camera smoothing (lower = smoother)
const VIS_LERP = 0.28;         // player visual lerp

const SCHEMES = [
  { t: "rgba(249,168,212,0.82)", tr: "#db2777", gl: "#f9a8d4", bg: "rgba(253,242,248,0.9)",  name: "Rose"    },
  { t: "rgba(196,181,253,0.82)", tr: "#7c3aed", gl: "#c4b5fd", bg: "rgba(245,243,255,0.9)",  name: "Violet"  },
  { t: "rgba(167,243,208,0.82)", tr: "#059669", gl: "#a7f3d0", bg: "rgba(236,253,245,0.9)",  name: "Mint"    },
  { t: "rgba(253,230,138,0.82)", tr: "#d97706", gl: "#fde68a", bg: "rgba(255,251,235,0.9)",  name: "Honey"   },
  { t: "rgba(191,219,254,0.82)", tr: "#2563eb", gl: "#bfdbfe", bg: "rgba(239,246,255,0.9)",  name: "Sky"     },
  { t: "rgba(254,205,211,0.82)", tr: "#e11d48", gl: "#fecdd3", bg: "rgba(255,241,242,0.9)",  name: "Coral"   },
  { t: "rgba(217,249,157,0.82)", tr: "#65a30d", gl: "#d9f99d", bg: "rgba(247,254,231,0.9)",  name: "Lime"    },
  { t: "rgba(253,186,116,0.82)", tr: "#ea580c", gl: "#fed7aa", bg: "rgba(255,247,237,0.9)",  name: "Peach"   },
];

const BOT_NAMES = ["SoftieCat","DeluluxGirl","MainCharactr","ChronicOnline","AuraQueen","NightcoreDemon","VoidBae"];
const BOT_EMOJIS = ["🐱","✨","🎧","📱","👑","🎵","🌙"];

const POWERUP_DEF = [
  { id: "delulu",  emoji: "💅", name: "Delulu Mode",    desc: "Territory ×2!" },
  { id: "shield",  emoji: "💖", name: "Soft Shield",    desc: "Trail invincible!" },
  { id: "speed",   emoji: "☕", name: "Sleep Deprived", desc: "INSANE speed!" },
  { id: "mainchar",emoji: "🎧", name: "Main Character", desc: "You glow up!" },
  { id: "ghost",   emoji: "👻", name: "Ghost Mode",     desc: "Pass through trails!" },
];

const CHAOS_DEF = [
  { id: "mercury", emoji: "☿",  name: "Mercury Retrograde", desc: "Controls reversed!" },
  { id: "hotgirl", emoji: "🚶‍♀️", name: "Hot Girl Walk",       desc: "Everyone goes fast!" },
  { id: "sad",     emoji: "🎵", name: "Spotify Sad Hour",    desc: "Vibes darkened…" },
  { id: "brainrot",emoji: "🧠", name: "Brainrot Storm",      desc: "Pure chaos!" },
];

const RANKS = [
  [0,  "soft soul",               "🌸"],
  [5,  "emotionally unavailable", "🥀"],
  [10, "delulu certified",        "💅"],
  [20, "certified menace",        "😈"],
  [35, "nightcore demon",         "🎧"],
  [50, "delulu god",              "👑"],
  [70, "sleepy legend",           "💤"],
] as [number,string,string][];

const KILL_MSGS = [
  "💔 {k} emotionally destroyed {v}",
  "✨ {k} sent {v} to the void",
  "😭 {v} couldn't survive {k}'s aura",
  "💅 {k} said 'not today' to {v}",
  "🔥 {k} stole {v}'s whole vibe",
  "👑 Main Character Energy: {k} ended {v}",
  "🌸 {v} got cooked by {k}",
  "✨ {k} absolutely served {v}",
];

// ──── Types ────────────────────────────────────────────────────────────────
type Cell = { owner: number; isTrail: boolean };
type Particle = {
  wx: number; wy: number; vx: number; vy: number;
  life: number; max: number; emoji: string; sz: number; rot: number; rotV: number;
};
type DriftPart = { x: number; y: number; vx: number; vy: number; life: number; emoji: string; sz: number; alpha: number };
type PowerupCell = { x: number; y: number; type: string; anim: number };
type Player = {
  id: number; x: number; y: number; dx: number; dy: number;
  vx: number; vy: number; // visual interpolation (world coords)
  trail: [number,number][]; alive: boolean; name: string; emoji: string;
  kills: number; isBot: boolean; btick: number;
  shielded: boolean; shieldT: number; speedT: number; ghostT: number;
  respawnT: number; pendingDx: number; pendingDy: number;
  pulseTick: number; // for glow animation
};
type Camera = { x: number; y: number }; // center of view in world coords
type GS = {
  grid: Cell[][]; players: Player[];
  particles: Particle[]; drifts: DriftPart[]; powerups: PowerupCell[];
  tick: number; chaosTimer: number; chaosId: string|null; chaosDispT: number;
  running: boolean; cs: number; cam: Camera;
  reversed: boolean; fast: boolean; dark: boolean;
};

// ──── Helpers ──────────────────────────────────────────────────────────────
function mkGrid(): Cell[][] {
  return Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => ({ owner: 0, isTrail: false }))
  );
}

function claimStart(grid: Cell[][], id: number, cx: number, cy: number) {
  for (let y = cy - INITIAL_SIZE; y <= cy + INITIAL_SIZE; y++)
    for (let x = cx - INITIAL_SIZE; x <= cx + INITIAL_SIZE; x++)
      if (x>=0&&x<GRID_W&&y>=0&&y<GRID_H)
        grid[y][x] = { owner: id, isTrail: false };
}

function fillTerritory(grid: Cell[][], p: Player) {
  for (const [tx, ty] of p.trail)
    grid[ty][tx] = { owner: p.id, isTrail: false };
  p.trail = [];

  const outside = new Uint8Array(GRID_W * GRID_H);
  const queue: [number, number][] = [];
  const mark = (x: number, y: number) => {
    const idx = y * GRID_W + x;
    if (outside[idx] || grid[y][x].owner === p.id) return;
    outside[idx] = 1; queue.push([x, y]);
  };
  for (let x = 0; x < GRID_W; x++) { mark(x, 0); mark(x, GRID_H - 1); }
  for (let y = 1; y < GRID_H - 1; y++) { mark(0, y); mark(GRID_W - 1, y); }
  while (queue.length) {
    const item = queue.pop()!;
    const [cx, cy] = item;
    for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]] as [number,number][]) {
      if (nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
      mark(nx, ny);
    }
  }
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++)
      if (!outside[y*GRID_W+x] && grid[y][x].owner !== p.id)
        grid[y][x] = { owner: p.id, isTrail: false };
}

function countOwned(grid: Cell[][], id: number) {
  let n = 0;
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++)
      if (grid[y][x].owner === id && !grid[y][x].isTrail) n++;
  return n;
}

function getRank(pct: number) {
  let r = RANKS[0];
  for (const rk of RANKS) if (pct >= rk[0]) r = rk;
  return r;
}

function safeDir(p: Player, grid: Cell[][]): [number,number] {
  const options: [number,number][] = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  for (const [dx,dy] of options) {
    if (dx === -p.dx && dy === -p.dy) continue;
    const nx = p.x + dx, ny = p.y + dy;
    if (nx<1||nx>=GRID_W-1||ny<1||ny>=GRID_H-1) continue;
    const c = grid[ny]?.[nx];
    if (!c) continue;
    if (c.isTrail && c.owner !== p.id && !p.ghostT) continue;
    return [dx, dy];
  }
  return [p.dx, p.dy];
}

function spawnParticles(gs: GS, wx: number, wy: number, emojis: string[], n: number) {
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.6;
    const speed = 0.04 + Math.random() * 0.1;
    gs.particles.push({
      wx: wx + 0.5, wy: wy + 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.04,
      life: 1, max: 1,
      emoji: emojis[Math.floor(Math.random()*emojis.length)],
      sz: 16 + Math.random() * 16,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
    });
  }
}

// ──── Component ───────────────────────────────────────────────────────────
export default function HeartHeistGame() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const minimapRef  = useRef<HTMLCanvasElement>(null);
  const gsRef       = useRef<GS | null>(null);
  const rafRef      = useRef(0);
  const lastTickRef = useRef(0);

  const [phase, setPhase] = useState<"menu"|"playing"|"dead"|"gameover">("menu");
  const [hudScore, setHudScore]   = useState(0);
  const [hudKills, setHudKills]   = useState(0);
  const [killCard, setKillCard]   = useState<{msg:string}|null>(null);
  const [chaosCard, setChaosCard] = useState<{emoji:string;name:string;desc:string}|null>(null);
  const [activePU, setActivePU]   = useState<string|null>(null);
  const [inputName, setInputName] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name:string;pct:number;id:number;emoji:string}[]>([]);
  const [menuParticles, setMenuParticles] = useState<{x:number;y:number;s:number;e:string;delay:number}[]>([]);

  // Menu sparkles
  useEffect(() => {
    const emojis = ["💖","✨","🌸","💜","⭐","🦋","🫧","🍓","💫","🎀"];
    const pts = Array.from({length:18},(_,i) => ({
      x: Math.random()*100, y: Math.random()*100,
      s: 0.7 + Math.random()*0.8,
      e: emojis[i % emojis.length],
      delay: Math.random()*4,
    }));
    setMenuParticles(pts);
  }, []);

  // ── Input ──────────────────────────────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    const gs = gsRef.current; if (!gs) return;
    const rev = gs.reversed;
    const map: Record<string,[number,number]> = {
      ArrowUp:    rev?[0,1]:[0,-1], ArrowDown:  rev?[0,-1]:[0,1],
      ArrowLeft:  rev?[1,0]:[-1,0], ArrowRight: rev?[-1,0]:[1,0],
      w:rev?[0,1]:[0,-1], W:rev?[0,1]:[0,-1],
      s:rev?[0,-1]:[0,1], S:rev?[0,-1]:[0,1],
      a:rev?[1,0]:[-1,0], A:rev?[1,0]:[-1,0],
      d:rev?[-1,0]:[1,0], D:rev?[-1,0]:[1,0],
    };
    if (map[e.key]) {
      const [dx,dy] = map[e.key];
      const p = gs.players[0];
      if (p && !(dx===-p.dx && dy===-p.dy)) { p.pendingDx=dx; p.pendingDy=dy; }
      e.preventDefault();
    }
  }, []);

  const touchStart = useRef<{x:number;y:number}|null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const ddx = e.changedTouches[0].clientX - touchStart.current.x;
    const ddy = e.changedTouches[0].clientY - touchStart.current.y;
    const gs = gsRef.current; if (!gs) return;
    const p = gs.players[0]; if (!p || !p.alive) return;
    const rev = gs.reversed;
    let ndx=0,ndy=0;
    if (Math.abs(ddx)>Math.abs(ddy)) ndx=ddx>0?(rev?-1:1):(rev?1:-1);
    else ndy=ddy>0?(rev?-1:1):(rev?1:-1);
    if (!(ndx===-p.dx&&ndy===-p.dy)){p.pendingDx=ndx;p.pendingDy=ndy;}
    touchStart.current=null;
  };

  // ── Kill player ────────────────────────────────────────────────────────
  const killPlayer = useCallback((gs: GS, p: Player, killer: Player|null) => {
    for (const [tx,ty] of p.trail)
      if (gs.grid[ty]?.[tx]?.owner===p.id) gs.grid[ty][tx]={owner:0,isTrail:false};
    p.trail=[]; p.alive=false; p.respawnT=200;
    spawnParticles(gs,p.x,p.y,["💔","✨","🌸","💖"],12);

    if (killer) {
      killer.kills++;
      const raw = KILL_MSGS[Math.floor(Math.random()*KILL_MSGS.length)];
      const msg = raw.replace("{k}",killer.name).replace("{v}",p.name);
      setKillCard({msg});
      setTimeout(()=>setKillCard(null),3000);
      if (!killer.isBot) setHudKills(killer.kills);
    }
    if (!p.isBot) {
      setTimeout(()=>setPhase("dead"),800);
    }
  }, []);

  // ── Apply powerup ─────────────────────────────────────────────────────
  const applyPowerup = useCallback((gs: GS, p: Player, type: string) => {
    if (type==="shield")  { p.shielded=true; p.shieldT=180; }
    if (type==="speed")   { p.speedT=120; }
    if (type==="ghost")   { p.ghostT=150; }
    if (type==="mainchar"){ spawnParticles(gs,p.x,p.y,["✨","👑","💫","⭐"],16); }
    if (type==="delulu")  {
      const ext: [number,number][] = [];
      for (let y=0;y<GRID_H;y++)
        for (let x=0;x<GRID_W;x++)
          if (gs.grid[y][x].owner===p.id)
            for (const [a,b] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) {
              const nx=x+a,ny=y+b;
              if (nx>=0&&nx<GRID_W&&ny>=0&&ny<GRID_H&&gs.grid[ny][nx].owner!==p.id)
                ext.push([nx,ny]);
            }
      for (const [ex,ey] of ext) gs.grid[ey][ex]={owner:p.id,isTrail:false};
    }
  }, []);

  // ── Game tick ─────────────────────────────────────────────────────────
  const doTick = useCallback(() => {
    const gs = gsRef.current; if (!gs||!gs.running) return;
    const grid = gs.grid;
    gs.tick++;

    // Spawn powerups
    if (gs.tick % 100 === 0 && gs.powerups.length < 10) {
      const px = 3+Math.floor(Math.random()*(GRID_W-6));
      const py = 3+Math.floor(Math.random()*(GRID_H-6));
      if (!grid[py][px].owner) {
        const type = POWERUP_DEF[Math.floor(Math.random()*POWERUP_DEF.length)].id;
        gs.powerups.push({x:px,y:py,type,anim:0});
      }
    }

    // Chaos events
    gs.chaosTimer++;
    if (gs.chaosTimer>700&&gs.chaosId===null) {
      gs.chaosTimer=0;
      const ev = CHAOS_DEF[Math.floor(Math.random()*CHAOS_DEF.length)];
      gs.chaosId=ev.id; gs.chaosDispT=250;
      gs.reversed=ev.id==="mercury";
      gs.fast=ev.id==="hotgirl";
      gs.dark=ev.id==="sad";
      setChaosCard({emoji:ev.emoji,name:ev.name,desc:ev.desc});
      setTimeout(()=>{setChaosCard(null);gs.chaosId=null;gs.reversed=false;gs.fast=false;gs.dark=false;},4000);
    }
    if (gs.chaosDispT>0) gs.chaosDispT--;

    for (const pu of gs.powerups) pu.anim++;

    // Ambient drifting hearts in game world
    if (gs.tick%30===0 && gs.drifts.length<30) {
      const emojis=["💖","✨","🌸","💫","⭐","🦋"];
      gs.drifts.push({
        x: Math.random()*GRID_W, y: GRID_H+1,
        vx:(Math.random()-0.5)*0.01, vy:-0.04-Math.random()*0.03,
        life:1, emoji:emojis[Math.floor(Math.random()*emojis.length)],
        sz:10+Math.random()*8, alpha:0.3+Math.random()*0.4,
      });
    }
    for (let i=gs.drifts.length-1;i>=0;i--) {
      const d=gs.drifts[i];
      d.x+=d.vx; d.y+=d.vy; d.life-=0.003;
      if(d.life<=0||d.y<-2) gs.drifts.splice(i,1);
    }

    // Move players
    for (const p of gs.players) {
      if (!p.alive) {
        if (p.isBot && --p.respawnT<=0) {
          const nx=INITIAL_SIZE+2+Math.floor(Math.random()*(GRID_W-INITIAL_SIZE*2-4));
          const ny=INITIAL_SIZE+2+Math.floor(Math.random()*(GRID_H-INITIAL_SIZE*2-4));
          claimStart(grid,p.id,nx,ny);
          p.x=nx;p.y=ny;p.dx=1;p.dy=0;p.pendingDx=1;p.pendingDy=0;
          p.trail=[];p.alive=true;p.vx=nx;p.vy=ny;
        }
        continue;
      }
      p.pulseTick++;
      if (p.shieldT>0){p.shieldT--;if(p.shieldT===0)p.shielded=false;}
      if (p.speedT>0) p.speedT--;
      if (p.ghostT>0) p.ghostT--;

      // Bot AI
      if (p.isBot) {
        p.btick++;
        const trailLen=p.trail.length;
        const lookAhead=p.x+p.dx*2;
        const lookAheadY=p.y+p.dy*2;
        const danger = lookAhead<1||lookAhead>=GRID_W-1||lookAheadY<1||lookAheadY>=GRID_H-1
          || (grid[lookAheadY]?.[lookAhead]?.isTrail && grid[lookAheadY]?.[lookAhead]?.owner!==p.id);

        if (danger || (trailLen>50+Math.random()*40 && p.btick%5===0) || p.btick%(12+Math.floor(Math.random()*15))===0) {
          const [ndx,ndy]=safeDir(p,grid);
          p.pendingDx=ndx; p.pendingDy=ndy;
        }
      }

      // Apply pending direction (no 180)
      if (!(p.pendingDx===-p.dx&&p.pendingDy===-p.dy)) {
        p.dx=p.pendingDx; p.dy=p.pendingDy;
      }

      const nx=p.x+p.dx, ny=p.y+p.dy;

      // Boundary
      if (nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) { killPlayer(gs,p,null); continue; }

      const dest=grid[ny][nx];

      // Trail self-collision
      if (dest.isTrail&&dest.owner===p.id) { killPlayer(gs,p,null); continue; }

      // Trail enemy collision
      if (dest.isTrail&&dest.owner!==p.id&&!p.shielded&&!p.ghostT) {
        const killer=gs.players.find(pl=>pl.id===dest.owner&&pl.alive)||null;
        killPlayer(gs,p,killer); continue;
      }

      p.x=nx; p.y=ny;
      const cur=grid[ny][nx];

      // Close loop -> fill
      if (cur.owner===p.id&&!cur.isTrail&&p.trail.length>0) {
        fillTerritory(grid,p);
        spawnParticles(gs,p.x,p.y,["💖","✨","🌸"],6);
        const score=Math.round(countOwned(grid,p.id)/(GRID_W*GRID_H)*1000)/10;
        if(!p.isBot) setHudScore(score);
      } else {
        // Leave trail
        if (cur.owner!==p.id||cur.isTrail) {
          p.trail.push([nx,ny]);
          grid[ny][nx]={owner:p.id,isTrail:true};
          if (p.trail.length>MAX_TRAIL){killPlayer(gs,p,null);continue;}
        }
      }

      // Powerup pickup
      for (let pi=gs.powerups.length-1;pi>=0;pi--) {
        const pu=gs.powerups[pi];
        if (pu.x===p.x&&pu.y===p.y) {
          gs.powerups.splice(pi,1);
          applyPowerup(gs,p,pu.type);
          spawnParticles(gs,p.x,p.y,["✨","💫","⭐"],8);
          if(!p.isBot) {
            const def=POWERUP_DEF.find(d=>d.id===pu.type)!;
            setActivePU(`${def.emoji} ${def.name}`);
            setTimeout(()=>setActivePU(null),5000);
          }
        }
      }
    }

    // Update world particles
    for (let i=gs.particles.length-1;i>=0;i--) {
      const pt=gs.particles[i];
      pt.wx+=pt.vx; pt.wy+=pt.vy; pt.vy+=0.003; pt.life-=0.022; pt.rot+=pt.rotV;
      if(pt.life<=0) gs.particles.splice(i,1);
    }

    // Check game over
    const p0=gs.players[0];
    if (p0&&!p0.alive&&!p0.isBot) {
      gs.running=false;
      setFinalScore(Math.round(countOwned(grid,1)/(GRID_W*GRID_H)*1000)/10);
      setFinalKills(p0.kills);
    }
  }, [killPlayer, applyPowerup]);

  // ── Render ────────────────────────────────────────────────────────────
  const render = useCallback((now: number) => {
    const gs = gsRef.current; if (!gs) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const { grid, players, particles, drifts, powerups, dark, cam } = gs;

    // ── Camera lerp toward player 0
    const p0 = players[0];
    if (p0) {
      cam.x += (p0.x - cam.x) * CAM_LERP;
      cam.y += (p0.y - cam.y) * CAM_LERP;
    }

    // cell size to fit viewport
    const cs = Math.min(W / VIEWPORT_W, H / VIEWPORT_H);

    // world→screen
    const wx2s = (wx: number) => (wx - cam.x) * cs + W/2;
    const wy2s = (wy: number) => (wy - cam.y) * cs + H/2;

    // Visible range
    const visX0 = Math.floor(cam.x - VIEWPORT_W/2) - 1;
    const visY0 = Math.floor(cam.y - VIEWPORT_H/2) - 1;
    const visX1 = Math.ceil(cam.x + VIEWPORT_W/2) + 1;
    const visY1 = Math.ceil(cam.y + VIEWPORT_H/2) + 1;
    const clampX = (x:number) => Math.max(0,Math.min(GRID_W-1,x));
    const clampY = (y:number) => Math.max(0,Math.min(GRID_H-1,y));

    // ── Background
    const bgGrad = ctx.createLinearGradient(0,0,W,H);
    if (dark) {
      bgGrad.addColorStop(0,"#1a0a2e");
      bgGrad.addColorStop(0.5,"#0f0520");
      bgGrad.addColorStop(1,"#1a0a2e");
    } else {
      bgGrad.addColorStop(0,"#fce7f3");
      bgGrad.addColorStop(0.35,"#ede9fe");
      bgGrad.addColorStop(0.7,"#dbeafe");
      bgGrad.addColorStop(1,"#fce7f3");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    // ── Draw territory cells (no grid lines, just colored blocks)
    const rr = cs * 0.18; // corner radius
    for (let gy=clampY(visY0); gy<=clampY(visY1); gy++) {
      for (let gx=clampX(visX0); gx<=clampX(visX1); gx++) {
        const cell = grid[gy][gx];
        if (!cell.owner) continue;
        const s = SCHEMES[(cell.owner-1) % SCHEMES.length];
        const sx = wx2s(gx);
        const sy = wy2s(gy);
        const pad = cell.isTrail ? 0.5 : 1;

        if (cell.isTrail) {
          ctx.shadowColor = s.gl;
          ctx.shadowBlur  = 10;
          ctx.fillStyle   = s.tr;
        } else {
          ctx.shadowBlur  = 0;
          ctx.fillStyle   = s.t;
        }
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(sx+pad, sy+pad, cs-pad*2, cs-pad*2, rr);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // ── Territory border highlight (inner edge glow on player territory)
    if (p0 && p0.alive) {
      const s = SCHEMES[(p0.id-1) % SCHEMES.length];
      ctx.strokeStyle = s.tr;
      ctx.lineWidth   = 2;
      ctx.shadowColor = s.gl;
      ctx.shadowBlur  = 8;
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(now * 0.003);
      for (let gy=clampY(visY0); gy<=clampY(visY1); gy++) {
        for (let gx=clampX(visX0); gx<=clampX(visX1); gx++) {
          if (grid[gy][gx].owner!==p0.id||grid[gy][gx].isTrail) continue;
          // check if any neighbor is non-territory
          const onEdge =
            (gx===0||grid[gy][gx-1].owner!==p0.id) ||
            (gx===GRID_W-1||grid[gy][gx+1].owner!==p0.id) ||
            (gy===0||grid[gy-1]?.[gx]?.owner!==p0.id) ||
            (gy===GRID_H-1||grid[gy+1]?.[gx]?.owner!==p0.id);
          if (!onEdge) continue;
          const sx=wx2s(gx), sy=wy2s(gy);
          ctx.beginPath();
          // @ts-ignore
          ctx.roundRect(sx+1.5, sy+1.5, cs-3, cs-3, rr);
          ctx.stroke();
        }
      }
      ctx.globalAlpha=1;
      ctx.shadowBlur=0;
    }

    // ── Ambient drifting emojis in world space
    ctx.textAlign="center"; ctx.textBaseline="middle";
    for (const d of drifts) {
      const sx=wx2s(d.x), sy=wy2s(d.y);
      if (sx<-50||sx>W+50||sy<-50||sy>H+50) continue;
      ctx.globalAlpha = d.alpha * d.life;
      ctx.font = `${d.sz}px serif`;
      ctx.fillText(d.emoji, sx, sy);
    }
    ctx.globalAlpha=1;

    // ── Out-of-bounds dark vignette
    const darken = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);
    darken.addColorStop(0,"rgba(0,0,0,0)");
    darken.addColorStop(1,"rgba(0,0,0,0.22)");
    ctx.fillStyle=darken;
    ctx.fillRect(0,0,W,H);

    // ── Powerup cells
    ctx.textAlign="center"; ctx.textBaseline="middle";
    for (const pu of powerups) {
      const sx=wx2s(pu.x), sy=wy2s(pu.y);
      if (sx<-cs*2||sx>W+cs*2||sy<-cs*2||sy>H+cs*2) continue;
      const def=POWERUP_DEF.find(d=>d.id===pu.type)!;
      const bob=Math.sin(pu.anim*0.08)*cs*0.08;

      // Glow circle behind
      ctx.shadowColor="#fbbf24"; ctx.shadowBlur=12;
      ctx.globalAlpha=0.5+0.2*Math.sin(pu.anim*0.12);
      ctx.beginPath(); ctx.arc(sx+cs/2,sy+cs/2+bob,cs*0.42,0,Math.PI*2);
      ctx.fillStyle="rgba(254,240,138,0.4)"; ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=1;

      ctx.font=`${cs*0.72}px serif`;
      ctx.fillText(def.emoji, sx+cs/2, sy+cs/2+bob);
    }

    // ── Players
    for (const p of players) {
      if (!p.alive) continue;
      const s = SCHEMES[(p.id-1) % SCHEMES.length];

      // Smooth visual position (lerp)
      p.vx = p.vx + (p.x - p.vx) * VIS_LERP;
      p.vy = p.vy + (p.y - p.vy) * VIS_LERP;

      const sx = wx2s(p.vx + 0.5);
      const sy = wy2s(p.vy + 0.5);
      if (sx<-cs*3||sx>W+cs*3||sy<-cs*3||sy>H+cs*3) continue;

      const r = cs * 0.52;
      const pulse = Math.sin(p.pulseTick * 0.12) * 0.06;

      // Outer glow ring (pulsing)
      ctx.save();
      ctx.shadowColor = p.shielded ? "#fbbf24" : s.gl;
      ctx.shadowBlur = 20 + pulse * 20;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(sx, sy, r*(1.3+pulse), 0, Math.PI*2);
      ctx.fillStyle = p.shielded ? "rgba(251,191,36,0.3)" : s.t;
      ctx.fill();
      ctx.restore();

      // Body
      ctx.save();
      ctx.shadowColor = s.gl; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2);
      ctx.fillStyle = s.tr;
      ctx.fill();
      // Inner highlight
      ctx.beginPath(); ctx.arc(sx-r*0.25, sy-r*0.28, r*0.4, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fill();
      ctx.restore();

      // Emoji face
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.font = `${r * 0.85}px serif`;
      ctx.fillText(p.emoji, sx, sy+1);

      // Name tag (small pill below)
      if (cs >= 18) {
        const label = p.name.slice(0,10);
        ctx.font = `bold ${Math.max(9,cs*0.28)}px Nunito,sans-serif`;
        const tw = ctx.measureText(label).width;
        const th = Math.max(9,cs*0.28) + 4;
        const ty = sy + r + cs*0.12;
        ctx.fillStyle = dark?"rgba(0,0,0,0.55)":"rgba(255,255,255,0.75)";
        ctx.beginPath();
        // @ts-ignore
        ctx.roundRect(sx-tw/2-6, ty-th/2, tw+12, th, th/2);
        ctx.fill();
        ctx.fillStyle = dark?"#fff":s.tr;
        ctx.fillText(label, sx, ty);
      }

      // Ghost tint
      if (p.ghostT>0) {
        ctx.globalAlpha=0.35;
        ctx.beginPath(); ctx.arc(sx, sy, r*1.4, 0, Math.PI*2);
        ctx.fillStyle="#a78bfa"; ctx.fill();
        ctx.globalAlpha=1;
      }

      // Shield ring
      if (p.shielded) {
        ctx.save();
        ctx.strokeStyle="#fbbf24"; ctx.lineWidth=2.5;
        ctx.shadowColor="#fbbf24"; ctx.shadowBlur=12;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.arc(sx, sy, r+6+Math.sin(now*0.01)*2, 0, Math.PI*2);
        ctx.stroke(); ctx.restore();
      }
    }

    // ── World particles
    ctx.textAlign="center"; ctx.textBaseline="middle";
    for (const pt of gs.particles) {
      const sx=wx2s(pt.wx), sy=wy2s(pt.wy);
      if (sx<-60||sx>W+60||sy<-60||sy>H+60) continue;
      ctx.save();
      ctx.globalAlpha=Math.max(0,pt.life);
      ctx.font=`${pt.sz}px serif`;
      ctx.translate(sx,sy); ctx.rotate(pt.rot);
      ctx.fillText(pt.emoji,0,0);
      ctx.restore();
    }

    // ── MAP BOUNDARY indicator (edge pulse)
    if (p0&&p0.alive) {
      const sx0=wx2s(0), sy0=wy2s(0), sx1=wx2s(GRID_W), sy1=wy2s(GRID_H);
      ctx.strokeStyle="rgba(219,39,119,0.4)";
      ctx.lineWidth=3; ctx.setLineDash([8,8]);
      ctx.strokeRect(sx0,sy0,sx1-sx0,sy1-sy0);
      ctx.setLineDash([]);
    }

    // ── Render minimap
    const mm = minimapRef.current;
    if (mm) {
      const mc = mm.getContext("2d")!;
      const mcs = mm.width / GRID_W;
      mc.clearRect(0,0,mm.width,mm.height);
      mc.fillStyle=dark?"#0f0520":"#f3e8ff";
      mc.fillRect(0,0,mm.width,mm.height);
      for (let y=0;y<GRID_H;y++) {
        for (let x=0;x<GRID_W;x++) {
          const cell=grid[y][x];
          if (!cell.owner) continue;
          const s=SCHEMES[(cell.owner-1)%SCHEMES.length];
          mc.fillStyle=cell.isTrail?s.tr:s.t;
          mc.fillRect(x*mcs, y*mcs, mcs, mcs);
        }
      }
      // Player dots
      for (const p of players) {
        if(!p.alive) continue;
        const s=SCHEMES[(p.id-1)%SCHEMES.length];
        mc.beginPath();
        mc.arc((p.x+0.5)*mcs,(p.y+0.5)*mcs,Math.max(2,mcs*1.5),0,Math.PI*2);
        mc.fillStyle=s.tr;
        mc.fill();
        if(!p.isBot) {
          mc.strokeStyle="#fff"; mc.lineWidth=1;
          mc.stroke();
        }
      }
      // Viewport rect on minimap
      const vx0=Math.max(0,(cam.x-VIEWPORT_W/2)*mcs);
      const vy0=Math.max(0,(cam.y-VIEWPORT_H/2)*mcs);
      const vw=(VIEWPORT_W)*mcs;
      const vh=(VIEWPORT_H)*mcs;
      mc.strokeStyle="rgba(255,255,255,0.7)"; mc.lineWidth=1.5; mc.setLineDash([3,3]);
      mc.strokeRect(vx0,vy0,vw,vh);
      mc.setLineDash([]);
    }
  }, []);

  // ── Start game ────────────────────────────────────────────────────────
  const startGame = useCallback((name: string) => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const grid = mkGrid();
    const players: Player[] = [];
    const starts: [number,number][] = [
      [20,20],[80,20],[20,55],[80,55],[50,10],[50,65],[10,37],[90,37],
    ];

    for (let i=0; i<=NUM_BOTS; i++) {
      const [sx,sy] = starts[i] || [
        INITIAL_SIZE+2+Math.floor(Math.random()*(GRID_W-INITIAL_SIZE*2-4)),
        INITIAL_SIZE+2+Math.floor(Math.random()*(GRID_H-INITIAL_SIZE*2-4)),
      ];
      claimStart(grid,i+1,sx,sy);
      const dirs:[number,number][] = [[1,0],[-1,0],[0,1],[0,-1]];
      const [dx,dy]=dirs[Math.floor(Math.random()*4)];
      players.push({
        id:i+1, x:sx, y:sy, dx, dy, vx:sx, vy:sy,
        trail:[], alive:true,
        name:i===0?name:BOT_NAMES[i-1],
        emoji:i===0?"💖":BOT_EMOJIS[i-1],
        kills:0, isBot:i!==0,
        btick:0, shielded:false, shieldT:0, speedT:0, ghostT:0,
        respawnT:0, pendingDx:dx, pendingDy:dy, pulseTick:i*20,
      });
    }

    const mm = minimapRef.current;
    if (mm) { mm.width=100; mm.height=75; }

    gsRef.current = {
      grid, players, particles:[], drifts:[], powerups:[],
      tick:0, chaosTimer:0, chaosId:null, chaosDispT:0,
      running:true, cs:0,
      cam:{ x:players[0].x, y:players[0].y },
      reversed:false, fast:false, dark:false,
    };
    lastTickRef.current = performance.now();
    setPhase("playing");
    setHudScore(0); setHudKills(0); setActivePU(null);
    setKillCard(null); setChaosCard(null);
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="playing"&&phase!=="dead") return;
    const loop = (now: number) => {
      const gs = gsRef.current; if (!gs) return;
      const gs_fast = gs.fast || (gs.players[0]?.speedT??0)>0;
      const tickMs = gs_fast ? BASE_TICK*0.5 : BASE_TICK;
      if (now - lastTickRef.current >= tickMs) {
        lastTickRef.current = now;
        if (gs.running) doTick();
      }
      render(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, doTick, render]);

  // ── Leaderboard updater ───────────────────────────────────────────────
  useEffect(() => {
    if (phase!=="playing") return;
    const iv = setInterval(()=>{
      const gs=gsRef.current; if(!gs) return;
      const lb = gs.players
        .filter(p=>p.alive)
        .map(p=>({
          name:p.name, id:p.id, emoji:p.emoji,
          pct:Math.round(countOwned(gs.grid,p.id)/(GRID_W*GRID_H)*1000)/10,
        }))
        .sort((a,b)=>b.pct-a.pct).slice(0,5);
      setLeaderboard(lb);
      if (gs.players[0]?.alive) {
        setHudScore(lb.find(e=>e.id===1)?.pct??0);
        setHudKills(gs.players[0].kills);
      }
    },800);
    return ()=>clearInterval(iv);
  },[phase]);

  // ── Keyboard ──────────────────────────────────────────────────────────
  useEffect(()=>{
    window.addEventListener("keydown",handleKey,{passive:false});
    return ()=>window.removeEventListener("keydown",handleKey);
  },[handleKey]);

  // ── Resize ────────────────────────────────────────────────────────────
  useEffect(()=>{
    const onResize=()=>{
      const canvas=canvasRef.current; if(!canvas) return;
      canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    };
    window.addEventListener("resize",onResize);
    return ()=>window.removeEventListener("resize",onResize);
  },[]);

  const rank = getRank(hudScore);

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div
      style={{width:"100vw",height:"100vh",position:"relative",overflow:"hidden",userSelect:"none"}}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Game canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,display:"block"}} />

      {/* Minimap */}
      {(phase==="playing"||phase==="dead") && (
        <div style={{
          position:"absolute",bottom:16,right:16,zIndex:15,
          borderRadius:10,overflow:"hidden",
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          border:"2px solid rgba(255,255,255,0.4)",
        }}>
          <canvas ref={minimapRef} width={100} height={75}
            style={{display:"block",width:140,height:105}} />
        </div>
      )}

      {/* ── MENU ── */}
      <AnimatePresence>
        {phase==="menu" && (
          <motion.div key="menu" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.95}}
            style={{
              position:"absolute",inset:0,
              background:"linear-gradient(135deg,#fce7f3 0%,#ede9fe 45%,#dbeafe 80%,#fce7f3 100%)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,
              overflowY:"auto",padding:"20px 16px",
            }}
          >
            {/* Floating blobs */}
            <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
              {[
                {c:"rgba(249,168,212,0.45)",w:380,h:380,t:"-5%",l:"-5%",cls:"animate-float"},
                {c:"rgba(196,181,253,0.4)",w:320,h:320,t:"55%",l:"65%",cls:"animate-float-2"},
                {c:"rgba(167,243,208,0.35)",w:280,h:280,t:"25%",l:"75%",cls:"animate-float-3"},
                {c:"rgba(253,230,138,0.3)",w:240,h:240,t:"65%",l:"-2%",cls:"animate-float"},
                {c:"rgba(191,219,254,0.35)",w:200,h:200,t:"45%",l:"35%",cls:"animate-float-2"},
              ].map((b,i)=>(
                <div key={i} className={b.cls} style={{
                  position:"absolute",width:b.w,height:b.h,top:b.t,left:b.l,
                  background:b.c,borderRadius:"60% 40% 70% 30% / 50% 60% 40% 70%",filter:"blur(55px)",
                }}/>
              ))}
            </div>

            {/* Floating emoji sparkles */}
            <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
              {menuParticles.map((pt,i)=>(
                <div key={i} style={{
                  position:"absolute",
                  left:`${pt.x}%`, top:`${pt.y}%`,
                  fontSize:`${pt.s * 22}px`,
                  animation:`float ${3+pt.delay}s ease-in-out ${pt.delay}s infinite`,
                  opacity:0.55,
                }}>
                  {pt.e}
                </div>
              ))}
            </div>

            {/* Logo */}
            <motion.div initial={{y:-50,opacity:0}} animate={{y:0,opacity:1}}
              transition={{delay:0.1,type:"spring",bounce:0.45}}
              style={{textAlign:"center",position:"relative",zIndex:1}}
            >
              <motion.div
                animate={{rotate:[0,5,-5,0],scale:[1,1.05,0.98,1]}}
                transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}
                style={{fontSize:"clamp(56px,12vw,88px)",lineHeight:1,marginBottom:4}}
              >
                💖
              </motion.div>
              <h1 className="font-display" style={{
                fontSize:"clamp(2.8rem,8vw,5.5rem)",fontWeight:900,
                background:"linear-gradient(135deg,#db2777 0%,#7c3aed 50%,#0891b2 100%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                letterSpacing:"-0.02em",lineHeight:1.1,
              }}>
                HeartHeist<span style={{fontSize:"0.65em"}}>.io</span>
              </h1>
              <p style={{
                fontSize:"clamp(0.9rem,2vw,1.15rem)",color:"#7c3aed",
                fontWeight:700,marginTop:6,opacity:0.85,
              }}>
                Conquer the dreamscape · Steal hearts · Spread aura 💅
              </p>
            </motion.div>

            {/* Name + CTA */}
            <motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}}
              transition={{delay:0.2}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,position:"relative",zIndex:1}}
            >
              <input
                value={inputName}
                onChange={e=>setInputName(e.target.value.slice(0,14))}
                onKeyDown={e=>{ if(e.key==="Enter"){const n=inputName.trim()||"You";startGame(n);}}}
                placeholder="your username..."
                style={{
                  padding:"13px 28px",borderRadius:9999,
                  border:"2px solid rgba(196,181,253,0.55)",
                  background:"rgba(255,255,255,0.8)",backdropFilter:"blur(16px)",
                  fontSize:17,fontWeight:700,fontFamily:"Nunito,sans-serif",
                  color:"#4c1d95",textAlign:"center",outline:"none",width:"min(300px,80vw)",
                  boxShadow:"0 4px 24px rgba(196,181,253,0.35)",
                }}
              />
              <motion.button
                className="btn-pastel"
                whileHover={{scale:1.04,y:-2}} whileTap={{scale:0.97}}
                onClick={()=>{const n=inputName.trim()||"You";startGame(n);}}
                style={{padding:"15px 52px",fontSize:19,letterSpacing:"0.01em"}}
              >
                ✨ Enter the Dreamscape
              </motion.button>
            </motion.div>

            {/* How to play — styled tiles */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.32}}
              style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",maxWidth:540,position:"relative",zIndex:1}}
            >
              {[
                {e:"🕹️",t:"WASD / arrows",s:"or swipe on mobile"},
                {e:"💖",t:"Close a loop",s:"to capture territory"},
                {e:"⚠️",t:"Don't hit your trail",s:"instant elimination"},
                {e:"💅",t:"Grab powerups",s:"for chaotic boosts"},
              ].map(({e,t,s})=>(
                <div key={t} className="glass" style={{
                  borderRadius:16,padding:"12px 16px",textAlign:"center",
                  minWidth:110,flex:"1 1 110px",maxWidth:140,
                  boxShadow:"0 4px 16px rgba(139,92,246,0.12)",
                }}>
                  <div style={{fontSize:22,marginBottom:4}}>{e}</div>
                  <div style={{fontSize:12,fontWeight:800,color:"#4c1d95"}}>{t}</div>
                  <div style={{fontSize:10,color:"#7c3aed",fontWeight:600,opacity:0.7}}>{s}</div>
                </div>
              ))}
            </motion.div>

            {/* Rank pills */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.45}}
              style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center",maxWidth:500,position:"relative",zIndex:1}}
            >
              {RANKS.slice(0,6).map(([,name,emoji])=>(
                <span key={name as string} className="hud-badge"
                  style={{padding:"5px 13px",fontSize:11,fontWeight:800,color:"#7c3aed"}}>
                  {emoji as string} {name as string}
                </span>
              ))}
            </motion.div>

            {/* Chaos teaser */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.55}}
              style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",position:"relative",zIndex:1}}
            >
              {CHAOS_DEF.map(c=>(
                <div key={c.id} style={{
                  background:"rgba(255,255,255,0.6)",backdropFilter:"blur(8px)",
                  border:"1.5px solid rgba(255,255,255,0.8)",
                  borderRadius:9999,padding:"5px 13px",fontSize:11,fontWeight:700,color:"#92400e",
                }}>
                  {c.emoji} {c.name}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HUD ── */}
      {(phase==="playing"||phase==="dead") && (
        <>
          {/* Top bar */}
          <div style={{
            position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",
            zIndex:15,display:"flex",gap:8,alignItems:"center",
          }}>
            <div className="glass" style={{
              borderRadius:9999,padding:"8px 22px",
              display:"flex",gap:16,alignItems:"center",
              boxShadow:"0 4px 20px rgba(139,92,246,0.2)",
            }}>
              <span style={{fontWeight:900,fontSize:17,color:"#db2777",fontFamily:"Nunito,sans-serif"}}>
                💖 {hudScore}%
              </span>
              <span style={{width:1,height:18,background:"rgba(196,181,253,0.5)"}}/>
              <span style={{fontWeight:900,fontSize:17,color:"#7c3aed",fontFamily:"Nunito,sans-serif"}}>
                ⚡ {hudKills} kills
              </span>
            </div>
            <div className="hud-badge" style={{
              padding:"8px 14px",fontSize:12,fontWeight:800,
              color:"#4c1d95",whiteSpace:"nowrap",
            }}>
              {rank[2]} {rank[1]}
            </div>
          </div>

          {/* Left: leaderboard */}
          <div style={{
            position:"absolute",top:14,left:14,zIndex:15,
            display:"flex",flexDirection:"column",gap:4,minWidth:170,
          }}>
            {leaderboard.map((e,i)=>{
              const s=SCHEMES[(e.id-1)%SCHEMES.length];
              return (
                <div key={e.id} className="glass" style={{
                  borderRadius:9999,padding:"6px 14px",
                  display:"flex",alignItems:"center",gap:8,
                  border:e.id===1?"2px solid rgba(219,39,119,0.5)":"",
                  boxShadow:e.id===1?"0 0 12px rgba(219,39,119,0.25)":"",
                }}>
                  <span style={{fontSize:10,color:"#9ca3af",fontWeight:700,minWidth:16}}>#{i+1}</span>
                  <span style={{fontSize:14}}>{e.emoji}</span>
                  <span style={{flex:1,fontSize:11,fontWeight:800,color:"#4c1d95",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {e.name}
                  </span>
                  <span style={{fontSize:11,fontWeight:900,color:s.tr}}>{e.pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Active powerup banner */}
          <AnimatePresence>
            {activePU && (
              <motion.div key="pu"
                initial={{scale:0,y:20}} animate={{scale:1,y:0}} exit={{scale:0,opacity:0}}
                style={{position:"absolute",bottom:140,left:"50%",transform:"translateX(-50%)",zIndex:15}}
              >
                <div className="powerup-active">{activePU}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom hint */}
          <div style={{position:"absolute",bottom:14,left:14,zIndex:15}}>
            <div className="hud-badge" style={{padding:"5px 12px",fontSize:10,color:"#9ca3af",fontWeight:700}}>
              WASD · arrows · swipe
            </div>
          </div>
        </>
      )}

      {/* ── KILL CARD ── */}
      <AnimatePresence>
        {killCard && (
          <motion.div key="kill"
            initial={{scale:0.5,y:-40,opacity:0}}
            animate={{scale:1,y:0,opacity:1}}
            exit={{scale:0.85,opacity:0}}
            transition={{type:"spring",bounce:0.55}}
            style={{position:"absolute",top:"15%",left:"50%",transform:"translateX(-50%)",zIndex:30,minWidth:280,textAlign:"center"}}
          >
            <div className="kill-card" style={{padding:"18px 28px"}}>
              <div style={{fontSize:28,marginBottom:4}}>💔</div>
              <p style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:16,color:"#831843",lineHeight:1.5}}>
                {killCard.msg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAOS CARD ── */}
      <AnimatePresence>
        {chaosCard && (
          <motion.div key="chaos"
            initial={{scale:0.6,rotate:-8,opacity:0}}
            animate={{scale:1,rotate:0,opacity:1}}
            exit={{scale:0.8,opacity:0}}
            transition={{type:"spring",bounce:0.5}}
            style={{position:"absolute",top:"12%",left:"50%",transform:"translateX(-50%)",zIndex:30,textAlign:"center"}}
          >
            <div className="glass" style={{
              borderRadius:20,padding:"16px 32px",minWidth:260,
              border:"2px solid rgba(251,191,36,0.5)",
              boxShadow:"0 12px 40px rgba(251,191,36,0.3)",
            }}>
              <div style={{fontSize:40}}>{chaosCard.emoji}</div>
              <p style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:20,color:"#92400e",margin:"4px 0 2px"}}>
                {chaosCard.name}
              </p>
              <p style={{fontSize:13,color:"#b45309",fontWeight:700}}>{chaosCard.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DEAD SCREEN ── */}
      <AnimatePresence>
        {phase==="dead" && (
          <motion.div key="dead" initial={{opacity:0}} animate={{opacity:1}}
            style={{
              position:"absolute",inset:0,
              background:"rgba(20,5,40,0.55)",backdropFilter:"blur(4px)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              zIndex:25, gap:20,
            }}
          >
            <motion.div initial={{scale:0.7,y:24}} animate={{scale:1,y:0}}
              transition={{type:"spring",bounce:0.45,delay:0.1}} className="glass"
              style={{borderRadius:28,padding:"36px 52px",textAlign:"center",maxWidth:380}}
            >
              <motion.div
                animate={{rotate:[0,-10,10,-10,0]}} transition={{duration:0.6,delay:0.2}}
                style={{fontSize:60,marginBottom:10}}
              >💔</motion.div>
              <h2 className="font-display" style={{fontSize:30,fontWeight:900,color:"#831843",marginBottom:6}}>
                You got eliminated
              </h2>
              <div style={{display:"flex",gap:24,justifyContent:"center",margin:"16px 0"}}>
                {[["💖",`${hudScore}%`,"territory"],[" ⚡",`${hudKills}`,"kills"]].map(([e,v,l])=>(
                  <div key={l as string} style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontFamily:"Nunito",fontWeight:900,color:"#4c1d95"}}>{e} {v}</div>
                    <div style={{fontSize:11,color:"#9ca3af",fontWeight:700}}>{l}</div>
                  </div>
                ))}
              </div>
              <p style={{fontSize:13,color:"#7c3aed",fontWeight:700,marginBottom:18}}>
                {rank[2]} {rank[1]}
              </p>
              <button className="btn-pastel"
                onClick={()=>{setPhase("menu");gsRef.current=null;}}
                style={{padding:"13px 36px",fontSize:16,width:"100%"}}
              >
                Back to Menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME OVER ── */}
      <AnimatePresence>
        {phase==="gameover" && (
          <motion.div key="gameover" initial={{opacity:0}} animate={{opacity:1}}
            style={{
              position:"absolute",inset:0,
              background:"linear-gradient(135deg,#fce7f3,#ede9fe 50%,#dbeafe)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              zIndex:40,gap:24,
            }}
          >
            {/* Confetti blobs */}
            <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
              {menuParticles.slice(0,12).map((pt,i)=>(
                <div key={i} style={{
                  position:"absolute",left:`${pt.x}%`,top:`${pt.y}%`,
                  fontSize:`${pt.s*26}px`,
                  animation:`float ${2.5+pt.delay}s ease-in-out ${pt.delay*0.5}s infinite`,
                  opacity:0.7,
                }}>{pt.e}</div>
              ))}
            </div>

            <motion.div initial={{scale:0.6,y:-30}} animate={{scale:1,y:0}}
              transition={{type:"spring",bounce:0.5}} style={{textAlign:"center",position:"relative",zIndex:1}}
            >
              <motion.div
                animate={{scale:[1,1.12,0.95,1.08,1]}}
                transition={{duration:1.2,delay:0.3}}
                style={{fontSize:"clamp(56px,12vw,80px)",marginBottom:8}}
              >
                {finalScore>=50?"👑":finalScore>=20?"✨":"💖"}
              </motion.div>
              <h1 className="font-display" style={{
                fontSize:"clamp(2rem,6vw,4rem)",fontWeight:900,
                background:"linear-gradient(135deg,#db2777,#7c3aed,#0891b2)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              }}>
                {finalScore>=50?"Delulu God":finalScore>=20?"Main Character":"Soft Soul"}
              </h1>
            </motion.div>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              transition={{delay:0.25}} className="glass"
              style={{borderRadius:28,padding:"28px 52px",textAlign:"center",minWidth:"min(340px,90vw)",position:"relative",zIndex:1}}
            >
              <p className="font-display" style={{fontSize:12,fontWeight:800,color:"#9ca3af",marginBottom:20,letterSpacing:"0.12em"}}>
                FINAL STATS
              </p>
              <div style={{display:"flex",gap:28,justifyContent:"center",marginBottom:24}}>
                {[
                  ["💖","Territory",`${finalScore}%`],
                  ["⚡","Kills",String(finalKills)],
                  [getRank(finalScore)[2],"Rank",getRank(finalScore)[1]],
                ].map(([em,label,val])=>(
                  <div key={label as string} style={{textAlign:"center"}}>
                    <div style={{fontSize:30,marginBottom:2}}>{em}</div>
                    <div style={{fontSize:22,fontWeight:900,color:"#4c1d95",fontFamily:"Nunito,sans-serif"}}>{val}</div>
                    <div style={{fontSize:11,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
                  </div>
                ))}
              </div>
              <button className="btn-pastel"
                onClick={()=>{setPhase("menu");gsRef.current=null;}}
                style={{padding:"14px 0",fontSize:17,width:"100%"}}
              >
                ✨ Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
