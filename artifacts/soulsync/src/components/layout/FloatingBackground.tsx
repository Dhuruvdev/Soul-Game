import { motion } from "framer-motion";

export function FloatingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-background">

      {/* ── Large hard-edged decorative circles (like the reference) ── */}
      <motion.div
        animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-[340px] h-[340px] rounded-full"
        style={{ backgroundColor: "hsl(272, 42%, 76%)", opacity: 0.72 }}
      />
      <motion.div
        animate={{ y: [0, 14, 0], x: [0, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[38%] -right-16 w-[220px] h-[220px] rounded-full"
        style={{ backgroundColor: "hsl(280, 38%, 80%)", opacity: 0.55 }}
      />
      <motion.div
        animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -bottom-16 -left-16 w-[260px] h-[260px] rounded-full"
        style={{ backgroundColor: "hsl(275, 45%, 78%)", opacity: 0.60 }}
      />
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        className="absolute bottom-[20%] right-[8%] w-[140px] h-[140px] rounded-full"
        style={{ backgroundColor: "hsl(265, 40%, 82%)", opacity: 0.45 }}
      />

      {/* ── SVG Doodle squiggle decorations (hand-drawn cursive loops) ── */}
      {/* Upper-left doodle */}
      <motion.svg
        animate={{ rotate: [0, 4, -3, 0], y: [0, -8, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[2%] left-[1%] w-[280px] h-[200px] opacity-[0.30]"
        viewBox="0 0 280 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 30,160 C 10,120 -10,80 20,50 C 50,20 90,30 100,60 C 110,90 80,120 100,140 C 120,160 160,150 180,120 C 200,90 190,50 220,30 C 250,10 280,40 270,70"
          stroke="hsl(268, 45%, 62%)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 10,100 C 20,70 50,55 70,75 C 90,95 70,130 90,145"
          stroke="hsl(268, 45%, 62%)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>

      {/* Bottom-center doodle (the "ee" loops from reference) */}
      <motion.svg
        animate={{ rotate: [0, -3, 3, 0], y: [0, 10, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-[2%] left-[18%] w-[320px] h-[180px] opacity-[0.28]"
        viewBox="0 0 320 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 10,90 C 20,50 60,30 80,60 C 100,90 70,130 90,140 C 110,150 130,110 140,80 C 150,50 180,30 200,55 C 220,80 200,120 215,140 C 230,160 260,140 280,110 C 300,80 300,50 320,40"
          stroke="hsl(268, 45%, 62%)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.svg>

      {/* Top-right small doodle curl */}
      <motion.svg
        animate={{ rotate: [0, 6, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 7 }}
        className="absolute top-[14%] left-[12%] w-[160px] h-[120px] opacity-[0.22]"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 10,60 C 20,20 70,10 90,40 C 110,70 80,110 50,100 C 20,90 30,50 60,45 C 90,40 120,60 130,90"
          stroke="hsl(268, 45%, 62%)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>

      {/* Left-middle wavy line */}
      <motion.svg
        animate={{ x: [0, -6, 0], y: [0, 8, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[50%] -left-8 w-[120px] h-[200px] opacity-[0.20]"
        viewBox="0 0 120 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 80,10 C 60,40 20,50 30,80 C 40,110 80,100 90,130 C 100,160 60,170 50,190"
          stroke="hsl(268, 45%, 62%)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>
    </div>
  );
}
