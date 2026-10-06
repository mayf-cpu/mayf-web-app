import React from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface SharedLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FB] text-[#191C1E]">
      <Header />
      <main className="flex-1 w-full max-w-[1140px] mx-auto px-4 sm:px-6 py-6 md:py-8">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <MobileNav />
    </div>
  );
};
