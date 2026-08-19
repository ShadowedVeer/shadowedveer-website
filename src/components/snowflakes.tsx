import { useEffect, useState } from "react";

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function fmt(n: number, digits = 3) {
  return n.toFixed(digits);
}

const FLAKES = Array.from({ length: 42 }, (_, i) => {
  const r = hash(i + 1);
  const r2 = hash(i + 40);
  const r3 = hash(i + 80);
  return {
    id: i,
    left: `${fmt(r * 100)}%`,
    size: `${fmt(2 + r2 * 4.5)}px`,
    duration: `${fmt(10 + r3 * 16)}s`,
    delay: `${fmt(-(r * 18))}s`,
    opacity: fmt(0.18 + r2 * 0.5),
    drift: `${fmt(-24 + r3 * 48)}px`,
  };
});

export function Snowflakes() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {FLAKES.map((f) => (
        <span
          key={f.id}
          className="snowflake"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            animationDuration: f.duration,
            animationDelay: f.delay,
            opacity: Number(f.opacity),
            ["--drift" as string]: f.drift,
          }}
        />
      ))}
    </div>
  );
}
