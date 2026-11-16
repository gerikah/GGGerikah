'use client';

import { useEffect, useRef } from 'react';

/** Recreates the reference's subtle hero rain and one-time glyph reveal. */
export function NoirHeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !host || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const glyphs = '░▒▓<>/\\_#01';
    const timers: number[] = [];
    let width = 0;
    let height = 0;
    let scale = 1;
    let animationFrame = 0;
    let visible = true;
    let drops: Array<{ x: number; y: number; length: number; speed: number; alpha: number }> = [];

    function paint(animate: boolean) {
      context!.clearRect(0, 0, width, height);
      context!.lineWidth = 1;
      for (const drop of drops) {
        context!.strokeStyle = `rgba(225, 225, 235, ${drop.alpha})`;
        context!.beginPath();
        context!.moveTo(drop.x, drop.y);
        context!.lineTo(drop.x - drop.length * 0.12, drop.y + drop.length);
        context!.stroke();
        if (animate) {
          drop.y += drop.speed;
          drop.x -= drop.speed * 0.12;
          if (drop.y > height + 36) {
            drop.y = -drop.length;
            drop.x = Math.random() * width;
          }
        }
      }
      if (animate && visible && !reducedMotion.matches) animationFrame = requestAnimationFrame(() => paint(true));
    }

    function resize() {
      const bounds = host!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * scale);
      canvas!.height = Math.round(height * scale);
      context!.setTransform(scale, 0, 0, scale, 0, 0);
      drops = Array.from({ length: Math.ceil(width / 6) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 8 + Math.random() * 28,
        speed: 1.8 + Math.random() * 3.6,
        alpha: 0.035 + Math.random() * 0.16,
      }));
      cancelAnimationFrame(animationFrame);
      paint(!reducedMotion.matches && visible);
    }

    function revealName() {
      if (reducedMotion.matches) return;
      const targets = host!.querySelectorAll<HTMLElement>('[data-noir-scramble]');
      targets.forEach((target, index) => {
        const finalText = target.textContent ?? '';
        let frame = 0;
        const interval = window.setInterval(() => {
          frame += 1;
          target.textContent = [...finalText].map((character, position) => {
            if (character === ' ' || frame > position * 4 + index * 6) return character;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          }).join('');
          if (frame > finalText.length * 4 + 10 + index * 6) {
            window.clearInterval(interval);
            target.textContent = finalText;
          }
        }, 38);
        timers.push(interval);
      });
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(animationFrame);
      if (visible && !reducedMotion.matches) animationFrame = requestAnimationFrame(() => paint(true));
    });
    observer.observe(host);
    resize();
    revealName();
    window.addEventListener('resize', resize, { passive: true });
    reducedMotion.addEventListener('change', resize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      timers.forEach(window.clearInterval);
      window.removeEventListener('resize', resize);
      reducedMotion.removeEventListener('change', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-hero__rain" aria-hidden="true" />;
}
