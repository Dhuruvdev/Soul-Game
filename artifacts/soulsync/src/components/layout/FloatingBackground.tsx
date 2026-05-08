import React from "react";
import { motion } from "framer-motion";

export function FloatingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-background">
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#C8B8F4] mix-blend-multiply filter blur-[100px] opacity-40"
      />
      <motion.div
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 120, -40, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#F4B8D4] mix-blend-multiply filter blur-[100px] opacity-40"
      />
      <motion.div
        animate={{
          x: [0, 50, -100, 0],
          y: [0, 50, -80, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#B8D4F4] mix-blend-multiply filter blur-[100px] opacity-30"
      />
    </div>
  );
}
