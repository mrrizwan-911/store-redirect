import React from 'react';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { Navbar } from '@/components/store/Navbar';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * AuthLayout Component
 *
 * A specialized layout for authentication pages following the "Minimalist Editorial" style.
 * Designed for 100% viewport fit with PWA compliance and zero overflow.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-white">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-1 w-full flex flex-col items-center justify-center text-black px-6 md:px-0 py-4 lg:py-8">
        {/* Content Wrapper */}
        <div className="w-full max-w-[380px] flex flex-col items-center pb-[5vh]">
          {(title || subtitle) && (
            <div className="text-center mb-10 space-y-4">
              {subtitle && (
                <p className="text-neutral-500 text-[11px] font-bold tracking-[0.3em] uppercase">
                  {subtitle}
                </p>
              )}
              {title && (
                <h1 className="text-[38px] font-display font-medium tracking-tight leading-none text-black">
                  {title}
                </h1>
              )}
            </div>
          )}

          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
