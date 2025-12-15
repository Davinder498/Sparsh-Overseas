import React, { useState } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Send } from 'lucide-react';
import SparshSubmissionModal, { SubmissionStatus } from '../components/SparshSubmissionModal';
import { useNotifier } from '../contexts/NotificationContext';

interface Props {
  user: User;
  onBack: () => void;
}

export default function RequestDocumentsForm({ user, onBack }: Props) {
  const [requestedDocs, setRequestedDocs] = useState({
    form16: false,
    ppoCopy: false,
  });

  const [showSparshModal, setShowSparshModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const notifier = useNotifier();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRequestedDocs(prev => ({ ...prev, [name]: checked }));
  };

  const isFormReady = requestedDocs.form16 || requestedDocs.ppoCopy;

  const handleAuthorize = async () => {
    setErrorMessage('');
    try {
        await linkGoogleAccount();
    } catch (error: any) {
        setErrorMessage(error.message || "Failed to authorize.");
        throw error;
    }
  };

  const handleAutoSubmit = async () => {
    if (!isFormReady) return;
    setSubmissionStatus('SENDING');

    const requestedItems = [
      requestedDocs.form16 && "Form-16 / Statement of Accounts",
      requestedDocs.ppoCopy && "Copy of SPARSH PPO"
    ].filter(Boolean).join("\n - ");

    const sparshEmail = "sparshnri.dad@gov.in";
    const subject = `Request for Documents - ${user.name} - SPARSH PPO No ${user.ppoNumber}`;
    const body = `Dear SPARSH Team,

I would like to request the following document(s) for my records. Please provide them at your earliest convenience.

Requested Document(s):
 - ${requestedItems}

--- PENSIONER DETAILS ---
Name: ${user.name}
PPO Number: ${user.ppoNumber}
Service Number: ${user.serviceNumber}
Email: ${user.email}

Thank you for your assistance.

Regards,
${user.name}
(Submitted securely via Sparsh Overseas Digital Portal)`;

    try {
      await sendGmailWithAttachments(sparshEmail, subject, body, []);
      setSubmissionStatus('SUCCESS');
      setTimeout(() => {
        setShowSparshModal(false);
        setSubmissionStatus('IDLE');
        notifier.addToast('Document request sent successfully.', 'success');
        onBack();
      }, 2500);
    } catch (error: any) {
      setSubmissionStatus('ERROR');
      const msg = error.message.toLowerCase();
      if (msg.includes("access token") || msg.includes("401") || msg.includes("403")) {
        setErrorMessage("Authorization failed or expired. Please authorize your Google account again.");
        sessionStorage.removeItem('google_access_token');
      } else {
        setErrorMessage("Failed to send email. Please check your connection and try again.");
      }
    }
  };
  
  const readOnlyClass = "mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 shadow-sm border p-2 bg-gray-100 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 cursor-not-allowed";

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg max-w-2xl mx-auto w-full border dark:border-gray-700">
      <SparshSubmissionModal
        isOpen={showSparshModal}
        onClose={() => setShowSparshModal(false)}
        title="Secure Submission to SPARSH"
        description={<p>This will securely email your request to <strong>sparshnri.dad@gov.in</strong> using your Google account.</p>}
        onAuthorize={handleAuthorize}
        onSubmit={handleAutoSubmit}
        submissionStatus={submissionStatus}
        errorMessage={errorMessage}
      />
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-lg">
         <div className="flex items-center">
            <button onClick={onBack} className="mr-4 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft className="h-5 w-5"/>
            </button>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Request Documents
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); setShowSparshModal(true); }} className="px-4 py-5 sm:p-6 space-y-8">
        
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>Your Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label><input type="text" readOnly value={user.name} className={readOnlyClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PPO Number</label><input type="text" readOnly value={user.ppoNumber} className={readOnlyClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Number</label><input type="text" readOnly value={user.serviceNumber} className={readOnlyClass} /></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>Select Documents to Request</h4>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                        <input id="form16" name="form16" type="checkbox" checked={requestedDocs.form16} onChange={handleCheckboxChange} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="form16" className="font-medium text-gray-700 dark:text-gray-200">Form-16 / Statement of Accounts</label>
                        <p className="text-gray-500 dark:text-gray-400">Request your annual tax deduction statement.</p>
                    </div>
                </div>
                <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                        <input id="ppoCopy" name="ppoCopy" type="checkbox" checked={requestedDocs.ppoCopy} onChange={handleCheckboxChange} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="ppoCopy" className="font-medium text-gray-700 dark:text-gray-200">Copy of SPARSH PPO</label>
                        <p className="text-gray-500 dark:text-gray-400">Request a digital copy of your Pension Payment Order for your records.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-0">
          <button type="button" onClick={onBack} className="w-full sm:w-auto bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mr-3">Cancel</button>
          <button type="submit" disabled={!isFormReady} className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none disabled:opacity-50"><Send className="h-4 w-4 mr-2" />Submit Request to SPARSH</button>
        </div>
      </form>
    </div>
  );
}
