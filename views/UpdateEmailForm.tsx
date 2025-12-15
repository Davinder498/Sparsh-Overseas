import React, { useState, useRef } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments, GmailAttachment } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Send, Upload, Trash2, Eye, CheckCircle, Info } from 'lucide-react';
import SparshSubmissionModal, { SubmissionStatus } from '../components/SparshSubmissionModal';
import { useNotifier } from '../contexts/NotificationContext';

interface Props {
  user: User;
  onBack: () => void;
}

interface DocumentFile {
  name: string;
  type: string;
  base64: string; // Data URL
  file: File;
}

export default function UpdateEmailForm({ user, onBack }: Props) {
  const [formData, setFormData] = useState({
    pensionerName: user.name || '',
    ppoNumber: user.ppoNumber || '',
    serviceNumber: user.serviceNumber || '',
    newEmail: '',
    newIndianMobile: '',
  });
  
  const [document, setDocument] = useState<DocumentFile | null>(null);
  
  const [showSparshModal, setShowSparshModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const notifier = useNotifier();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setDocument({ name: file.name, type: file.type, base64, file });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDocument = () => {
    setDocument(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormReady = !!document && !!formData.newEmail && !!formData.newIndianMobile;
  
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
    setSubmissionStatus('PREPARING');
    
    const attachments: GmailAttachment[] = [{
        filename: document!.name,
        base64Data: document!.base64.split(',')[1],
        mimeType: document!.type
    }];
    
    setSubmissionStatus('SENDING');
    
    const sparshEmail = "sparshnri.dad@gov.in";
    const subject = `Request for Updation of Email/Mobile - ${formData.pensionerName} - SPARSH PPO No ${formData.ppoNumber}`;
    const body = `Dear SPARSH Team,

Please update my contact details in your records as per the information provided below. A copy of my passport is attached for verification.

--- PENSIONER DETAILS ---
Name: ${formData.pensionerName}
PPO Number: ${formData.ppoNumber}
Service Number: ${formData.serviceNumber}
Current Email: ${user.email}

--- DETAILS FOR UPDATION ---
New Email ID: ${formData.newEmail}
New Indian Mobile Number: ${formData.newIndianMobile}

Thank you for your prompt attention to this matter.

Regards,
${formData.pensionerName}
(Submitted securely via Sparsh Overseas Digital Portal)`;

    try {
        await sendGmailWithAttachments(sparshEmail, subject, body, attachments);
        setSubmissionStatus('SUCCESS');
        setTimeout(() => {
            setShowSparshModal(false);
            setSubmissionStatus('IDLE');
            notifier.addToast('Contact update request sent.', 'success');
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
  
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary text-base md:text-sm border p-2 bg-white dark:bg-gray-700 text-black dark:text-white";
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
              Update Email &amp; Mobile
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); setShowSparshModal(true); }} className="px-4 py-5 sm:p-6 space-y-8">
        
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>Your Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label><input type="text" readOnly value={formData.pensionerName} className={readOnlyClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PPO Number</label><input type="text" name="ppoNumber" value={formData.ppoNumber} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Number</label><input type="text" name="serviceNumber" value={formData.serviceNumber} onChange={handleInputChange} className={inputClass} /></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>Details for Updation</h4>
            <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Email Address</label><input type="email" name="newEmail" required value={formData.newEmail} onChange={handleInputChange} className={inputClass} placeholder="new.email@example.com"/></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Indian Mobile Number</label><input type="tel" name="newIndianMobile" required value={formData.newIndianMobile} onChange={handleInputChange} className={inputClass} placeholder="+91 XXXXX XXXXX"/></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>Verification Document</h4>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange}/>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1"><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Copy of Passport</p><span className="text-xs text-red-500 dark:text-red-400">Required</span></div>
                    {document ? (
                        <div className="flex items-center space-x-3 w-full sm:w-auto"><div className="flex items-center space-x-2 flex-1 min-w-0 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded px-2 py-1"><CheckCircle className="w-4 h-4 flex-shrink-0" /><span className="text-xs font-medium truncate" title={document.name}>{document.name}</span></div><div className="flex items-center flex-shrink-0"><a href={document.base64} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-primary"><Eye className="w-4 h-4"/></a><button type="button" onClick={removeDocument} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div></div>
                    ) : (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Upload className="h-4 w-4 mr-2" />Upload</button>
                    )}
                </div>
                <div className="flex items-start text-xs text-gray-500 dark:text-gray-400 p-2">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>A clear copy of your passport is required as proof of identity to process this change request.</span>
                </div>
            </div>
        </div>
        
        <div className="pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-0">
          <button type="button" onClick={onBack} className="w-full sm:w-auto bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:mr-3">Cancel</button>
          <button type="submit" disabled={!isFormReady} className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none disabled:opacity-50"><Send className="h-4 w-4 mr-2" />Submit to SPARSH</button>
        </div>
      </form>
    </div>
  );
}
