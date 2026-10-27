"use client";

import { useEffect, useRef } from "react";

// fondo con puntitos que se mueven cuando pasas el raton
interface Particle {
  hx: number; // lugar donde descansa el punto en x
  hy: number; // lugar donde descansa el punto en y
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  speed: number;
  alpha: number;
}

const RADIUS = 180; // que tan cerca debe estar el raton para mover el punto
const REPEL = 0.9; // que tan fuerte empuja el raton
const SPRING = 0.015; // que tan rapido regresa a su lugar
const FRICTION = 0.88;
const LINK_DIST = 75;

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;

    const mouse = { x: -9999, y: -9999, active: false, strength: 0 };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // repartimos los puntos en filas y columnas con un poco de desorden
      const gap = 24;
      particles = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          const hx = x + (Math.random() - 0.5) * gap * 0.8;
          const hy = y + (Math.random() - 0.5) * gap * 0.8;
          particles.push({
            hx,
            hy,
            x: hx,
            y: hy,
            vx: 0,
            vy: 0,
            r: 0.7 + Math.random() * 1.3,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.8,
            alpha: 0,
          });
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    const tick = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      // hacemos suave la transicion cuando el raton entra o sale
      mouse.strength += ((mouse.active ? 1 : 0) - mouse.strength) * 0.08;

      const time = t / 1000;
      const visible: Particle[] = [];

      for (const p of particles) {
        // movimiento suave constante
        const driftX = Math.cos(time * p.speed + p.phase) * 6;
        const driftY = Math.sin(time * p.speed * 0.8 + p.phase) * 6;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        let targetAlpha = 0;
        if (dist < RADIUS && mouse.strength > 0.01) {
          const k = 1 - dist / RADIUS;
          const ease = k * k;
          // empujamos el punto lejos del raton
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          p.vx += (nx * REPEL + -ny * 0.35) * ease * mouse.strength;
          p.vy += (ny * REPEL + nx * 0.35) * ease * mouse.strength;
          targetAlpha = Math.min(1, k * 1.4) * mouse.strength;
        }

        p.vx += (p.hx + driftX - p.x) * SPRING;
        p.vy += (p.hy + driftY - p.y) * SPRING;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        p.alpha += (targetAlpha - p.alpha) * 0.1;

        if (p.alpha > 0.02) {
          visible.push(p);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(23, 23, 23, ${p.alpha * 0.55})`;
          ctx.fill();
        }
      }

      // dibujamos lineas delgaditas entre puntos que esten cerca
      ctx.lineWidth = 0.5;
      for (let i = 0; i < visible.length; i++) {
        const a = visible[i];
        for (let j = i + 1; j < visible.length; j++) {
          const b = visible[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * Math.min(a.alpha, b.alpha) * 0.25;
            ctx.strokeStyle = `rgba(23, 23, 23, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    build();
    if (!reduceMotion) {
      raf = requestAnimationFrame(tick);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("resize", build);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", build);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
