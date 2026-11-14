'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Component as SignInCard2 } from '@/components/ui/sign-in-card-2';
import { useAuth } from '@/lib/auth/context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setError(null);
    const res = await login({ identifier: email, password });
    if (!res.success) {
      setError(res.error || 'Invalid credentials. Please try again.');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-black">
      <SignInCard2
        brandName="Genbuilds"
        brandTagline="Sign in to save builds, watchlists & verify in-game UID"
        logoText="G"
        onLogin={handleLogin}
        errorMessage={error}
      />
    </div>
  );
}
