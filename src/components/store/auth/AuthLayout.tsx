import React from 'react';
import Link from 'next/link';

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
    <main className="h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center bg-white text-black px-6 md:px-0">
      {/* Content Wrapper with bottom padding to ensure 10% empty space at the bottom */}
      <div className="w-full max-w-[380px] flex flex-col items-center pb-[12vh]">
        {/* Logo */}
        <Link href="/" className="mb-12 group">
          <span className="font-display text-2xl font-bold tracking-[0.3em] uppercase transition-all group-hover:tracking-[0.4em]">
            STORE
          </span>
        </Link>

        {(title || subtitle) && (
          <div className="text-center mb-10 space-y-2">
            {subtitle && (
              <p className="text-neutral-500 text-[11px] font-bold tracking-[0.3em] uppercase">
                {subtitle}
              </p>
            )}
            {title && (
              <h1 className="text-[44px] font-display font-medium tracking-tight leading-none text-black">
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
  );
};

export default AuthLayout;
