import React, { useEffect, useRef } from 'react';

export const AsciiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = ['·', ':', '~', '+', '*', '%', '=', '¬', '°'];
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    const fontSize = 16;
    let grid: Array<{ char: string; opacity: number; speed: number }> = [];
    let animationFrameId: number;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      columns = Math.floor(width / fontSize);
      rows = Math.floor(height / fontSize);
      grid = [];
      for (let i = 0; i < columns * rows; i++) {
        grid.push({
          char: chars[Math.floor(Math.random() * chars.length)],
          opacity: Math.random() * 0.12 + 0.04,
          speed: (Math.random() - 0.5) * 0.003,
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    let lastFrameTime = 0;
    const targetFps = 20;
    const frameInterval = 1000 / targetFps;

    const draw = (now: number) => {
      animationFrameId = requestAnimationFrame(draw);

      if (document.hidden) return;
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      // En móviles desactivar el repintado continuo pesado para dejar el procesador 100% libre para la interacción
      if (window.innerWidth < 640) return;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;

      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < columns; c += 2) {
          const idx = r * columns + c;
          const item = grid[idx];
          if (!item) continue;

          item.opacity += item.speed;
          if (item.opacity > 0.18 || item.opacity < 0.03) {
            item.speed = -item.speed;
          }

          ctx.fillStyle = `rgba(221, 184, 255, ${item.opacity})`;
          ctx.fillText(item.char, c * fontSize, r * fontSize);
        }
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -top-16 w-full h-full opacity-60 z-0"
    />
  );
};
