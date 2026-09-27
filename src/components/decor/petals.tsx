"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface Petal {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  hue: string;
}

const HUES = ["#f5c7d6", "#eba0b8", "#fbe4ec", "#ecdcb6"];

/** Zachtjes vallende rozenblaadjes – decoratief, uit bij reduced motion. */
export function Petals({ count = 14, colors = HUES }: { count?: number; colors?: string[] }) {
  const reduce = useReducedMotion();
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    setPetals(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 10 + Math.random() * 14,
        delay: Math.random() * 10,
        duration: 12 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 160,
        rotate: Math.random() * 360,
        hue: colors[i % colors.length],
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, colors.join()]);

  // Container altijd renderen (gelijk aan server-HTML); blaadjes pas na mount.
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {!reduce && petals.map((p) => (
        <motion.svg
          key={p.id}
          viewBox="0 0 20 24"
          className="absolute -top-10"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.2 }}
          initial={{ y: -40, x: 0, rotate: p.rotate, opacity: 0 }}
          animate={{ y: "110vh", x: p.drift, rotate: p.rotate + 360, opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          <path d="M10 0C16 6 20 12 16 19c-2 3-10 3-12 0C0 12 4 6 10 0z" fill={p.hue} />
        </motion.svg>
      ))}
    </div>
  );
}

/** Botanische lijnillustratie. */
export function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" className={className} fill="none" aria-hidden>
      <motion.path
        d="M60 195C58 150 62 100 60 10"
        stroke="currentColor"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      {[160, 125, 90, 55, 25].map((y, i) => (
        <g key={y}>
          <motion.path
            d={`M60 ${y}C${40 - i * 2} ${y - 8} ${28} ${y - 26} ${30} ${y - 34}C${42} ${y - 30} ${56} ${y - 16} 60 ${y}z`}
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.6 }}
            style={{ transformOrigin: `60px ${y}px` }}
          />
          <motion.path
            d={`M60 ${y - 12}C${80 + i * 2} ${y - 20} ${92} ${y - 38} ${90} ${y - 46}C${78} ${y - 42} ${64} ${y - 28} 60 ${y - 12}z`}
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.2, duration: 0.6 }}
            style={{ transformOrigin: `60px ${y - 12}px` }}
          />
        </g>
      ))}
    </svg>
  );
}
