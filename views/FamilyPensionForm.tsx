import React, { useState, useRef } from 'react';
import { User } from '../types';
import { sendGmailWithAttachments, GmailAttachment } from '../services/gmailService';
import { linkGoogleAccount } from '../services/firebaseBackend';
import { ArrowLeft, Loader2, Send, Upload, Trash2, Eye, CheckCircle } from 'lucide-react';
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

  const isFormReady = DOCUMENT_SLOTS.every(slot => !slot.required || !!documents[slot.id]);

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
    
    const sparshEmail = "sparshnri.dad@gov.in";
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
        await sendGmailWithAttachments(sparshEmail, subject, body, attachments);
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
  
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary text-base md:text-sm border p-2 bg-white dark:bg-gray-700 text-black dark:text-white";

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg max-w-4xl mx-auto w-full border dark:border-gray-700">
       <SparshSubmissionModal 
            isOpen={showSparshModal}
            onClose={() => setShowSparshModal(false)}
            title="Secure Submission to SPARSH"
            description={<p>This will securely email the completed form and attached documents to <strong>sparshnri.dad@gov.in</strong> using your connected Google account.</p>}
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
              Initiate Family Pension
            </h3>
        </div>
      </div>
      
      <form onSubmit={(e) => { e.preventDefault(); setShowSparshModal(true); }} className="px-4 py-5 sm:p-6 space-y-8">
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>Reporter Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Full Name</label><input type="text" name="reporterName" required value={formData.reporterName} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Relation to Deceased</label><input type="text" name="reporterRelation" required value={formData.reporterRelation} onChange={handleInputChange} className={inputClass} placeholder="e.g. Spouse, Son, Daughter" /></div>
            </div>
        </div>
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>Deceased Pensioner Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label><input type="text" name="deceasedName" required value={formData.deceasedName} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rank</label><input type="text" name="deceasedRank" required value={formData.deceasedRank} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Number</label><input type="text" name="deceasedServiceNo" required value={formData.deceasedServiceNo} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PPO Number (Sparsh)</label><input type="text" name="deceasedPpoNo" required value={formData.deceasedPpoNo} onChange={handleInputChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Death</label><input type="date" name="dateOfDeath" required value={formData.dateOfDeath} onChange={handleInputChange} className={inputClass} /></div>
            </div>
        </div>
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>Claimant (Next of Kin - NoK) Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label><input type="text" name="claimantName" required value={formData.claimantName} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Relation to Pensioner</label><input type="text" name="claimantRelation" required value={formData.claimantRelation} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label><input type="date" name="claimantDob" required value={formData.claimantDob} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aadhaar / PAN (Optional)</label><input type="text" name="claimantAadhaarPan" value={formData.claimantAadhaarPan} onChange={handleInputChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indian Address (with Zip Code)</label><textarea name="claimantIndianAddress" rows={3} required value={formData.claimantIndianAddress} onChange={handleInputChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Overseas Address (with Zip Code)</label><textarea name="claimantOverseasAddress" rows={3} required value={formData.claimantOverseasAddress} onChange={handleInputChange} className={inputClass} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email for Notifications</label><input type="email" name="claimantEmail" required value={formData.claimantEmail} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indian Phone No (Optional)</label><input type="tel" name="claimantPhone" value={formData.claimantPhone} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Overseas Phone No (Optional)</label><input type="tel" name="claimantOverseasPhone" value={formData.claimantOverseasPhone} onChange={handleInputChange} className={inputClass} /></div>
            </div>
        </div>
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">4</span>Claimant (NoK) Bank Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label><input type="text" name="bankName" required value={formData.bankName} onChange={handleInputChange} className={inputClass} /><p className="text-xs text-gray-500 mt-1">For NDG, only Nepal SBI & Everest Bank are accepted.</p></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label><input type="text" name="bankAccountNo" required value={formData.bankAccountNo} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IFSC Code</label><input type="text" name="bankIfsc" required value={formData.bankIfsc} onChange={handleInputChange} className={inputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label><select name="bankAccountType" value={formData.bankAccountType} onChange={handleInputChange} className={inputClass}><option>Savings</option><option>NRE</option><option>NRO</option></select></div>
            </div>
        </div>
        <div className="space-y-4">
             <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center"><span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">5</span>Required Documents (NoK)</h4>
             <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange}/>
                {DOCUMENT_SLOTS.map(slot => {
                    const doc = documents[slot.id];
                    return (
                        <div key={slot.id} className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1"><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{slot.label}</p>{slot.required && <span className="text-xs text-red-500 dark:text-red-400">Required</span>}</div>
                            {doc ? (
                                <div className="flex items-center space-x-3 w-full sm:w-auto"><div className="flex items-center space-x-2 flex-1 min-w-0 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded px-2 py-1"><CheckCircle className="w-4 h-4 flex-shrink-0" /><span className="text-xs font-medium truncate" title={doc.name}>{doc.name}</span></div><div className="flex items-center flex-shrink-0"><a href={doc.base64} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-primary"><Eye className="w-4 h-4"/></a><button type="button" onClick={() => removeDocument(slot.id)} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div></div>
                            ) : (
                                <button type="button" onClick={() => handleUploadClick(slot.id)} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Upload className="h-4 w-4 mr-2" />Upload</button>
                            )}
                        </div>
                    )
                })}
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
