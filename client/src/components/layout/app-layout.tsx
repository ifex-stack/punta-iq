import React from 'react';
import { useLocation } from 'wouter';
import BottomNavigation from './bottom-navigation';
import TopBar from './top-bar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  // Determine active page for bottom navigation
  const getActivePage = () => {
    if (location === '/') return 'home';
    if (location === '/predictions' || location === '/stats') return 'predictions_stats';
    if (location === '/livescore') return 'livescore';
    if (location === '/profile') return 'profile';
    if (location === '/admin') return 'admin';
    
    // Handle secondary pages under main sections
    if (location.startsWith('/predictions/')) return 'predictions_stats';
    if (location.includes('/accumulators')) return 'predictions_stats';
    if (location.includes('/advanced-analysis')) return 'predictions_stats';
    
    return 'home';
  };
  
  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopBar />
      <main className="flex-1">
        {children}
      </main>
      <BottomNavigation activePage={getActivePage() as any} />
    </div>
  );
}