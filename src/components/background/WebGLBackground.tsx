'use client';

import { useEffect, useRef, useState } from 'react';
import { ELEMENT_COLORS } from '@/lib/enka/static-data';
import { useBackground } from './BackgroundContext';

export default function WebGLBackground() {
  const { element } = useBackground();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setIsSupported(false);
      return;
    }

    // Get element colors or default
    const colors = element ? ELEMENT_COLORS[element] : {
      primary: '#1A237E',
      secondary: '#0D47A1',
    };

    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
          ]
        : [0, 0, 0];
    };

    const colorA = hexToRgb(colors.primary);
    const colorB = hexToRgb(colors.secondary);

    // Simplified fluid simulation using canvas 2D
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let time = 0;

    // Particle system for fluid effect
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }> = [];

    const maxParticles = 100;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        life: Math.random(),
      });
    }

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = e.clientY / window.innerHeight;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetMouseX = e.touches[0].clientX / window.innerWidth;
        targetMouseY = e.touches[0].clientY / window.innerHeight;
      }
    };

    const animate = () => {
      time += 0.016;

      // Smooth mouse position
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Clear with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `rgba(${colorA[0] * 255}, ${colorA[1] * 255}, ${colorA[2] * 255}, 0.05)`);
      gradient.addColorStop(1, `rgba(${colorB[0] * 255}, ${colorB[1] * 255}, ${colorB[2] * 255}, 0.05)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      ctx.globalCompositeOperation = 'screen';

      particles.forEach((p) => {
        // Curl noise influence
        const curl = Math.sin(p.x * 3 + time * 0.5) * 0.001;
        p.vx += curl;
        p.vy += Math.cos(p.y * 3 + time * 0.5) * 0.001;

        // Mouse influence
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.3) {
          const force = (0.3 - dist) * 0.0001;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        // Draw
        const size = 30 + Math.sin(time + p.life * Math.PI * 2) * 10;
        const alpha = 0.1 + Math.sin(time * 0.5 + p.life * Math.PI) * 0.05;

        const grad = ctx.createRadialGradient(
          p.x * canvas.width,
          p.y * canvas.height,
          0,
          p.x * canvas.width,
          p.y * canvas.height,
          size
        );

        grad.addColorStop(0, `rgba(${colorA[0] * 255}, ${colorA[1] * 255}, ${colorA[2] * 255}, ${alpha})`);
        grad.addColorStop(1, `rgba(${colorB[0] * 255}, ${colorB[1] * 255}, ${colorB[2] * 255}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';

      animationId = requestAnimationFrame(animate);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Start animation
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [element, prefersReducedMotion]);

  if (prefersReducedMotion) {
    // Static gradient fallback
    const colors = element ? ELEMENT_COLORS[element] : {
      primary: '#1A237E',
      secondary: '#0D47A1',
    };

    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        }}
      />
    );
  }

  if (!isSupported) {
    // CSS gradient fallback
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-900 to-slate-900" />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
}
