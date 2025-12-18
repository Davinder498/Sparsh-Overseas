
import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent !== 'true') {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-2xl border-2 border-primary/20 dark:border-stone-700 sm:p-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-primary-soft dark:bg-primary/20">
                <ShieldAlert className="h-6 w-6 text-primary dark:text-accent" />
              </span>
              <p className="ml-3 font-medium text-gray-900 dark:text-gray-100 text-sm">
                <span>We use essential cookies for security and session management. By continuing, you agree to our policies.</span>
              </p>
            </div>
            <div className="order-3 mt-4 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={handleAccept}
                className="flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Accept & Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
