'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import AuthLayout from '@/components/store/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'ADMIN' ? '/admin' : '/account';
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app:
      // await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

      setIsSubmitted(true);
      toast.success('Reset link sent to your email.');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check Inbox" subtitle="LINK SENT">
        <div className="text-center space-y-6">
          <p className="text-[15px] text-neutral-500 leading-relaxed">
            We've sent a password reset link to <br />
            <span className="text-black font-bold">{email}</span>. <br />
            Please check your spam folder if you don't see it.
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full border-neutral-200 hover:bg-neutral-50 text-black uppercase tracking-[0.2em] text-[13px] font-bold rounded-[12px] h-[60px] transition-all"
          >
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Recover" subtitle="RESET PASSWORD">
      <div className="text-center mb-6">
        <p className="text-[13px] text-neutral-500 uppercase tracking-widest leading-relaxed">
          Enter your email address and we'll <br />
          send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-0.5">
          <label
            htmlFor="email"
            className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-underline w-full h-10 text-[16px] outline-none"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black hover:bg-[#1A1A1A] text-white uppercase tracking-[0.2em] text-[13px] font-bold rounded-[12px] h-[60px] transition-all"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-[16px] text-neutral-500">
          Remember your password?{' '}
          <Link href="/login" className="text-black font-bold ml-1">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
