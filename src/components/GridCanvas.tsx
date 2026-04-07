"use client";

import { useEffect, useRef } from "react";

const GRID = 120; // must match --grid-size
const INFLUENCE = 180; // px radius of cursor influence
const BASE_SIZE = 3; // base star arm length (px)
const MAX_SCALE = 2.0; // 200%

export default function GridCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    const drawStar = (cx: number, cy: number, size: number, alpha: number) => {
      // 4-point star (cross shape with glow)
      const r = size;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);

      // Glow
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
      grd.addColorStop(0, "rgba(255, 32, 32, 0.6)");
      grd.addColorStop(0.5, "rgba(255, 32, 32, 0.15)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);

      // Horizontal arm
      ctx.fillStyle = "rgba(255, 32, 32, 0.9)";
      ctx.beginPath();
      ctx.ellipse(0, 0, r, 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vertical arm
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.7, r, 0, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = "rgba(255, 60, 60, 1)";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.5, r * 0.25), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const halfGrid = GRID / 2;

      // Stars sit at center of each grid cell (offset by half grid)
      const startX = halfGrid;
      const startY = halfGrid;

      for (let x = startX; x < w + GRID; x += GRID) {
        for (let y = startY; y < h + GRID; y += GRID) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Scale: fully invisible (0) when no cursor nearby → MAX_SCALE at cursor
          const t = Math.max(0, 1 - dist / INFLUENCE);
          // Ease in-out for smooth feel
          const eased = t * t * (3 - 2 * t);
          const scale = eased * MAX_SCALE;

          if (scale < 0.01) continue; // skip invisible stars

          const size = BASE_SIZE * scale;
          const alpha = eased * 0.95;

          drawStar(x, y, size, alpha);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      id="grid-stars"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
