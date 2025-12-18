
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments, GmailAttachment } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Send, Upload, Trash2, Eye, CheckCircle, Info } from 'lucide-react';
import SparshSubmissionModal, { SubmissionStatus } from '../components/SparshSubmissionModal';
import { useNotifier } from '../contexts/NotificationContext';
import { SPARSH_SERVICE_EMAIL } from '../constants';

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
        await sendGmailWithAttachments(SPARSH_SERVICE_EMAIL, subject, body, attachments);
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
              Update Email &amp; Mobile
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); setShowSparshModal(true); }} className="px-8 py-8 space-y-8 text-left">
        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">01</span>
                Your Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="form-label-standard">Full Name</label><input type="text" readOnly value={formData.pensionerName} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
                <div><label className="form-label-standard">PPO Number</label><input type="text" name="ppoNumber" value={formData.ppoNumber} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Service Number</label><input type="text" name="serviceNumber" value={formData.serviceNumber} onChange={handleInputChange} className="form-input-standard" /></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">02</span>
                Updation Request
            </h4>
            <div className="space-y-4">
                <div><label className="form-label-standard">New Email Address</label><input type="email" name="newEmail" required value={formData.newEmail} onChange={handleInputChange} className="form-input-standard" placeholder="new.email@example.com"/></div>
                <div><label className="form-label-standard">New Indian Mobile Number</label><input type="tel" name="newIndianMobile" required value={formData.newIndianMobile} onChange={handleInputChange} className="form-input-standard" placeholder="+91 XXXXX XXXXX"/></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">03</span>
                Verification Document
            </h4>
            <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange}/>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1"><p className="text-sm font-bold text-gray-800 dark:text-gray-200">Copy of Passport</p><span className="text-xs text-red-500">REQUIRED</span></div>
                    {document ? (
                        <div className="flex items-center space-x-2">
                             <div className="bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg p-1.5"><CheckCircle className="w-5 h-5" /></div>
                             <button type="button" onClick={removeDocument} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary-standard px-4 py-2 text-sm"><Upload className="h-4 w-4 mr-2" /> Upload</button>
                    )}
                </div>
            </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center space-x-4">
          <button type="button" onClick={onBack} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all">Cancel</button>
          <button type="submit" disabled={!isFormReady} className="btn-primary-standard px-10"><Send className="h-4 w-4 mr-2" />Submit to SPARSH</button>
        </div>
      </form>
    </div>
  );
}
