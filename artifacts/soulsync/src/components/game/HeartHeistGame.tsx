import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ──── Constants ────────────────────────────────────────────────────────────
const GRID_W = 100;
const GRID_H = 75;
const BASE_TICK = 85;
const NUM_BOTS = 6;
const INITIAL_SIZE = 6;
const MAX_TRAIL = 400;

const SCHEMES = [
  { t: "rgba(249,168,212,0.72)", tr: "#db2777", gl: "#f9a8d4", txt: "#831843" },
  { t: "rgba(196,181,253,0.72)", tr: "#7c3aed", gl: "#c4b5fd", txt: "#4c1d95" },
  { t: "rgba(167,243,208,0.72)", tr: "#059669", gl: "#a7f3d0", txt: "#064e3b" },
  { t: "rgba(253,230,138,0.72)", tr: "#d97706", gl: "#fde68a", txt: "#78350f" },
  { t: "rgba(191,219,254,0.72)", tr: "#2563eb", gl: "#bfdbfe", txt: "#1e3a8a" },
  { t: "rgba(254,205,211,0.72)", tr: "#e11d48", gl: "#fecdd3", txt: "#881337" },
  { t: "rgba(217,249,157,0.72)", tr: "#65a30d", gl: "#d9f99d", txt: "#365314" },
];

const BOT_NAMES = ["SoftieCat","DeluluxGirl","MainCharactr","ChronicOnline","AuraQueen","NightcoreDemon"];

const POWERUP_DEF = [
  { id: "delulu",  emoji: "💅", name: "Delulu Mode",    desc: "Territory ×2!" },
  { id: "shield",  emoji: "💖", name: "Soft Shield",    desc: "Trail invincible!" },
  { id: "speed",   emoji: "☕", name: "Sleep Deprived", desc: "INSANE speed!" },
  { id: "mainchar",emoji: "🎧", name: "Main Character", desc: "You glow up!" },
];

const CHAOS_DEF = [
  { id: "mercury", emoji: "☿",  name: "Mercury Retrograde", desc: "Controls reversed!" },
  { id: "hotgirl", emoji: "🚶‍♀️", name: "Hot Girl Walk",       desc: "Everyone goes fast!" },
  { id: "sad",     emoji: "🎵", name: "Spotify Sad Hour",   desc: "Map vibes darkened…" },
  { id: "brainrot",emoji: "🧠", name: "Brainrot Storm",     desc: "Pure chaos!" },
];

const RANKS = [
  [0,"soft soul","🌸"],[5,"emotionally unavailable","🥀"],
  [10,"delulu certified","💅"],[20,"certified menace","😈"],
  [35,"nightcore demon","🎧"],[50,"delulu god","👑"],[70,"sleepy legend","💤"],
] as [number,string,string][];

const KILL_MSGS = [
  "💔 {k} emotionally destroyed {v}",
  "✨ {k} sent {v} to the void",
  "😭 {v} couldn't survive {k}'s aura",
  "💅 {k} said 'not today' to {v}",
  "🔥 {k} stole {v}'s whole vibe",
  "👑 Main Character Energy: {k} just ended {v}",
];

// ──── Types ────────────────────────────────────────────────────────────────
type Cell = { owner: number; isTrail: boolean };
type Particle = { x:number; y:number; vx:number; vy:number; life:number; max:number; emoji:string; sz:number };
type PowerupCell = { x:number; y:number; type:string; anim:number };
type Player = {
  id: number; x: number; y: number; dx: number; dy: number;
  trail: [number,number][]; alive: boolean; name: string;
  kills: number; isBot: boolean; btick: number;
  shielded: boolean; shieldT: number; speedT: number;
  respawnT: number; pendingDx: number; pendingDy: number;
};
type GS = {
  grid: Cell[][];
  players: Player[];
  particles: Particle[];
  powerups: PowerupCell[];
  tick: number; chaosTimer: number; chaosId: string|null; chaosDispT: number;
  running: boolean; cs: number; reversed: boolean; fast: boolean; dark: boolean;
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
    const [cx, cy] = queue.pop()!;
    for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]) {
      if (nx<0||nx>=GRID_W||ny<0||ny>=GRID_H) continue;
      mark(nx as number, ny as number);
    }
  }
  for (let y = 0; y < GRID_H; y++)
    for (let x = 0; x < GRID_W; x++)
      if (!outside[y * GRID_W + x] && grid[y][x].owner !== p.id)
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

function pickDir(p: Player, grid: Cell[][]): [number,number] {
  const options: [number,number][] = [[1,0],[-1,0],[0,1],[0,-1]];
  const shuffled = options.sort(() => Math.random() - 0.5);
  for (const [dx,dy] of shuffled) {
    const nx = p.x + dx, ny = p.y + dy;
    if (nx<1||nx>=GRID_W-1||ny<1||ny>=GRID_H-1) continue;
    const c = grid[ny][nx];
    if (c.isTrail && c.owner !== p.id) continue;
    if (dx === -p.dx && dy === -p.dy) continue;
    return [dx,dy];
  }
  return [p.dx, p.dy];
}

function spawnParticles(gs: GS, x: number, y: number, emoji: string, n: number) {
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const speed = 0.5 + Math.random() * 1.5;
    gs.particles.push({
      x: x * gs.cs + gs.cs / 2,
      y: y * gs.cs + gs.cs / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1, max: 1,
      emoji,
      sz: 14 + Math.random() * 14,
    });
  }
}

// ──── Component ───────────────────────────────────────────────────────────
export default function HeartHeistGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS | null>(null);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const tickRef = useRef(0);

  const [phase, setPhase] = useState<"menu"|"playing"|"dead"|"gameover">("menu");
  const [hudScore, setHudScore] = useState(0);
  const [hudKills, setHudKills] = useState(0);
  const [killCard, setKillCard] = useState<{k:string;v:string;msg:string}|null>(null);
  const [chaosCard, setChaosCard] = useState<{emoji:string;name:string;desc:string}|null>(null);
  const [activePU, setActivePU] = useState<string|null>(null);
  const [playerName, setPlayerName] = useState("You");
  const [finalScore, setFinalScore] = useState(0);
  const [finalKills, setFinalKills] = useState(0);
  const [inputName, setInputName] = useState("");

  // ── Input ──────────────────────────────────────────────────────────────
  const pendingDir = useRef({ dx: 0, dy: -1 });

  const handleKey = useCallback((e: KeyboardEvent) => {
    const gs = gsRef.current;
    if (!gs) return;
    const rev = gs.reversed;
    const map: Record<string, [number,number]> = {
      ArrowUp:    rev ? [0,1]  : [0,-1],
      ArrowDown:  rev ? [0,-1] : [0,1],
      ArrowLeft:  rev ? [1,0]  : [-1,0],
      ArrowRight: rev ? [-1,0] : [1,0],
      w: rev ? [0,1]  : [0,-1], W: rev ? [0,1]  : [0,-1],
      s: rev ? [0,-1] : [0,1],  S: rev ? [0,-1] : [0,1],
      a: rev ? [1,0]  : [-1,0], A: rev ? [1,0]  : [-1,0],
      d: rev ? [-1,0] : [1,0],  D: rev ? [-1,0] : [1,0],
    };
    if (map[e.key]) {
      const [dx,dy] = map[e.key];
      const p = gs.players[0];
      if (p && !(dx === -p.dx && dy === -p.dy)) {
        p.pendingDx = dx; p.pendingDy = dy;
      }
    }
  }, []);

  // Touch swipe
  const touchStart = useRef<{x:number;y:number}|null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const gs = gsRef.current; if (!gs) return;
    const p = gs.players[0]; if (!p) return;
    const rev = gs.reversed;
    let ndx = 0, ndy = 0;
    if (Math.abs(dx) > Math.abs(dy)) ndx = dx > 0 ? (rev?-1:1) : (rev?1:-1);
    else ndy = dy > 0 ? (rev?-1:1) : (rev?1:-1);
    if (!(ndx === -p.dx && ndy === -p.dy)) { p.pendingDx = ndx; p.pendingDy = ndy; }
    touchStart.current = null;
  };

  // ── Start game ────────────────────────────────────────────────────────
  const startGame = useCallback((name: string) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const cs = Math.floor(Math.min(window.innerWidth / GRID_W, window.innerHeight / GRID_H));
    canvas.width  = GRID_W * cs;
    canvas.height = GRID_H * cs;

    const grid = mkGrid();
    const players: Player[] = [];

    const starts: [number,number][] = [
      [20,20],[80,20],[20,55],[80,55],[50,10],[50,65],[10,37],
    ];

    for (let i = 0; i <= NUM_BOTS; i++) {
      const [sx, sy] = starts[i] || [
        INITIAL_SIZE + 1 + Math.floor(Math.random()*(GRID_W-INITIAL_SIZE*2-2)),
        INITIAL_SIZE + 1 + Math.floor(Math.random()*(GRID_H-INITIAL_SIZE*2-2)),
      ];
      claimStart(grid, i+1, sx, sy);
      const dirs: [number,number][] = [[1,0],[-1,0],[0,1],[0,-1]];
      const [dx,dy] = dirs[Math.floor(Math.random()*4)];
      players.push({
        id: i+1, x: sx, y: sy, dx, dy,
        trail: [], alive: true,
        name: i === 0 ? name : BOT_NAMES[i-1],
        kills: 0, isBot: i !== 0,
        btick: 0, shielded: false, shieldT: 0, speedT: 0, respawnT: 0,
        pendingDx: dx, pendingDy: dy,
      });
    }

    gsRef.current = {
      grid, players,
      particles: [],
      powerups: [],
      tick: 0, chaosTimer: 0, chaosId: null, chaosDispT: 0,
      running: true, cs, reversed: false, fast: false, dark: false,
    };
    lastTickRef.current = performance.now();
    setPhase("playing");
    setHudScore(0); setHudKills(0);
    setActivePU(null); setKillCard(null); setChaosCard(null);
  }, []);

  // ── Game tick ─────────────────────────────────────────────────────────
  const doTick = useCallback(() => {
    const gs = gsRef.current; if (!gs || !gs.running) return;
    const grid = gs.grid;
    gs.tick++;

    // Spawn powerup occasionally
    if (gs.tick % 120 === 0 && gs.powerups.length < 8) {
      const px = 2 + Math.floor(Math.random()*(GRID_W-4));
      const py = 2 + Math.floor(Math.random()*(GRID_H-4));
      const type = POWERUP_DEF[Math.floor(Math.random()*POWERUP_DEF.length)].id;
      gs.powerups.push({ x: px, y: py, type, anim: 0 });
    }

    // Chaos events
    gs.chaosTimer++;
    if (gs.chaosTimer > 600) {
      gs.chaosTimer = 0;
      const ev = CHAOS_DEF[Math.floor(Math.random()*CHAOS_DEF.length)];
      gs.chaosId = ev.id;
      gs.chaosDispT = 200;
      gs.reversed = ev.id === "mercury";
      gs.fast     = ev.id === "hotgirl";
      gs.dark     = ev.id === "sad";
      setChaosCard({ emoji: ev.emoji, name: ev.name, desc: ev.desc });
      setTimeout(() => setChaosCard(null), 3000);
    }
    if (gs.chaosDispT > 0) gs.chaosDispT--;
    else if (gs.chaosId) {
      gs.chaosId = null; gs.reversed = false; gs.fast = false; gs.dark = false;
    }

    // Update powerup anims
    for (const pu of gs.powerups) pu.anim++;

    // Move players
    for (const p of gs.players) {
      if (!p.alive) {
        if (p.isBot) {
          p.respawnT--;
          if (p.respawnT <= 0) {
            const nx = INITIAL_SIZE+1+Math.floor(Math.random()*(GRID_W-INITIAL_SIZE*2-2));
            const ny = INITIAL_SIZE+1+Math.floor(Math.random()*(GRID_H-INITIAL_SIZE*2-2));
            claimStart(grid, p.id, nx, ny);
            p.x=nx; p.y=ny; p.dx=1; p.dy=0;
            p.pendingDx=1; p.pendingDy=0;
            p.trail=[]; p.alive=true;
          }
        }
        continue;
      }

      // Update timers
      if (p.shieldT > 0) { p.shieldT--; if (p.shieldT === 0) p.shielded = false; }
      if (p.speedT > 0) p.speedT--;

      // Bot AI
      if (p.isBot) {
        p.btick++;
        const trailLen = p.trail.length;
        const inBase = grid[p.y]?.[p.x]?.owner === p.id && !grid[p.y]?.[p.x]?.isTrail;

        if (trailLen > 60 + Math.random()*30) {
          // Try to return to territory
          const homeDir = pickDir(p, grid);
          p.pendingDx = homeDir[0]; p.pendingDy = homeDir[1];
        } else if (p.btick % (8 + Math.floor(Math.random()*12)) === 0) {
          const [ndx,ndy] = pickDir(p, grid);
          p.pendingDx = ndx; p.pendingDy = ndy;
        }
      }

      // Apply pending direction (can't reverse)
      if (!(p.pendingDx === -p.dx && p.pendingDy === -p.dy)) {
        p.dx = p.pendingDx; p.dy = p.pendingDy;
      }

      const nx = p.x + p.dx;
      const ny = p.y + p.dy;

      // Boundary
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) {
        killPlayer(gs, p, null);
        continue;
      }

      const dest = grid[ny][nx];

      // Trail self-collision
      if (dest.isTrail && dest.owner === p.id) {
        killPlayer(gs, p, null);
        continue;
      }

      // Trail collision with enemy trail
      if (dest.isTrail && dest.owner !== p.id && !p.shielded) {
        const killer = gs.players.find(pl => pl.id === dest.owner);
        killPlayer(gs, p, killer || null);
        continue;
      }

      // Move
      p.x = nx; p.y = ny;

      const curCell = grid[ny][nx];

      // Returning to own territory with a trail — fill!
      if (curCell.owner === p.id && !curCell.isTrail && p.trail.length > 0) {
        // Destroy any enemy trails that were inside
        fillTerritory(grid, p);
        spawnParticles(gs, p.x, p.y, "💖", 8);
        const score = Math.round(countOwned(grid, p.id) / (GRID_W*GRID_H) * 100 * 10) / 10;
        if (!p.isBot) setHudScore(score);
      } else {
        // Leaving territory or on empty — leave trail
        if (curCell.owner !== p.id || curCell.isTrail) {
          // On enemy territory or empty
          p.trail.push([nx, ny]);
          grid[ny][nx] = { owner: p.id, isTrail: true };
          if (p.trail.length > MAX_TRAIL) {
            killPlayer(gs, p, null);
            continue;
          }
        }
      }

      // Check powerup pickup
      for (let pi = gs.powerups.length - 1; pi >= 0; pi--) {
        const pu = gs.powerups[pi];
        if (pu.x === p.x && pu.y === p.y) {
          gs.powerups.splice(pi, 1);
          applyPowerup(gs, p, pu.type);
          if (!p.isBot) {
            const def = POWERUP_DEF.find(d => d.id === pu.type)!;
            setActivePU(`${def.emoji} ${def.name}`);
            setTimeout(() => setActivePU(null), 5000);
          }
          spawnParticles(gs, p.x, p.y, "✨", 6);
        }
      }
    }

    // Update particles
    for (let i = gs.particles.length - 1; i >= 0; i--) {
      const pt = gs.particles[i];
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.05;
      pt.life -= 0.025;
      if (pt.life <= 0) gs.particles.splice(i, 1);
    }

    // Check game over (player dead & not respawning)
    const p0 = gs.players[0];
    if (p0 && !p0.alive && !p0.isBot) {
      gs.running = false;
      const score = Math.round(countOwned(grid, 1) / (GRID_W*GRID_H) * 100 * 10) / 10;
      setFinalScore(score); setFinalKills(p0.kills);
      setTimeout(() => setPhase("gameover"), 2000);
    }
  }, []);

  function killPlayer(gs: GS, p: Player, killer: Player|null) {
    // Remove trail from grid
    for (const [tx,ty] of p.trail)
      if (gs.grid[ty]?.[tx]?.owner === p.id)
        gs.grid[ty][tx] = { owner: 0, isTrail: false };
    p.trail = []; p.alive = false;
    p.respawnT = 180;

    spawnParticles(gs, p.x, p.y, "💔", 10);
    spawnParticles(gs, p.x, p.y, "✨", 6);

    if (killer) {
      killer.kills++;
      if (!killer.isBot || !gs.players[0].isBot) {
        const msgs = KILL_MSGS;
        const raw = msgs[Math.floor(Math.random()*msgs.length)];
        const msg = raw.replace("{k}", killer.name).replace("{v}", p.name);
        setKillCard({ k: killer.name, v: p.name, msg });
        setTimeout(() => setKillCard(null), 3000);
      }
      if (!killer.isBot) setHudKills(killer.kills);
    }

    if (!p.isBot) {
      setPhase("dead");
    }
  }

  function applyPowerup(gs: GS, p: Player, type: string) {
    if (type === "shield") { p.shielded = true; p.shieldT = 150; }
    else if (type === "speed") { p.speedT = 100; }
    else if (type === "delulu") {
      // Large fill around current territory
      const bonus: [number,number][] = [];
      for (let y=0;y<GRID_H;y++)
        for (let x=0;x<GRID_W;x++)
          if (gs.grid[y][x].owner===p.id) {
            for (const [dx2,dy2] of [[-1,0],[1,0],[0,-1],[0,1]]) {
              const nx2=x+dx2,ny2=y+dy2;
              if(nx2>=0&&nx2<GRID_W&&ny2>=0&&ny2<GRID_H&&gs.grid[ny2][nx2].owner!==p.id)
                bonus.push([nx2,ny2]);
            }
          }
      for (const [bx,by] of bonus) gs.grid[by][bx]={owner:p.id,isTrail:false};
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const gs = gsRef.current; if (!gs) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const { cs, grid, players, particles, powerups, dark } = gs;

    // Background
    if (dark) {
      ctx.fillStyle = "#1a0a2e";
    } else {
      const bg = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      bg.addColorStop(0, "#fce7f3");
      bg.addColorStop(0.4, "#ede9fe");
      bg.addColorStop(0.8, "#e0f2fe");
      bg.addColorStop(1, "#fce7f3");
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.03)" : "rgba(180,140,220,0.08)";
    ctx.lineWidth = 0.5;
    for (let x=0;x<=GRID_W;x++) {
      ctx.beginPath(); ctx.moveTo(x*cs,0); ctx.lineTo(x*cs,GRID_H*cs); ctx.stroke();
    }
    for (let y=0;y<=GRID_H;y++) {
      ctx.beginPath(); ctx.moveTo(0,y*cs); ctx.lineTo(GRID_W*cs,y*cs); ctx.stroke();
    }

    // Draw territory cells
    for (let y=0;y<GRID_H;y++) {
      for (let x=0;x<GRID_W;x++) {
        const cell = grid[y][x];
        if (!cell.owner) continue;
        const s = SCHEMES[(cell.owner-1) % SCHEMES.length];
        if (cell.isTrail) {
          ctx.fillStyle = s.tr;
          ctx.shadowColor = s.gl;
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = s.t;
          ctx.shadowBlur = 0;
        }
        const pad = cell.isTrail ? 1 : 0;
        ctx.fillRect(x*cs+pad, y*cs+pad, cs-pad*2, cs-pad*2);
      }
    }
    ctx.shadowBlur = 0;

    // Territory level evolution (sparkles on large territories)
    for (const p of players) {
      if (!p.alive) continue;
      const owned = countOwned(grid, p.id);
      const pct = owned / (GRID_W*GRID_H);
      if (pct > 0.15 && gs.tick % 60 === p.id) {
        // Find a random cell to sparkle
        const rx = Math.floor(Math.random()*GRID_W);
        const ry = Math.floor(Math.random()*GRID_H);
        if (grid[ry][rx].owner === p.id && !grid[ry][rx].isTrail) {
          spawnParticles(gs, rx, ry, pct > 0.3 ? "⭐" : "🌸", 1);
        }
      }
    }

    // Powerup cells
    ctx.font = `${cs * 1.4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const pu of powerups) {
      const def = POWERUP_DEF.find(d=>d.id===pu.type)!;
      const bob = Math.sin(pu.anim * 0.08) * 2;
      ctx.globalAlpha = 0.9 + Math.sin(pu.anim*0.1)*0.1;
      ctx.fillText(def.emoji, pu.x*cs+cs/2, pu.y*cs+cs/2+bob);
    }
    ctx.globalAlpha = 1;

    // Draw players
    for (const p of players) {
      if (!p.alive) continue;
      const s = SCHEMES[(p.id-1) % SCHEMES.length];
      const px2 = p.x * cs + cs/2;
      const py2 = p.y * cs + cs/2;
      const r = cs * 0.55;

      ctx.save();
      // Glow
      ctx.shadowColor = s.gl;
      ctx.shadowBlur = p.isBot ? 10 : (p.id === 1 ? 20 : 10);
      if (p.shielded) {
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 24;
      }
      // Body
      ctx.beginPath();
      ctx.arc(px2, py2, r, 0, Math.PI*2);
      ctx.fillStyle = p.isBot ? s.tr : (p.id===1 ? s.tr : s.tr);
      ctx.fill();
      ctx.restore();

      // Inner circle
      ctx.beginPath();
      ctx.arc(px2, py2, r*0.55, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();

      // Name tag (only for player 1 always; bots when visible)
      if (!p.isBot || cs >= 8) {
        ctx.font = `bold ${Math.max(8, cs*0.75)}px Nunito,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = dark ? "#fff" : s.txt;
        ctx.fillText(p.name.slice(0,4), px2, py2 + r + cs * 0.7);
      }

      // Shield ring
      if (p.shielded) {
        ctx.save();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px2, py2, r + 4, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Particles
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.font = `${pt.sz}px serif`;
      ctx.fillText(pt.emoji, pt.x, pt.y);
    }
    ctx.globalAlpha = 1;
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" && phase !== "dead") return;

    const loop = (now: number) => {
      const gs = gsRef.current;
      if (!gs) return;
      const speed = gs.fast || gs.players.find(p=>p.id===1&&p.speedT>0) ? BASE_TICK * 0.5 : BASE_TICK;
      if (now - lastTickRef.current >= speed) {
        lastTickRef.current = now;
        doTick();
      }
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, doTick, render]);

  // ── Keyboard ──────────────────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Resize ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const gs = gsRef.current; if (!gs) return;
      const canvas = canvasRef.current; if (!canvas) return;
      const cs = Math.floor(Math.min(window.innerWidth / GRID_W, window.innerHeight / GRID_H));
      gs.cs = cs;
      canvas.width  = GRID_W * cs;
      canvas.height = GRID_H * cs;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Mini leaderboard for HUD ──────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<{name:string;pct:number;id:number}[]>([]);
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => {
      const gs = gsRef.current; if (!gs) return;
      const entries = gs.players
        .filter(p=>p.alive)
        .map(p=>({ name:p.name, pct: Math.round(countOwned(gs.grid,p.id)/(GRID_W*GRID_H)*100*10)/10, id:p.id }))
        .sort((a,b)=>b.pct-a.pct)
        .slice(0,5);
      setLeaderboard(entries);
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Rank ──────────────────────────────────────────────────────────────
  const rank = getRank(hudScore);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER PHASES
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div
      style={{ width:"100vw", height:"100vh", position:"relative", overflow:"hidden" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          imageRendering:"pixelated",
        }}
      />

      {/* ── MENU ── */}
      <AnimatePresence>
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position:"absolute",inset:0,
              background:"linear-gradient(135deg,#fce7f3 0%,#ede9fe 40%,#e0f2fe 80%,#fce7f3 100%)",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:24,
            }}
          >
            {/* Floating blobs */}
            <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
              {[
                {c:"rgba(249,168,212,0.35)",w:320,h:320,t:"5%",l:"10%"},
                {c:"rgba(196,181,253,0.3)",w:280,h:280,t:"60%",l:"70%"},
                {c:"rgba(167,243,208,0.3)",w:240,h:240,t:"30%",l:"80%"},
                {c:"rgba(253,230,138,0.25)",w:200,h:200,t:"70%",l:"5%"},
              ].map((blob,i)=>(
                <div key={i} className={`animate-float${i>0?`-${Math.min(i+1,3)}`:""}`}
                  style={{
                    position:"absolute",width:blob.w,height:blob.h,
                    top:blob.t,left:blob.l,
                    background:blob.c,borderRadius:"60% 40% 70% 30% / 50% 60% 40% 70%",
                    filter:"blur(60px)",
                  }}
                />
              ))}
            </div>

            {/* Logo */}
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
              style={{ textAlign:"center", zIndex:1 }}
            >
              <div style={{ fontSize: 80, lineHeight:1, marginBottom:8 }}>💖</div>
              <h1 className="font-display" style={{
                fontSize:"clamp(3rem,8vw,5.5rem)", fontWeight:900,
                background:"linear-gradient(135deg,#db2777,#7c3aed,#059669)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                letterSpacing:"-0.02em", lineHeight:1.1,
              }}>
                HeartHeist<span style={{fontSize:"0.7em"}}>.io</span>
              </h1>
              <p style={{
                fontSize:"clamp(1rem,2.5vw,1.3rem)", color:"#7c3aed",
                fontWeight:600, marginTop:8, opacity:0.8,
              }}>
                Conquer the dreamscape. Steal hearts. Spread aura. 💅
              </p>
            </motion.div>

            {/* Name input */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12, zIndex:1 }}
            >
              <input
                value={inputName}
                onChange={e=>setInputName(e.target.value.slice(0,14))}
                onKeyDown={e=>{ if(e.key==="Enter"&&inputName.trim()) { setPlayerName(inputName.trim()); startGame(inputName.trim()); }}}
                placeholder="your username..."
                style={{
                  padding:"12px 24px",borderRadius:9999,border:"2px solid rgba(196,181,253,0.5)",
                  background:"rgba(255,255,255,0.75)",backdropFilter:"blur(12px)",
                  fontSize:18,fontWeight:600,fontFamily:"Nunito,sans-serif",
                  color:"#4c1d95",textAlign:"center",outline:"none",width:260,
                  boxShadow:"0 4px 20px rgba(196,181,253,0.3)",
                }}
              />
              <button
                className="btn-pastel"
                onClick={() => {
                  const name = inputName.trim() || "You";
                  setPlayerName(name);
                  startGame(name);
                }}
                style={{ padding:"16px 48px", fontSize:20 }}
              >
                ✨ Enter the Dreamscape
              </button>
            </motion.div>

            {/* How to play */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass"
              style={{
                borderRadius:20, padding:"20px 32px", maxWidth:520, zIndex:1,
                textAlign:"center",
              }}
            >
              <p style={{ fontSize:14, color:"#7c3aed", fontWeight:700, marginBottom:10 }}>
                ✦ HOW TO PLAY ✦
              </p>
              <div style={{ display:"flex",gap:24,flexWrap:"wrap",justifyContent:"center" }}>
                {[
                  ["🕹️","WASD / Arrow keys or swipe"],
                  ["💖","Close a loop to claim territory"],
                  ["⚠️","Don't touch your own trail!"],
                  ["💅","Grab powerups for chaos"],
                ].map(([emoji,text])=>(
                  <div key={text as string} style={{display:"flex",gap:6,alignItems:"center",fontSize:13,color:"#4c1d95",fontWeight:600}}>
                    <span>{emoji}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Gen-Z rank badges */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
              style={{ display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:500,zIndex:1 }}
            >
              {RANKS.slice(0,5).map(([,name,emoji])=>(
                <span key={name as string} className="hud-badge" style={{padding:"6px 14px",fontSize:12,fontWeight:700,color:"#7c3aed"}}>
                  {emoji as string} {name as string}
                </span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HUD (during game) ── */}
      {(phase === "playing" || phase === "dead") && (
        <>
          {/* Top bar */}
          <div style={{
            position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",
            display:"flex",gap:10,alignItems:"center",zIndex:10,
          }}>
            <div className="hud-badge" style={{padding:"8px 20px",display:"flex",gap:12}}>
              <span style={{fontWeight:800,color:"#db2777",fontSize:16}}>
                💖 {hudScore}%
              </span>
              <span style={{fontWeight:800,color:"#7c3aed",fontSize:16}}>
                ⚡ {hudKills} kills
              </span>
            </div>
            <div className="hud-badge" style={{padding:"8px 16px",fontSize:13,fontWeight:700,color:"#4c1d95"}}>
              {rank[2]} {rank[1]}
            </div>
          </div>

          {/* Leaderboard */}
          <div style={{
            position:"absolute",top:12,right:12,zIndex:10,
            display:"flex",flexDirection:"column",gap:4,minWidth:160,
          }}>
            {leaderboard.map((e,i)=>{
              const s = SCHEMES[(e.id-1)%SCHEMES.length];
              return (
                <div key={e.id} className="hud-badge" style={{
                  padding:"5px 12px",display:"flex",alignItems:"center",gap:8,
                  fontSize:12,fontWeight:700,
                  border: e.id===1?"2px solid rgba(219,39,119,0.5)":"",
                }}>
                  <span style={{color:"#9ca3af",minWidth:14}}>#{i+1}</span>
                  <span style={{
                    width:8,height:8,borderRadius:"50%",
                    background:s.tr,flexShrink:0,
                  }}/>
                  <span style={{flex:1,color:"#4c1d95",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {e.name}
                  </span>
                  <span style={{color:s.txt}}>{e.pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Active powerup */}
          <AnimatePresence>
            {activePU && (
              <motion.div
                key="pu"
                initial={{ scale:0, y:20 }}
                animate={{ scale:1, y:0 }}
                exit={{ scale:0, opacity:0 }}
                style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:10}}
              >
                <div className="powerup-active">{activePU}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls hint */}
          <div style={{
            position:"absolute",bottom:12,left:12,zIndex:10,
          }}>
            <div className="hud-badge" style={{padding:"5px 12px",fontSize:11,color:"#9ca3af",fontWeight:600}}>
              WASD / arrows
            </div>
          </div>
        </>
      )}

      {/* ── KILL CARD ── */}
      <AnimatePresence>
        {killCard && (
          <motion.div
            key="kill"
            initial={{ scale:0.6, y:-30, opacity:0 }}
            animate={{ scale:1,   y:0,   opacity:1 }}
            exit={{   scale:0.8,  y:-20, opacity:0 }}
            transition={{ type:"spring", bounce:0.5 }}
            style={{
              position:"absolute",top:"18%",left:"50%",transform:"translateX(-50%)",
              zIndex:30, minWidth:280, textAlign:"center",
            }}
          >
            <div className="kill-card" style={{padding:"20px 32px"}}>
              <div style={{fontSize:32,marginBottom:4}}>💔</div>
              <p style={{
                fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,
                color:"#831843",lineHeight:1.4,
              }}>
                {killCard.msg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAOS EVENT ── */}
      <AnimatePresence>
        {chaosCard && (
          <motion.div
            key="chaos"
            className="animate-chaos-in"
            style={{
              position:"absolute",top:"10%",left:"50%",transform:"translateX(-50%)",
              zIndex:30,textAlign:"center",
            }}
          >
            <div className="glass" style={{
              borderRadius:20,padding:"16px 28px",
              border:"2px solid rgba(251,191,36,0.4)",
              boxShadow:"0 12px 40px rgba(251,191,36,0.25)",
            }}>
              <div style={{fontSize:36}}>{chaosCard.emoji}</div>
              <p style={{fontFamily:"Nunito,sans-serif",fontWeight:900,fontSize:18,color:"#92400e"}}>
                {chaosCard.name}
              </p>
              <p style={{fontSize:13,color:"#b45309",fontWeight:600}}>{chaosCard.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DEAD OVERLAY ── */}
      <AnimatePresence>
        {phase === "dead" && (
          <motion.div
            key="dead"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            style={{
              position:"absolute",inset:0,
              background:"rgba(30,10,50,0.45)",
              display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",
              zIndex:20, gap:20,
            }}
          >
            <motion.div
              initial={{ scale:0.7, y:20 }}
              animate={{ scale:1, y:0 }}
              transition={{ type:"spring",bounce:0.4,delay:0.1 }}
              className="glass"
              style={{ borderRadius:24,padding:"32px 48px",textAlign:"center",maxWidth:360 }}
            >
              <div style={{fontSize:56,marginBottom:8}}>💔</div>
              <h2 className="font-display" style={{fontSize:28,fontWeight:900,color:"#831843",marginBottom:4}}>
                You got eliminated
              </h2>
              <p style={{color:"#9d174d",fontWeight:600,fontSize:14,marginBottom:20}}>
                {hudScore}% territory · {hudKills} kills · Rank: {rank[2]} {rank[1]}
              </p>
              <button
                className="btn-pastel"
                onClick={() => {
                  setPhase("menu");
                  gsRef.current = null;
                }}
                style={{padding:"12px 32px",fontSize:16}}
              >
                Back to Menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME OVER ── */}
      <AnimatePresence>
        {phase === "gameover" && (
          <motion.div
            key="gameover"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            style={{
              position:"absolute",inset:0,
              background:"linear-gradient(135deg,#fce7f3,#ede9fe,#e0f2fe)",
              display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",
              zIndex:40, gap:24,
            }}
          >
            <motion.div
              initial={{ scale:0.7, y:-20 }}
              animate={{ scale:1, y:0 }}
              transition={{ type:"spring",bounce:0.5 }}
              style={{ textAlign:"center" }}
            >
              <div style={{fontSize:72, marginBottom:8}}>
                {finalScore >= 50 ? "👑" : finalScore >= 20 ? "✨" : "💖"}
              </div>
              <h1 className="font-display" style={{
                fontSize:"clamp(2rem,6vw,4rem)",fontWeight:900,
                background:"linear-gradient(135deg,#db2777,#7c3aed)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              }}>
                {finalScore >= 50 ? "DELULU GOD" : finalScore >= 20 ? "Main Character" : "Soft Soul"}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.2 }}
              className="glass"
              style={{ borderRadius:24,padding:"28px 48px",textAlign:"center",minWidth:320 }}
            >
              <p className="font-display" style={{fontSize:14,fontWeight:700,color:"#9ca3af",marginBottom:16,letterSpacing:"0.1em"}}>
                FINAL STATS
              </p>
              <div style={{display:"flex",gap:32,justifyContent:"center",marginBottom:20}}>
                {[
                  ["💖","Territory",`${finalScore}%`],
                  ["⚡","Kills",String(finalKills)],
                  ["🏅","Rank",`${getRank(finalScore)[2]} ${getRank(finalScore)[1]}`],
                ].map(([em,label,val])=>(
                  <div key={label as string} style={{textAlign:"center"}}>
                    <div style={{fontSize:28}}>{em}</div>
                    <div style={{fontSize:22,fontWeight:900,color:"#4c1d95",fontFamily:"Nunito,sans-serif"}}>{val}</div>
                    <div style={{fontSize:11,color:"#9ca3af",fontWeight:600}}>{label}</div>
                  </div>
                ))}
              </div>
              <button
                className="btn-pastel"
                onClick={() => {
                  setPhase("menu");
                  gsRef.current = null;
                }}
                style={{padding:"14px 40px",fontSize:17,width:"100%"}}
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
