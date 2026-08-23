import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  colorLight: string;
  colorDark: string;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export const PublicHomepageBackground: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isDark = document.documentElement.classList.contains('dark');

    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Aesthetic Monochromatic Palette (Navy Slate & Refined Gold Accents)
    const particleCount = Math.min(Math.floor(window.innerWidth / 22), 50);
    const particles: Particle[] = [];

    // Cohesive, professional color tones
    const lightPalette = [
      { color: '#1e40af', weight: 0.5 }, // Slate Navy Blue
      { color: '#2563eb', weight: 0.3 }, // Royal Indigo
      { color: '#d97706', weight: 0.2 }, // Subtle Warm Gold Accent
    ];

    const darkPalette = [
      { color: '#38bdf8', weight: 0.5 }, // Soft Sky Blue
      { color: '#60a5fa', weight: 0.3 }, // Light Indigo
      { color: '#fbbf24', weight: 0.2 }, // Soft Gold Accent
    ];

    const getColor = (palette: typeof lightPalette) => {
      const rand = Math.random();
      let cum = 0;
      for (const item of palette) {
        cum += item.weight;
        if (rand <= cum) return item.color;
      }
      return palette[0].color;
    };

    for (let i = 0; i < particleCount; i++) {
      const vx = (Math.random() - 0.5) * 0.35; // Gentle slow floating
      const vy = (Math.random() - 0.5) * 0.35;

      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2 + 1.2,
        vx,
        vy,
        colorLight: getColor(lightPalette),
        colorDark: getColor(darkPalette),
        baseAlpha: Math.random() * 0.25 + 0.2, // Subtle alpha (0.2 - 0.45)
        alpha: 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    let lastRenderTime = 0;
    let isVisible = true;

    const canvasObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.01 });
    canvasObserver.observe(canvas);

    const render = (timestamp: number) => {
      animId = requestAnimationFrame(render);
      if (!isVisible || document.hidden) return;

      // Throttle to max ~30 FPS for optimal performance
      if (timestamp - lastRenderTime < 32) return;
      lastRenderTime = timestamp;

      time += 0.02;
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Render Soft Ambient Gradient Background Sheen
      if (!isDark) {
        // Light mode: subtle warm gold & indigo ambient gradients in top corners
        const grad1 = ctx.createRadialGradient(
          width * 0.2 + Math.sin(time * 0.5) * 40,
          height * 0.2 + Math.cos(time * 0.3) * 40,
          10,
          width * 0.2,
          height * 0.2,
          width * 0.45
        );
        grad1.addColorStop(0, 'rgba(37, 99, 235, 0.035)');
        grad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        const grad2 = ctx.createRadialGradient(
          width * 0.8 + Math.cos(time * 0.4) * 40,
          height * 0.7 + Math.sin(time * 0.6) * 40,
          10,
          width * 0.8,
          height * 0.7,
          width * 0.5
        );
        grad2.addColorStop(0, 'rgba(217, 119, 6, 0.025)');
        grad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Dark mode: soft deep cyan & royal blue ambient glows
        const grad1 = ctx.createRadialGradient(
          width * 0.25,
          height * 0.2,
          10,
          width * 0.25,
          height * 0.2,
          width * 0.5
        );
        grad1.addColorStop(0, 'rgba(56, 189, 248, 0.04)');
        grad1.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);
      }

      // Render Floating Aesthetic Nodes and Connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Smooth pulse
        p.pulsePhase += p.pulseSpeed;
        p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.1;

        // Gentle interactive mouse deflection
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.x -= (dx / dist) * force * 1.2;
          p.y -= (dy / dist) * force * 1.2;
        }

        // Float particle
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around borders smoothly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const color = isDark ? p.colorDark : p.colorLight;

        // Node fill
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0.05, p.alpha);
        ctx.shadowColor = color;
        ctx.shadowBlur = isDark ? 6 : 3;
        ctx.fill();
        ctx.restore();

        // Delicate Hairline Constellation Mesh
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const lx = p.x - p2.x;
          const ly = p.y - p2.y;
          const ldist = Math.sqrt(lx * lx + ly * ly);
          const connectDist = 140;

          if (ldist < connectDist) {
            const lineAlpha = (1 - ldist / connectDist) * (isDark ? 0.15 : 0.12);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark ? '#38bdf8' : '#3b82f6';
            ctx.globalAlpha = Math.max(0, lineAlpha);
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animId);
      canvasObserver.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      aria-hidden="true"
    />
  );
});

export default PublicHomepageBackground;
