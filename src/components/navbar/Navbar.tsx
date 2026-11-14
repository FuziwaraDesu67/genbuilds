'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
  Sparkles,
  Search,
  User as UserIcon,
  LogOut,
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Shield,
  Copy,
  Check,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const router = useRouter();
  const { user, favorites, logout, openModal, verifySignature, isModalOpen } = useAuth();

  const [searchUid, setSearchUid] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchUid.replace(/\D/g, '').trim();
    if (clean.length >= 9) {
      router.push(`/u/${clean}`);
      setSearchUid('');
    }
  };

  const handleCopyCode = () => {
    if (user?.verificationCode) {
      navigator.clipboard.writeText(user.verificationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await verifySignature();
      setVerifyMsg(res.message || (res.success ? 'Verified!' : 'Verification failed'));
    } catch {
      setVerifyMsg('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/70 border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo-icon-transparent.png"
              alt="GenBuilds Logo"
              className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform duration-300"
            />
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight group-hover:opacity-90 transition">
                <span className="text-emerald-400">Gen</span>
                <span className="text-white">Builds</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold -mt-1">
                Genshin Impact Builds
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-zinc-400">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition"
            >
              Home
            </Link>
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboards</span>
            </Link>
            {user?.linkedUid && (
              <Link
                href={`/u/${user.linkedUid}`}
                className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition text-cyan-400"
              >
                My Showcase
              </Link>
            )}
            <Link
              href="/u/855842984"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition"
            >
              Demo Profile
            </Link>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-xs relative">
          <input
            type="text"
            value={searchUid}
            onChange={(e) => setSearchUid(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Search UID (e.g. 855842984)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
        </form>

        {/* Right: Auth Profile / Sign In */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-2.5 pr-3 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/10 transition shadow cursor-pointer group"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                  )}
                </div>

                {/* Nickname & Verification */}
                <div className="text-left flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition max-w-[110px] truncate">
                    {user.username}
                  </span>
                  {user.isVerified && (
                    <span title="Verified UID Owner">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>

                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition", isDropdownOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Info Header */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 mb-2">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{user.username}</span>
                      {user.isVerified ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>
                    {user.linkedUid && (
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                        <span>UID: {user.linkedUid}</span>
                      </div>
                    )}
                  </div>

                  {/* Verification Challenge Card (If not verified and has linked UID) */}
                  {user.linkedUid && !user.isVerified && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-2 text-xs">
                      <div className="font-bold text-amber-300 flex items-center justify-between mb-1 text-[11px]">
                        <span>Verify In-Game Ownership</span>
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-tight mb-2">
                        Put this code in your in-game signature for 2 mins:
                      </p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <code className="flex-1 px-2 py-1 bg-black/60 rounded border border-amber-500/40 text-amber-300 font-mono text-center font-bold">
                          {user.verificationCode || 'AK-VERIFY'}
                        </code>
                        <button
                          onClick={handleCopyCode}
                          className="p-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={cn("w-3 h-3", verifying && "animate-spin")} />
                        <span>{verifying ? 'Checking signature...' : 'Verify Now'}</span>
                      </button>
                      {verifyMsg && (
                        <p className="mt-1 text-[10px] text-zinc-300 italic">{verifyMsg}</p>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  <div className="space-y-1 text-xs font-medium">
                    {user.linkedUid && (
                      <Link
                        href={`/u/${user.linkedUid}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View My Showcase</span>
                      </Link>
                    )}

                    {/* Favorites / Watchlist preview */}
                    {favorites && favorites.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <div className="text-[10px] uppercase font-bold text-zinc-400 px-3 mb-1 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>Saved Watchlist</span>
                        </div>
                        {favorites.slice(0, 4).map((fav) => (
                          <Link
                            key={fav.targetUid}
                            href={`/u/${fav.targetUid}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 text-[11px] transition"
                          >
                            <span className="truncate">{fav.targetNickname || fav.targetUid}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{fav.targetUid}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/5">
                      <button
                        onClick={async () => {
                          await logout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition shadow-lg shadow-cyan-500/10 active:scale-95 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
