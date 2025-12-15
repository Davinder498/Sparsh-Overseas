import React, { useState } from 'react';
import { DownloadCloud, Loader2 } from 'lucide-react';
import { useNotifier } from '../contexts/NotificationContext';
import { getApplicationsForReport } from '../services/firebaseBackend';
import { User } from '../types';

interface Props {
  user: User;
}

const NotaryReports: React.FC<Props> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const notifier = useNotifier();

  const handleDownload = async () => {
    setIsLoading(true);
    notifier.addToast('Generating report...', 'info');

    try {
      const reportData = await getApplicationsForReport(user.id);
      
      if (reportData.length === 0) {
        notifier.addToast('No completed applications found to generate a report.', 'info');
        setIsLoading(false);
        return;
      }

      const headers = ['Application ID', 'Pensioner Name', 'Final Status', 'Processing Date', 'Rejection Reason'];
      const csvContent = [
        headers.join(','),
        ...reportData.map(app => {
          const pensionerName = `"${app.pensionerName.replace(/"/g, '""')}"`;
          const rejectionReason = `"${(app.rejectionReason || '').replace(/"/g, '""')}"`;
          const processingDate = app.attestationDate ? new Date(app.attestationDate).toISOString().split('T')[0] : 'N/A';
          
          return [
            app.id,
            pensionerName,
            app.status,
            processingDate,
            rejectionReason
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attestation_log_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notifier.addToast('Report download started.', 'success');

    } catch (error) {
      notifier.addToast('Failed to generate report.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700">
      <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
          Download Reports
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Export your attestation and rejection history for record-keeping.
        </p>
      </div>
      <div className="p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
            <DownloadCloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Attestation Activity Log</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
          Download a CSV file containing all applications you have processed.
        </p>
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Generating...
            </>
          ) : (
            <>
              <DownloadCloud className="h-5 w-5 mr-2" />
              Download CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotaryReports;
