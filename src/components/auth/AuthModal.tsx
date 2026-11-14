'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { X, Sparkles, Shield, User, Lock, ArrowRight, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthModal() {
  const { isModalOpen, closeModal, login, register } = useAuth();
  const [tab, setTab] = useState<'quick' | 'signin' | 'signup'>('quick');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkedUid, setLinkedUid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'quick') {
        if (!username.trim() && !linkedUid.trim()) {
          setError('Please enter a display name or in-game UID');
          setLoading(false);
          return;
        }
        const identifier = username.trim() || `Player_${linkedUid.trim()}`;
        const res = await login({
          identifier,
          isQuickLogin: true,
          linkedUid: linkedUid.trim() || undefined,
        });
        if (!res.success) setError(res.error || 'Quick login failed');
      } else if (tab === 'signin') {
        if (!username.trim() || !password) {
          setError('Please enter your username and password');
          setLoading(false);
          return;
        }
        const res = await login({ identifier: username.trim(), password });
        if (!res.success) setError(res.error || 'Invalid credentials');
      } else {
        if (!username.trim() || !password) {
          setError('Username and password are required');
          setLoading(false);
          return;
        }
        const res = await register({
          username: username.trim(),
          email: email.trim() || undefined,
          password,
          linkedUid: linkedUid.trim() || undefined,
        });
        if (!res.success) setError(res.error || 'Registration failed');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background Dim Backdrop */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* 3D Perspective Container */}
      <div className="relative z-10 w-full max-w-md" style={{ perspective: 1200 }}>
        {/* 3D Modal Card */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 shadow-2xl p-6 overflow-hidden transition-shadow duration-300 hover:shadow-cyan-500/10"
        >
          {/* Specular glare following cursor */}
          <motion.div
            className="pointer-events-none absolute -inset-full rounded-full bg-gradient-to-tr from-cyan-400/10 via-emerald-400/10 to-transparent blur-2xl"
            style={{
              x: smoothMouseX,
              y: smoothMouseY,
            }}
          />

          {/* Glow ambient background accent */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition z-20"
            style={{ transform: 'translateZ(30px)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5" style={{ transform: 'translateZ(30px)' }}>
            <img
              src="/logo-icon-transparent.png"
              alt="GenBuilds"
              className="w-11 h-11 object-contain drop-shadow-[0_0_14px_rgba(16,185,129,0.45)]"
            />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                <span className="text-emerald-400">Gen</span>
                <span>Builds</span> Account
              </h3>
              <p className="text-xs text-zinc-400">Save builds, watchlists & verify in-game UID</p>
            </div>
          </div>

        {/* Discord Free 1-Click Login */}
        <div className="mb-4" style={{ transform: 'translateZ(25px)' }}>
          <a
            href="/api/auth/discord"
            className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Continue with Discord</span>
          </a>
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-zinc-500">
              <span className="bg-slate-900 px-2">or with username & UID</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-950/60 p-1 border border-white/5 mb-5 text-xs font-semibold" style={{ transform: 'translateZ(20px)' }}>
          <button
            type="button"
            onClick={() => { setTab('quick'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5",
              tab === 'quick' ? "bg-cyan-500 text-slate-950 font-bold shadow" : "text-zinc-400 hover:text-white"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-lg transition",
              tab === 'signin' ? "bg-white/15 text-white font-bold shadow" : "text-zinc-400 hover:text-white"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-lg transition",
              tab === 'signup' ? "bg-white/15 text-white font-bold shadow" : "text-zinc-400 hover:text-white"
            )}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5" style={{ transform: 'translateZ(18px)' }}>
          {tab === 'quick' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Your In-Game UID <span className="text-zinc-500">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={linkedUid}
                    onChange={(e) => setLinkedUid(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 800000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                  <Shield className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Nickname or Handle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. FrostyAnirudh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                  <User className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-200 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Instant access without passwords. Links your UID and saves your favorite builds locally & in the cloud!</span>
              </div>
            </>
          )}

          {tab === 'signin' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </>
          )}

          {tab === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Email <span className="text-zinc-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  In-Game UID <span className="text-zinc-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={linkedUid}
                  onChange={(e) => setLinkedUid(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 800000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ transform: 'translateZ(28px)' }}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
            ) : (
              <>
                <span>{tab === 'quick' ? 'Continue with Instant Access' : tab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-4 text-center text-[11px] text-zinc-500" style={{ transform: 'translateZ(10px)' }}>
          No HoYoverse password required. We only read public showcase data via Enka API.
        </p>
        </motion.div>
      </div>
    </div>
  );
}
