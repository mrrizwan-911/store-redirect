'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AuthLayout from '@/components/store/auth/AuthLayout';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last char
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last filled or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    if (!userId) {
      toast.error('User ID is missing. Please register again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid or expired OTP');
      }

      toast.success('Email verified successfully!');
      router.push('/login');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    toast.info('Feature coming soon: Resending OTP...');
    // In a real app, call a resend-otp endpoint here
  };

  return (
    <AuthLayout
      title="Verify"
      subtitle="ENTER OTP"
    >
      <div className="text-center mb-8">
        <p className="text-[13px] text-neutral-500 uppercase tracking-widest leading-relaxed">
          We've sent a 6-digit code to <br />
          <span className="text-black font-bold">{email || 'your email'}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="flex justify-between gap-2 md:gap-3" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              value={digit}
              maxLength={1}
              inputMode="numeric"
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-full h-16 border-b-2 border-neutral-100 text-center text-2xl font-display bg-transparent text-black focus:border-black focus:ring-0 outline-none transition-all duration-300"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="space-y-6">
          <Button
            type="submit"
            disabled={isLoading || timeLeft === 0}
            className="w-full bg-black hover:bg-[#1A1A1A] text-white uppercase tracking-[0.2em] font-bold rounded-[12px] h-[60px] transition-all"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <div className="text-center space-y-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">
              Expires in <span className="text-black font-bold font-mono">{formatTime(timeLeft)}</span>
            </p>

            <button
              onClick={handleResend}
              type="button"
              disabled={timeLeft > 540}
              className="text-[11px] uppercase tracking-[0.3em] text-black font-bold underline underline-offset-8 disabled:opacity-20 transition-opacity"
            >
              Resend Code
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center font-body text-sm tracking-widest uppercase text-neutral-400">
        Loading...
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
