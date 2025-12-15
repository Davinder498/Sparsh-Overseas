
import React from 'react';
import { ArrowLeft, Wrench } from 'lucide-react';

interface Props {
  serviceTitle: string;
  onBack: () => void;
}

export default function ServiceUnavailablePage({ serviceTitle, onBack }: Props) {
  return (
    <div className="text-center py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-4">
        <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Service Under Construction</h2>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
        The "{serviceTitle}" feature is currently in development.
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
        We are working hard to bring this service to you soon. Thank you for your patience.
      </p>
      <div className="mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </button>
      </div>
    </div>
  );
}
