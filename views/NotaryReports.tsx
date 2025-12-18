
import React, { useState } from 'react';
import { DownloadCloud, Loader2, FileSpreadsheet } from 'lucide-react';
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
        notifier.addToast('No completed applications found.', 'info');
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
      link.setAttribute('download', `sparsh_attestation_log_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notifier.addToast('Report downloaded successfully.', 'success');

    } catch (error) {
      notifier.addToast('Failed to generate report.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700 bg-primary-soft/50 dark:bg-stone-900/50">
        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FileSpreadsheet className="w-5 h-5 mr-2 text-primary dark:text-accent" />
          Audit & Compliance Reports
        </h3>
        <p className="mt-1 max-w-2xl text-xs text-gray-500 dark:text-gray-400">
          Export your attestation history for official record-keeping.
        </p>
      </div>
      <div className="p-10 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary-soft dark:bg-primary/20 mb-6">
            <DownloadCloud className="h-10 w-10 text-primary dark:text-accent" />
        </div>
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attestation Activity Log</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-sm mx-auto">
          Generate a secure CSV export of all applications you have attested or rejected in the current calendar year.
        </p>
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-sm font-bold rounded-md text-white bg-primary hover:bg-primary-dark shadow-md transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Generating Report...
            </>
          ) : (
            <>
              <DownloadCloud className="h-5 w-5 mr-2" />
              Download CSV Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotaryReports;
