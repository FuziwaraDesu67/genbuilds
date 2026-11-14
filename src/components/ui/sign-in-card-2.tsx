'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'w-full bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export interface SignInCard2Props {
  brandName?: string;
  brandTagline?: string;
  logoText?: string;
  onLogin?: (credentials: { email: string; password: string; rememberMe: boolean }) => Promise<void> | void;
  onGoogleSignIn?: () => void;
  onDiscordSignIn?: () => void;
  errorMessage?: string | null;
  className?: string;
}

export function Component({
  brandName = 'Genbuilds',
  brandTagline = 'Sign in to save builds, watchlists & verify in-game UID',
  logoText = 'G',
  onLogin,
  onGoogleSignIn,
  onDiscordSignIn,
  errorMessage,
  className,
}: SignInCard2Props = {}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // 3D Tilt Physics with Spring Damping
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 280, mass: 0.6 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Responsive tilt angles (+/- 14 degrees)
  const rotateX = useTransform(smoothMouseY, [-250, 250], [14, -14]);
  const rotateY = useTransform(smoothMouseX, [-250, 250], [-14, 14]);

  // Subtle specular reflection highlights following cursor
  const glareOpacity = useTransform(smoothMouseX, [-250, 0, 250], [0.15, 0.05, 0.15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (onLogin) {
        await onLogin({ email, password, rememberMe });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('traveler@genshin.gg');
    setPassword('genshin123');
  };

  return (
    <div
      className={cn(
        'min-h-screen w-full bg-[#080b11] relative overflow-hidden flex items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-200',
        className
      )}
    >
      {/* Subtle calm radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(16, 185, 129, 0.07), rgba(8, 11, 17, 0.98) 75%)',
        }}
      />

      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 3D Perspective Viewport */}
      <div
        className="w-full max-w-[400px] relative z-10"
        style={{ perspective: 1200 }}
      >
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative rounded-2xl bg-[#0d121c]/95 border border-white/[0.09] shadow-[0_30px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl p-7 md:p-8 transition-shadow duration-300 hover:shadow-[0_35px_80px_rgba(0,0,0,0.85)]"
        >
          {/* Dynamic Glare Reflection Overlay */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
            style={{
              opacity: glareOpacity,
              background:
                'radial-gradient(circle 300px at 50% 30%, rgba(255, 255, 255, 0.25), transparent 70%)',
            }}
          />

          {/* Header & Logo with 3D Depth */}
          <div
            className="flex flex-col items-center text-center mb-6"
            style={{ transform: 'translateZ(35px)' }}
          >
            <div className="relative mb-3.5">
              <img
                src="/logo-icon-transparent.png"
                alt="GenBuilds Emblem"
                className="w-14 h-14 object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                width={56}
                height={56}
              />
            </div>

            <h1 className="text-xl font-black tracking-tight text-white">
              <span className="text-emerald-400">Gen</span>
              <span>Builds</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
              {brandTagline}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="mb-4.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-center leading-snug"
              style={{ transform: 'translateZ(20px)' }}
            >
              {errorMessage}
            </div>
          )}

          {/* 1-Click Discord OAuth with 3D Depth */}
          <div
            className="space-y-3 mb-5"
            style={{ transform: 'translateZ(25px)' }}
          >
            <a
              href="/api/auth/discord"
              onClick={onDiscordSignIn}
              className="w-full h-10 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Continue with Discord</span>
            </a>

            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <span className="relative px-3 bg-[#0d121c] text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                or with email
              </span>
            </div>
          </div>

          {/* Form with 3D Depth */}
          <form
            onSubmit={handleSubmit}
            className="space-y-3.5"
            style={{ transform: 'translateZ(20px)' }}
          >
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">
                Email or Username
              </label>
              <div
                className={cn(
                  'flex items-center h-10 px-3 rounded-xl bg-white/[0.03] border transition-colors',
                  focusedInput === 'email'
                    ? 'border-emerald-500/70 ring-1 ring-emerald-500/20'
                    : 'border-white/[0.08] hover:border-white/15'
                )}
              >
                <Mail className="w-4 h-4 text-zinc-500 shrink-0 mr-2.5" />
                <Input
                  type="text"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                >
                  Quick Demo Fill
                </button>
              </div>
              <div
                className={cn(
                  'flex items-center h-10 px-3 rounded-xl bg-white/[0.03] border transition-colors',
                  focusedInput === 'password'
                    ? 'border-emerald-500/70 ring-1 ring-emerald-500/20'
                    : 'border-white/[0.08] hover:border-white/15'
                )}
              >
                <Lock className="w-4 h-4 text-zinc-500 shrink-0 mr-2.5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeClosed className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0 focus:outline-none accent-emerald-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/"
                className="text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Back to Home
              </Link>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer with 3D Depth */}
          <div
            className="mt-5 pt-4 border-t border-white/[0.06] text-center text-xs text-zinc-500"
            style={{ transform: 'translateZ(15px)' }}
          >
            No account required to browse builds.{' '}
            <Link
              href="/"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Search by UID &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Component;
