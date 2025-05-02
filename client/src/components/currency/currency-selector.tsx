import React from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronDownIcon, DollarSign } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { Currency } from '@/lib/currency-service';

interface CurrencySelectorProps {
  variant?: "default" | "outline" | "ghost";
  showLabel?: boolean;
}

export function CurrencySelector({ 
  variant = "outline",
  showLabel = true
}: CurrencySelectorProps) {
  const { currency, availableCurrencies, changeCurrency } = useCurrency();

  // Handle currency selection
  const handleSelect = (currencyCode: string) => {
    changeCurrency(currencyCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1 h-9 px-3">
          <span className="mr-1">{currency.flag}</span>
          {showLabel ? (
            <span>{currency.code}</span>
          ) : null}
          <ChevronDownIcon className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {availableCurrencies.map((curr: Currency) => (
            <DropdownMenuItem
              key={curr.code}
              className="cursor-pointer"
              onClick={() => handleSelect(curr.code)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <span className="mr-2">{curr.flag}</span>
                  <span>{curr.name}</span>
                </div>
                {curr.code === currency.code && (
                  <CheckIcon className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// A simpler version showing just the currency symbol
export function CurrencyBadge() {
  const { currency } = useCurrency();
  
  return (
    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
      {currency.flag} {currency.code}
    </div>
  );
}

// Format price with currency 
export function PriceDisplay({ 
  amount, 
  className = "" 
}: { 
  amount: number, 
  className?: string 
}) {
  const { format } = useCurrency();
  
  return (
    <span className={`font-medium ${className}`}>
      {format(amount)}
    </span>
  );
}