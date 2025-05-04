import React from 'react';
import { useLocation } from 'wouter';
import BottomNavigation from './bottom-navigation';
import TopBar from './top-bar';
import { LegalFooter } from './legal-footer';

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
  
  // Don't show bottom nav on legal pages
  const isLegalPage = location.startsWith('/legal/');
  
  return (
    <div className="flex flex-col min-h-screen">
      {!isLegalPage && <TopBar />}
      <main className="flex-1">
        {children}
      </main>
      <LegalFooter />
      {!isLegalPage && <div className="pb-16" />}
      {!isLegalPage && <BottomNavigation activePage={getActivePage() as any} />}
    </div>
  );
}