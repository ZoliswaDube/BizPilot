import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, LogOut, RefreshCw, X } from 'lucide-react';
import { Button } from './ui/button';

interface InactivityWarningModalProps {
  isOpen: boolean;
  timeRemaining: number; // in milliseconds
  onExtendSession: () => void;
  onLogout: () => void;
}

export function InactivityWarningModal({
  isOpen,
  timeRemaining,
  onExtendSession,
  onLogout,
}: InactivityWarningModalProps) {
  const [countdown, setCountdown] = useState(Math.ceil(timeRemaining / 1000));

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil(timeRemaining / 1000);
      setCountdown(remaining);
      
      if (remaining <= 0) {
        onLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining, onLogout]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-dark-900 rounded-xl shadow-2xl border border-yellow-200 dark:border-yellow-800/50 p-6">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Session Expiring Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              You've been inactive for a while. Your session will expire in:
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-mono text-xl font-bold text-yellow-800 dark:text-yellow-200">
              {formatTime(countdown)}
            </span>
          </div>

          {/* Security Message */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              For your security, we automatically log you out after 3 hours of inactivity.
              Click "Stay Signed In" to continue your session.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="secondary"
              onClick={onLogout}
              className="flex items-center justify-center space-x-2 flex-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Now</span>
            </Button>
            
            <Button
              variant="default"
              onClick={onExtendSession}
              className="flex items-center justify-center space-x-2 flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Stay Signed In</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InactivityWarningModal;
