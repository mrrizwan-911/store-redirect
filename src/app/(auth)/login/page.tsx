'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';
import { useAppDispatch } from '@/store/hooks';
import { setUser, setToken } from '@/store/slices/authSlice';
import AuthLayout from '@/components/store/auth/AuthLayout';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate with Zod
      loginSchema.parse(formData);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Special case: User is not verified
        if (response.status === 403 && result.error.includes('verify')) {
          toast.info('Please verify your email to continue.');
          const url = new URL('/verify-otp', window.location.origin);
          if (result.userId) url.searchParams.set('userId', result.userId);
          url.searchParams.set('email', formData.email);
          router.push(url.pathname + url.search);
          return;
        }
        throw new Error(result.error || 'Invalid credentials');
      }

      // Success! Update Redux state
      dispatch(setUser(result.data.user));
      dispatch(setToken(result.data.accessToken));

      toast.success('Welcome back!');
      router.push('/');
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="WELCOME BACK"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-1.5">
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
            value={formData.email}
            onChange={handleChange}
            className="input-underline w-full h-12 text-[16px] outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <label
              htmlFor="password"
              className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-bold uppercase tracking-widest text-black"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleChange}
              className="input-underline w-full h-12 text-[16px] outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-[#1A1A1A] text-white uppercase tracking-[0.2em] text-[13px] font-bold rounded-[12px] h-[60px] transition-all"
          >
            {isLoading ? 'Processing...' : 'Sign In'}
          </Button>

          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 h-[1px] bg-neutral-100"></span>
            <span className="relative px-4 bg-white text-[10px] uppercase tracking-[0.3em] text-neutral-400">OR</span>
          </div>

          <Button
            onClick={handleGoogleLogin}
            type="button"
            variant="outline"
            className="w-full border-neutral-200 hover:bg-neutral-50 text-black uppercase tracking-[0.2em] text-[13px] font-bold rounded-[12px] h-[60px] transition-all flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-[16px] text-neutral-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-black font-bold ml-1">
            Create Account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
