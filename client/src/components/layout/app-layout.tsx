import React from 'react';
import { useLocation } from 'wouter';
import BottomNavigation from './bottom-navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  // Determine active page for bottom navigation
  const getActivePage = () => {
    if (location === '/') return 'predictions';
    if (location === '/stats') return 'stats';
    if (location.startsWith('/fantasy')) return 'fantasy';
    if (location === '/subscription') return 'subscription';
    if (location === '/profile') return 'profile';
    if (location === '/admin') return 'admin';
    return 'predictions';
  };
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      <main className="flex-1">
        {children}
      </main>
      <BottomNavigation activePage={getActivePage() as any} />
    </div>
  );
}