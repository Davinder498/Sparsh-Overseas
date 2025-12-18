
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments, GmailAttachment } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Send, Upload, Trash2, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
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

const DOCUMENT_SLOTS = [
    { id: 'aadhaar_copy', label: 'Copy of Aadhaar' },
    { id: 'pan_copy', label: 'Copy of PAN Card' },
    { id: 'ppo_copy', label: 'Copy of SPARSH PPO', required: true },
];

export default function UpdateIdForm({ user, onBack }: Props) {
  const [formData, setFormData] = useState({
    pensionerName: user.name || '',
    ppoNumber: user.ppoNumber || '',
    serviceNumber: user.serviceNumber || '',
    aadhaarNumber: '',
    panNumber: '',
  });
  
  const [documents, setDocuments] = useState<Record<string, DocumentFile | null>>({
    aadhaar_copy: null,
    pan_copy: null,
    ppo_copy: null,
  });
  
  const [showSparshModal, setShowSparshModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const notifier = useNotifier();
  
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (docType: string) => {
    setActiveUploadType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType) return;
    const docType = activeUploadType;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setDocuments(prev => ({ ...prev, [docType]: { name: file.name, type: file.type, base64, file } }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveUploadType(null);
  };

  const removeDocument = (docType: string) => {
    setDocuments(prev => ({ ...prev, [docType]: null }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormReady = (() => {
    const hasAadhaar = !!formData.aadhaarNumber && !!documents.aadhaar_copy;
    const hasPan = !!formData.panNumber && !!documents.pan_copy;
    return (hasAadhaar || hasPan) && !!documents.ppo_copy && hasConsented;
  })();
  
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
    
    const attachments: GmailAttachment[] = Object.values(documents)
      .filter((doc): doc is DocumentFile => doc !== null)
      .map(doc => ({
        filename: doc.name,
        base64Data: doc.base64.split(',')[1],
        mimeType: doc.type
    }));
    
    setSubmissionStatus('SENDING');
    
    const subject = `Request for Updation of Aadhaar/PAN - ${formData.pensionerName} - SPARSH PPO No ${formData.ppoNumber}`;
    const body = `Dear SPARSH Team,

Please update my identification details in your records as per the information provided below. Supporting documents are attached for verification.

--- PENSIONER DETAILS ---
Name: ${formData.pensionerName}
PPO Number: ${formData.ppoNumber}
Service Number: ${formData.serviceNumber}

--- DETAILS FOR UPDATION ---
Aadhaar Number: ${formData.aadhaarNumber || 'Not Provided'}
PAN Number: ${formData.panNumber || 'Not Provided'}

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
            notifier.addToast('ID update request sent successfully.', 'success');
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
              Update Aadhaar / PAN
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); if(!hasConsented) { notifier.addToast("Please agree to the privacy policy.", "warning"); return; } setShowSparshModal(true); }} className="px-8 py-8 space-y-10 text-left">
        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">01</span>
                Your Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="form-label-standard">Full Name</label><input type="text" readOnly value={formData.pensionerName} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
                <div><label className="form-label-standard">PPO Number</label><input type="text" readOnly value={formData.ppoNumber} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
                <div><label className="form-label-standard">Service Number</label><input type="text" readOnly value={formData.serviceNumber} className="form-input-standard bg-gray-50 cursor-not-allowed" /></div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">02</span>
                Updation Request
            </h4>
            <div className="space-y-4">
                <div><label className="form-label-standard">Aadhaar Number (12-digit)</label><input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} className="form-input-standard" placeholder="e.g., 2955 6689 5522"/></div>
                <div><label className="form-label-standard">PAN (10-digit Alphanumeric)</label><input type="text" name="panNumber" value={formData.panNumber} onChange={handleInputChange} className="form-input-standard" placeholder="e.g., GIRPS2552N" maxLength={10}/></div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">In the absence of a PAN, deduction of higher tax in SPARSH will be applicable as per prevalent rules in India.</p>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">03</span>
                Supporting Documents
            </h4>
            <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange}/>
                <div className="grid grid-cols-1 gap-4">
                    {DOCUMENT_SLOTS.map(slot => {
                        const doc = documents[slot.id];
                        const isRequired = slot.required || (slot.id === 'aadhaar_copy' && !!formData.aadhaarNumber) || (slot.id === 'pan_copy' && !!formData.panNumber);
                        return (
                            <div key={slot.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all hover:border-primary/30">
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{slot.label}</p>
                                    <span className={`text-[10px] font-bold ${isRequired ? 'text-red-500' : 'text-gray-400'}`}>{isRequired ? 'REQUIRED' : 'OPTIONAL'}</span>
                                </div>
                                {doc ? (
                                    <div className="flex items-center space-x-2">
                                         <div className="bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg p-1.5"><CheckCircle className="w-5 h-5" /></div>
                                         <button type="button" onClick={() => removeDocument(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => handleUploadClick(slot.id)} className="btn-primary-standard px-4 py-2 text-sm"><Upload className="h-4 w-4 mr-2" /> Upload</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10">
            <div className="flex items-start">
                <div className="flex items-center h-5 mt-1">
                    <input
                        id="privacy-consent"
                        name="privacy-consent"
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => setHasConsented(e.target.checked)}
                        className="h-5 w-5 text-primary border-gray-300 rounded-lg focus:ring-primary"
                    />
                </div>
                <div className="ml-4">
                    <label htmlFor="privacy-consent" className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                        I verify the provided identity details and consent to their transmission for service record updates.
                    </label>
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
