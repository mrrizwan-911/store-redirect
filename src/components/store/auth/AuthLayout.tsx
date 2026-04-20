import React from 'react';

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
    <main className="h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center bg-background text-foreground px-6 md:px-0">
      {/* Content Wrapper with bottom padding to ensure 12vh empty space at the bottom */}
      <div className="w-full max-w-md flex flex-col items-center pb-[12vh]">
        {(title || subtitle) && (
          <div className="text-center mb-10 space-y-3">
            {title && (
              <h1 className="text-4xl md:text-5xl font-display tracking-tighter uppercase leading-none">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-text-secondary text-sm md:text-base font-light tracking-widest uppercase">
                {subtitle}
              </p>
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
