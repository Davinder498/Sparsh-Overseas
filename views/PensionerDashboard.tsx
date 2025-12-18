
import React, { useState, useEffect, useRef } from 'react';
import { User, ALCApplication, ApplicationStatus } from '../types';
import { getApplications, updateApplicationStatus, linkGoogleAccount } from '../services/firebaseBackend';
import { sendGmailWithAttachments } from '../services/gmailService';
import { generateServerSidePDF, downloadPDFBlob, blobToBase64 } from '../services/pdfService';
import { Plus, Send, FileText, CheckCircle, Clock, ArrowLeft, History, Loader2, Download, Info, X, CloudCog } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ALCForm from './ALCForm';
import LifeCertificateTemplate from '../components/LifeCertificateTemplate';
import SparshSubmissionModal, { SubmissionStatus } from '../components/SparshSubmissionModal';
import { useNotifier } from '../contexts/NotificationContext';
import { SPARSH_SERVICE_EMAIL } from '../constants';

interface Props {
  user: User;
  onBack?: () => void;
}

export default function PensionerDashboard({ user, onBack }: Props) {
  const [applications, setApplications] = useState<ALCApplication[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ALCApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const notifier = useNotifier();
  
  const [showSparshModal, setShowSparshModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getApplications(user.role, user.id, (updatedApps) => {
        setApplications(updatedApps);
        
        if (selectedApp) {
            const freshData = updatedApps.find(app => app.id === selectedApp.id);
            if (freshData) {
                setSelectedApp(freshData);
            }
        }

        setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedApp?.id]);

  const handleDownloadPdf = async () => {
      if (!selectedApp) return;
      setIsDownloading(true);
      
      try {
          notifier.addToast("Generating PDF on secure server...", "info");
          const { url } = await generateServerSidePDF(selectedApp.id);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Life-Certificate-${selectedApp.id}.pdf`;
          link.target = "_blank";
          link.click();
          notifier.addToast("PDF Download started.", "success");
      } catch (error: any) {
          console.error(error);
          notifier.addToast(error.message, "error");
      } finally {
          setIsDownloading(false);
      }
  };

  const handleAuthorize = async () => {
    setErrorMessage('');
    try {
        await linkGoogleAccount();
    } catch (error: any) {
        setErrorMessage(error.message || "Failed to authorize Google account.");
        throw error;
    }
  };

  const handleAutoSubmit = async () => {
    if (!selectedApp) return;
    try {
        setSubmissionStatus('GENERATING');
        const { url } = await generateServerSidePDF(selectedApp.id);
        setSubmissionStatus('PREPARING');
        const pdfBlob = await downloadPDFBlob(url);
        const base64Data = await blobToBase64(pdfBlob);

        setSubmissionStatus('SENDING');
        const subject = `Annual Identification - ${selectedApp.rank || 'Rank N/A'} ${selectedApp.pensionerName} - SPARSH PPO No ${selectedApp.ppoNumber}`;
        const body = `Dear SPARSH Team,

Please find my Annual Life Certificate (ALC) attached for the year.

My details are as follows:
Name: ${selectedApp.pensionerName}
Rank: ${selectedApp.rank || 'N/A'}
PPO Number: ${selectedApp.ppoNumber}
Service Number: ${selectedApp.serviceNumber}

Please acknowledge the receipt and acceptance of this certificate.

Thank you,
${selectedApp.pensionerName}
(Submitted securely via Sparsh Overseas Digital Portal)`;

        await sendGmailWithAttachments(
            SPARSH_SERVICE_EMAIL,
            subject,
            body,
            [{
                filename: `ALC_${selectedApp.id}.pdf`,
                base64Data: base64Data,
                mimeType: 'application/pdf'
            }]
        );

        await updateApplicationStatus(selectedApp.id, ApplicationStatus.SENT_TO_SPARSH);
        setSubmissionStatus('SUCCESS');
        setTimeout(() => {
            setShowSparshModal(false);
            setSubmissionStatus('IDLE');
        }, 2000);

    } catch (error: any) {
        console.error("Submission failed:", error);
        setSubmissionStatus('ERROR');
        const msg = error.message.toLowerCase();
        if (msg.includes("access token") || msg.includes("401") || msg.includes("403")) {
            setErrorMessage("Authorization failed or expired. Please authorize your Google account again.");
            sessionStorage.removeItem('google_access_token');
        } else {
            setErrorMessage(error.message || "Failed to process request.");
        }
    }
  };

  const openModal = () => {
      setSubmissionStatus('IDLE');
      setErrorMessage('');
      setShowSparshModal(true);
  };

  if (showNewForm) {
    return (
      <ALCForm 
        user={user} 
        onCancel={() => setShowNewForm(false)} 
        onSuccess={() => {
          setShowNewForm(false);
        }} 
      />
    );
  }

  if (selectedApp) {
      return (
        <div className="bg-gray-100 dark:bg-gray-900/50 min-h-screen pb-10">
            <SparshSubmissionModal 
                isOpen={showSparshModal}
                onClose={() => setShowSparshModal(false)}
                title="Secure Submission to SPARSH"
                description={<p>This will generate a <strong>High-Fidelity PDF</strong> on our secure server and email it to <strong>{SPARSH_SERVICE_EMAIL}</strong>.</p>}
                onAuthorize={handleAuthorize}
                onSubmit={handleAutoSubmit}
                submissionStatus={submissionStatus}
                errorMessage={errorMessage}
            />
            <div className="bg-white dark:bg-gray-800 shadow sticky top-16 z-20 border-b dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={() => setSelectedApp(null)} className="mr-4 text-gray-500 dark:text-gray-300 hover:text-primary transition-colors">
                            <ArrowLeft className="h-6 w-6"/>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Certificate Status</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedApp.id}</p>
                        </div>
                    </div>
                    <StatusBadge status={selectedApp.status} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-4">
                         <div className="flex items-center justify-between">
                             <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                 <FileText className="h-5 w-5 mr-2 text-primary"/> Digital Certificate Preview
                             </h3>
                             <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">View Only</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                            <LifeCertificateTemplate ref={certificateRef} data={selectedApp} />
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Submission Status</h3>
                            
                            {selectedApp.status === ApplicationStatus.SUBMITTED && (
                                <div className="bg-primary-soft dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-md p-4 flex items-start">
                                    <Clock className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-primary dark:text-accent">Pending Notary Attestation</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                            Your certificate is currently being reviewed by a notary.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedApp.status === ApplicationStatus.ATTESTED && (
                                <div className="space-y-4">
                                     <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-md p-4 flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Attestation Complete</h4>
                                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                Your Life Certificate has been digitally signed by the Notary.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-3">
                                        <button 
                                            onClick={() => handleDownloadPdf()}
                                            disabled={isDownloading}
                                            className="btn-secondary-standard w-full"
                                        >
                                            {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Download className="h-4 w-4 mr-2" />}
                                            {isDownloading ? 'Processing...' : 'Download Official PDF'}
                                        </button>
                                        <button 
                                            onClick={openModal}
                                            className="btn-primary-standard w-full"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit to SPARSH (Auto)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedApp.status === ApplicationStatus.SENT_TO_SPARSH && (
                                <div className="space-y-4">
                                    <div className="bg-primary-soft dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-md p-4 flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-primary dark:text-accent">Submitted to SPARSH</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                Your ALC has been transmitted. Check your "Sent Items" in Gmail for proof.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownloadPdf()}
                                        disabled={isDownloading}
                                        className="btn-secondary-standard w-full"
                                    >
                                        {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Download className="h-4 w-4 mr-2" />}
                                        {isDownloading ? 'Processing...' : 'Download Official PDF'}
                                    </button>
                                </div>
                            )}
                             
                             {selectedApp.status === ApplicationStatus.REJECTED && (
                                <div className="space-y-3">
                                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-md p-4 flex items-start">
                                        <X className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Application Rejected</h4>
                                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                                Please review the reason below and submit a new application.
                                            </p>
                                        </div>
                                    </div>
                                    {selectedApp.rejectionReason && (
                                        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded p-3">
                                            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Notary Comments</h5>
                                            <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{selectedApp.rejectionReason}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                <History className="w-4 h-4 mr-2 text-primary" /> Application History
                            </h3>
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {(selectedApp.history || []).map((event, eventIdx) => {
                                        const isLast = eventIdx === (selectedApp.history || []).length - 1;
                                        let Icon = Clock;
                                        let bgColor = 'bg-gray-400';
                                        if (event.status === ApplicationStatus.SUBMITTED) { Icon = FileText; bgColor = 'bg-primary'; } 
                                        else if (event.status === ApplicationStatus.ATTESTED) { Icon = CheckCircle; bgColor = 'bg-green-600'; } 
                                        else if (event.status === ApplicationStatus.SENT_TO_SPARSH) { Icon = Send; bgColor = 'bg-secondary'; } 
                                        else if (event.status === ApplicationStatus.REJECTED) { Icon = X; bgColor = 'bg-red-600'; }

                                        return (
                                            <li key={eventIdx}>
                                                <div className="relative pb-8">
                                                    {!isLast && <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${bgColor}`}>
                                                                <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase">
                                                                    {event.status.replace(/_/g, ' ')}
                                                                </p>
                                                                {event.details && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.details}</p>}
                                                            </div>
                                                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                                <time dateTime={event.timestamp}>
                                                                    {new Date(event.timestamp).toLocaleDateString()}<br/>
                                                                    {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </time>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="px-4 py-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <div className="flex items-center">
            {onBack && (
                <button onClick={onBack} className="mr-4 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-accent p-2 rounded-full hover:bg-primary-soft dark:hover:bg-gray-700 transition-colors">
                    <ArrowLeft className="h-5 w-5"/>
                </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Life Certificates</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">History of your annual submissions.</p>
            </div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="btn-primary-standard sm:w-auto w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Certificate
        </button>
      </div>

      <div className="mb-6 bg-primary-soft dark:bg-primary/20 border border-primary/20 dark:border-primary/40 text-primary dark:text-accent px-4 py-3 rounded-lg flex items-start">
        <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-primary dark:text-accent" />
        <div>
          <p className="text-sm font-medium">Important Information from SPARSH</p>
          <p className="text-xs mt-1">
            SPARSH accepts Life Certificates (जीवन प्रमाण पत्र) any time during the year, and they remain valid for 12 months from the date of submission. NRI/NDG pensioners can submit at any time to avoid the rush in November each year.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
             <div className="text-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                 <p className="mt-2 text-gray-500 dark:text-gray-400">Loading applications...</p>
             </div>
        ) : applications.length === 0 ? (
            <div className="text-center py-12 px-4 flex flex-col items-center">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No applications found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">You haven't submitted any life certificates yet.</p>
                <button
                    onClick={() => setShowNewForm(true)}
                    className="btn-secondary-standard"
                >
                    Get Started
                </button>
            </div>
        ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {applications.map((app) => (
                <li key={app.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center justify-between sm:justify-start">
                            <div className="flex items-center">
                                <span className="h-10 w-10 rounded bg-primary-soft dark:bg-gray-700 flex items-center justify-center text-primary dark:text-accent font-bold text-xs mr-3">
                                    {new Date(app.submittedDate).getFullYear()}
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        Annual Life Certificate
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {app.id}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                             <StatusBadge status={app.status} />
                             <button 
                                onClick={() => setSelectedApp(app)}
                                className="text-sm text-primary hover:text-primary-dark dark:text-accent dark:hover:text-white font-medium flex items-center transition-colors"
                             >
                                View History <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                             </button>
                        </div>
                    </div>
                </div>
                </li>
            ))}
            </ul>
        )}
      </div>
    </div>
  );
}
