import React from 'react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';

export function LegalFooter() {
  return (
    <footer className="w-full py-4 mt-auto text-center text-sm text-muted-foreground">
      <div className="container">
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <Link href="/legal/terms-of-service">
            <a className="hover:text-foreground transition-colors">Terms of Service</a>
          </Link>
          <Separator orientation="vertical" className="h-4 my-auto" />
          <Link href="/legal/privacy-policy">
            <a className="hover:text-foreground transition-colors">Privacy Policy</a>
          </Link>
          <Separator orientation="vertical" className="h-4 my-auto" />
          <Link href="/legal/responsible-gambling">
            <a className="hover:text-foreground transition-colors">Responsible Gambling</a>
          </Link>
        </div>
        <p className="text-xs">
          &copy; {new Date().getFullYear()} PuntaIQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}