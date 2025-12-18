
import React from 'react';
import { ArrowLeft, Wrench } from 'lucide-react';

interface Props {
  serviceTitle: string;
  onBack: () => void;
}

export default function ServiceUnavailablePage({ serviceTitle, onBack }: Props) {
  return (
    <div className="text-center py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 max-w-2xl mx-auto">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
        <Wrench className="h-10 w-10 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Service Under Construction</h2>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        The <span className="font-bold text-primary dark:text-accent">"{serviceTitle}"</span> feature is currently being finalized for high-security digital deployment.
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
        We expect to launch this service in the next update. Thank you for your service and patience.
      </p>
      <div className="mt-10">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-sm font-bold rounded-md text-white bg-primary hover:bg-primary-dark shadow-md transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
