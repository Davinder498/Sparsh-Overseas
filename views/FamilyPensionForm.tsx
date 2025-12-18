
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments, GmailAttachment } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Send, Upload, Trash2, Eye, CheckCircle } from 'lucide-react';
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
    { id: 'death_cert', label: 'Death Certificate', required: true },
    { id: 'cancelled_cheque', label: 'Copy of Canceled Cheque (NoK)', required: true },
    { id: 'passport', label: 'Copy of Passport (NoK)', required: true },
];

export default function FamilyPensionForm({ user, onBack }: Props) {
  const [formData, setFormData] = useState({
    reporterName: user.name || '',
    reporterEmail: user.email || '',
    reporterRelation: '',
    deceasedName: '',
    deceasedRank: '',
    deceasedServiceNo: '',
    deceasedPpoNo: '',
    dateOfDeath: '',
    claimantName: '',
    claimantRelation: '',
    claimantDob: '',
    claimantAadhaarPan: '',
    claimantIndianAddress: '',
    claimantOverseasAddress: '',
    claimantEmail: '',
    claimantPhone: '',
    claimantOverseasPhone: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankAccountType: 'Savings',
  });
  
  const [documents, setDocuments] = useState<Record<string, DocumentFile | null>>({
    death_cert: null,
    cancelled_cheque: null,
    passport: null,
  });
  
  const [showSparshModal, setShowSparshModal] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifier = useNotifier();

  const handleUploadClick = (docType: string) => {
    setActiveUploadType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType) return;
    
    const docType = activeUploadType;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newDoc: DocumentFile = { name: file.name, type: file.type, base64: base64, file: file };
      setDocuments(prev => ({ ...prev, [docType]: newDoc }));
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveUploadType(null);
  };

  const removeDocument = (docType: string) => {
    setDocuments(prev => ({ ...prev, [docType]: null }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormReady = DOCUMENT_SLOTS.every(slot => !slot.required || !!documents[slot.id]) && hasConsented;

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
    
    const attachments: GmailAttachment[] = [];
    for (const key in documents) {
        const doc = documents[key];
        if (doc) {
            attachments.push({
                filename: doc.name,
                base64Data: doc.base64.split(',')[1],
                mimeType: doc.type
            });
        }
    }

    const requiredDocsCount = DOCUMENT_SLOTS.filter(s => s.required).length;
    if (attachments.length < requiredDocsCount) {
        setSubmissionStatus('ERROR');
        setErrorMessage("One or more required documents are missing.");
        return;
    }
    
    setSubmissionStatus('SENDING');
    
    const subject = `Initiate Family Pension - ${formData.deceasedName} - SPARSH PPO No ${formData.deceasedPpoNo}`;
    const body = `Dear SPARSH Team,

This email is to report the death of a pensioner and to request the initiation of Family Pension for the Next of Kin (NoK). Please find the required details and attached documents below.

--- REPORTER DETAILS ---
Name: ${formData.reporterName}
Email: ${formData.reporterEmail}
Relation to Deceased: ${formData.reporterRelation}

--- DECEASED PENSIONER DETAILS ---
Name: ${formData.deceasedName}
Rank: ${formData.deceasedRank}
Service Number: ${formData.deceasedServiceNo}
PPO Number (Sparsh): ${formData.deceasedPpoNo}
Date of Death: ${formData.dateOfDeath}

--- CLAIMANT (NOK) DETAILS ---
Name: ${formData.claimantName}
Relation to Deceased: ${formData.claimantRelation}
Date of Birth: ${formData.claimantDob}
Aadhaar/PAN: ${formData.claimantAadhaarPan || 'N/A'}
Indian Address: ${formData.claimantIndianAddress}
Overseas Address: ${formData.claimantOverseasAddress}
Email: ${formData.claimantEmail}
Indian Phone Number: ${formData.claimantPhone || 'N/A'}
Overseas Phone Number: ${formData.claimantOverseasPhone || 'N/A'}

--- CLAIMANT BANK DETAILS (NOK) ---
Bank Name: ${formData.bankName}
Account Number: ${formData.bankAccountNo}
IFSC Code: ${formData.bankIfsc}
Account Type: ${formData.bankAccountType}

Thank you,
${formData.reporterName}
(Submitted securely via Sparsh Overseas Digital Portal)`;

    try {
        await sendGmailWithAttachments(SPARSH_SERVICE_EMAIL, subject, body, attachments);
        setSubmissionStatus('SUCCESS');
        setTimeout(() => {
            setShowSparshModal(false);
            setSubmissionStatus('IDLE');
            notifier.addToast('Family pension request sent successfully.', 'success');
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
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg max-w-4xl mx-auto w-full border dark:border-gray-700 overflow-hidden">
       <SparshSubmissionModal 
            isOpen={showSparshModal}
            onClose={() => setShowSparshModal(false)}
            title="Secure Submission to SPARSH"
            description={<p>This will securely email the completed form and attached documents to <strong>{SPARSH_SERVICE_EMAIL}</strong> using your connected Google account.</p>}
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
              Initiate Family Pension
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); if(!hasConsented) { notifier.addToast("Please agree to the privacy policy.", "warning"); return; } setShowSparshModal(true); }} className="px-8 py-8 space-y-10">
        <div className="space-y-6 text-left">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">01</span>
                Reporter Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="form-label-standard">Your Full Name</label><input type="text" name="reporterName" required value={formData.reporterName} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Relation to Deceased</label><input type="text" name="reporterRelation" required value={formData.reporterRelation} onChange={handleInputChange} className="form-input-standard" placeholder="e.g. Spouse, Son, Daughter" /></div>
            </div>
        </div>

        <div className="space-y-6 text-left">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">02</span>
                Deceased Pensioner Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="form-label-standard">Full Name</label><input type="text" name="deceasedName" required value={formData.deceasedName} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Rank</label><input type="text" name="deceasedRank" required value={formData.deceasedRank} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Service Number</label><input type="text" name="deceasedServiceNo" required value={formData.deceasedServiceNo} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">PPO Number (Sparsh)</label><input type="text" name="deceasedPpoNo" required value={formData.deceasedPpoNo} onChange={handleInputChange} className="form-input-standard" /></div>
                <div className="md:col-span-2"><label className="form-label-standard">Date of Death</label><input type="date" name="dateOfDeath" required value={formData.dateOfDeath} onChange={handleInputChange} className="form-input-standard" /></div>
            </div>
        </div>

        <div className="space-y-6 text-left">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">03</span>
                Claimant (Next of Kin - NoK) Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="form-label-standard">Full Name</label><input type="text" name="claimantName" required value={formData.claimantName} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Relation to Pensioner</label><input type="text" name="claimantRelation" required value={formData.claimantRelation} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Date of Birth</label><input type="date" name="claimantDob" required value={formData.claimantDob} onChange={handleInputChange} className="form-input-standard" /></div>
                <div><label className="form-label-standard">Aadhaar / PAN (Optional)</label><input type="text" name="claimantAadhaarPan" value={formData.claimantAadhaarPan} onChange={handleInputChange} className="form-input-standard" /></div>
                <div className="md:col-span-2"><label className="form-label-standard">Indian Address</label><textarea name="claimantIndianAddress" rows={2} required value={formData.claimantIndianAddress} onChange={handleInputChange} className="form-input-standard" /></div>
                <div className="md:col-span-2"><label className="form-label-standard">Overseas Address</label><textarea name="claimantOverseasAddress" rows={2} required value={formData.claimantOverseasAddress} onChange={handleInputChange} className="form-input-standard" /></div>
                <div className="md:col-span-2"><label className="form-label-standard">Email for Notifications</label><input type="email" name="claimantEmail" required value={formData.claimantEmail} onChange={handleInputChange} className="form-input-standard" /></div>
            </div>
        </div>

        <div className="space-y-6 text-left">
             <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">04</span>
                Supporting Documents (NoK)
             </h4>
             <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DOCUMENT_SLOTS.map(slot => {
                        const doc = documents[slot.id];
                        return (
                            <div key={slot.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all hover:border-primary/30">
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{slot.label}</p>
                                    <span className={`text-[10px] font-bold ${slot.required ? 'text-red-500' : 'text-gray-400'}`}>{slot.required ? 'REQUIRED' : 'OPTIONAL'}</span>
                                </div>
                                {doc ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg p-1.5"><CheckCircle className="w-5 h-5" /></div>
                                        <button type="button" onClick={() => removeDocument(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => handleUploadClick(slot.id)} className="p-2 bg-primary-soft dark:bg-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all"><Upload className="h-5 w-5" /></button>
                                )}
                            </div>
                        )
                    })}
                </div>
             </div>
        </div>

        <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10 text-left">
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
                        I verify that I am the legal Next of Kin/Reporter and authorize the processing of this claim.
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
