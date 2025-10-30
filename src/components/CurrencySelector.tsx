import React from 'react';
import { DollarSign } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface CurrencySelectorProps {
  className?: string;
  showLabel?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  className = '',
  showLabel = true,
}) => {
  const { currency, config, setCurrency, availableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrency(currencyCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-all text-gray-200 w-full"
        aria-label="Select Currency"
      >
        <span className="text-sm font-medium">{config.symbol}</span>
        {showLabel && (
          <>
            <span className="flex-1 text-left text-sm">
              {config.name || currency}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown - positioned upward and narrower for sidebar */}
          <div className="absolute bottom-full mb-2 left-0 right-0 w-full min-w-[200px] bg-dark-800 rounded-lg shadow-xl border border-dark-700 z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Select Currency
              </div>
              
              {/* Popular Currencies */}
              <div className="mb-2">
                <div className="px-3 py-1 text-xs text-gray-500">Popular</div>
                {['ZAR', 'USD', 'EUR', 'GBP'].map((code) => {
                  const curr = availableCurrencies.find(c => c.code === code);
                  if (!curr) return null;
                  
                  return (
                    <button
                      key={code}
                      onClick={() => handleCurrencyChange(code)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm transition-all ${
                        currency === code
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">
                          <span className="font-medium">{curr.symbol} {curr.code}</span>
                          <span className="text-gray-400 ml-1 text-xs">{curr.name}</span>
                        </span>
                        {currency === code && (
                          <span className="text-primary-300 flex-shrink-0">✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* All Currencies */}
              <div>
                <div className="px-3 py-1 text-xs text-gray-500">All Currencies</div>
                {availableCurrencies
                  .filter(c => !['ZAR', 'USD', 'EUR', 'GBP'].includes(c.code))
                  .map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm transition-all ${
                        currency === curr.code
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">
                          <span className="font-medium">{curr.symbol} {curr.code}</span>
                          <span className="text-gray-400 ml-1 text-xs">{curr.name}</span>
                        </span>
                        {currency === curr.code && (
                          <span className="text-primary-300 flex-shrink-0">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;