'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AuthLayout from '@/components/store/auth/AuthLayout';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app:
      // await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ password: formData.password }),
      // });

      toast.success('Password updated successfully!');
      router.push('/login');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Update" subtitle="NEW PASSWORD">
      <div className="text-center mb-8">
        <p className="text-[13px] text-neutral-500 uppercase tracking-widest leading-relaxed">
          Create a strong password to <br />
          secure your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <Label
            htmlFor="password"
            className="text-[11px] uppercase tracking-[0.3em] font-medium text-black"
          >
            New Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            value={formData.password}
            onChange={handleChange}
            className="input-underline h-12"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="confirmPassword"
            className="text-[11px] uppercase tracking-[0.3em] font-medium text-black"
          >
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-underline h-12"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black hover:bg-[#1A1A1A] text-white uppercase tracking-[0.2em] font-bold rounded-[12px] h-[60px] transition-all pt-1"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-[16px] text-neutral-500 whitespace-nowrap">
          Back to{' '}
          <Link href="/login" className="text-black font-bold hover:underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
