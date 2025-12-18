
import React, { useState } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Send } from 'lucide-react';
import SparshSubmissionModal, { SubmissionStatus } from '../components/SparshSubmissionModal';
import { useNotifier } from '../contexts/NotificationContext';
import { SPARSH_SERVICE_EMAIL } from '../constants';

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
      await sendGmailWithAttachments(SPARSH_SERVICE_EMAIL, subject, body, []);
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
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg max-w-2xl mx-auto w-full border dark:border-gray-700 overflow-hidden">
      <SparshSubmissionModal
        isOpen={showSparshModal}
        onClose={() => setShowSparshModal(false)}
        title="Secure Submission to SPARSH"
        description={<p>This will securely email your request to <strong>{SPARSH_SERVICE_EMAIL}</strong> using your Google account.</p>}
        onAuthorize={handleAuthorize}
        onSubmit={handleAutoSubmit}
        submissionStatus={submissionStatus}
        errorMessage={errorMessage}
      />
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
         <div className="flex items-center">
            <button onClick={onBack} className="mr-4 text-gray-500 hover:text-gray-900 dark:hover:text-white p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft className="h-5 w-5"/>
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Request Documents
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); setShowSparshModal(true); }} className="px-8 py-8 space-y-10 text-left">
        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">01</span>
                Account Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="form-label-standard">Full Name</label><input type="text" readOnly value={user.name} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
                <div><label className="form-label-standard">PPO Number</label><input type="text" readOnly value={user.ppoNumber} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
                <div><label className="form-label-standard">Service Number</label><input type="text" readOnly value={user.serviceNumber} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">02</span>
                Requested Records
            </h4>
            <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6">
                <div className="relative flex items-start group">
                    <div className="flex items-center h-5">
                        <input id="form16" name="form16" type="checkbox" checked={requestedDocs.form16} onChange={handleCheckboxChange} className="h-5 w-5 text-primary border-gray-300 rounded-lg focus:ring-primary" />
                    </div>
                    <div className="ml-4">
                        <label htmlFor="form16" className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors cursor-pointer">Form-16 / Tax Statement</label>
                        <p className="text-xs text-gray-500 mt-0.5">Annual tax deduction summary from the Defence Accounts Department.</p>
                    </div>
                </div>
                <div className="relative flex items-start group">
                    <div className="flex items-center h-5">
                        <input id="ppoCopy" name="ppoCopy" type="checkbox" checked={requestedDocs.ppoCopy} onChange={handleCheckboxChange} className="h-5 w-5 text-primary border-gray-300 rounded-lg focus:ring-primary" />
                    </div>
                    <div className="ml-4">
                        <label htmlFor="ppoCopy" className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors cursor-pointer">Official PPO Copy</label>
                        <p className="text-xs text-gray-500 mt-0.5">A certified digital copy of your Pension Payment Order.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center space-x-4">
          <button type="button" onClick={onBack} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all">Cancel</button>
          <button type="submit" disabled={!isFormReady} className="btn-primary-standard px-10"><Send className="h-4 w-4 mr-2" />Submit Request</button>
        </div>
      </form>
    </div>
  );
}
