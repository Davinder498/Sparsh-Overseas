
import React, { useState, useRef } from 'react';
import { User, ALCDocument } from '../types';
import { createApplication } from '../services/firebaseBackend';
import SignaturePad from '../components/SignaturePad';
import { Camera, Sparkles, Loader2, Save, X, FileText, Upload, Trash2, Eye, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useNotifier } from '../contexts/NotificationContext';

interface Props {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const DOCUMENT_SLOTS = [
    { id: 'passport', label: 'Passport (Front/Back)', required: true },
    { id: 'ppo', label: 'PPO (Sparsh)', required: true },
    { id: 'canadian_id', label: 'Canadian ID (Optional)', required: false },
    { id: 'other', label: 'Other (Optional)', required: false },
];

export default function ALCForm({ user, onCancel, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    fatherHusbandName: user.fatherHusbandName || '',
    dob: user.dateOfBirth || '',
    placeOfBirth: user.placeOfBirth || '',
    nationality: user.nationality || 'Indian',
    email: user.email || '',
    overseasAddress: user.overseasAddress || '',
    indianAddress: user.indianAddress || '',
    phoneNumber: user.phoneNumber || '',
    indianPhoneNumber: user.indianPhoneNumber || '',
    rank: user.rank || '',
    serviceNumber: user.serviceNumber || '',
    ppoNumber: user.ppoNumber || '',
    passportNumber: user.passportNumber || '',
    passportIssueDate: user.passportIssueDate || '',
    passportExpiryDate: user.passportExpiryDate || '',
    passportAuthority: user.passportAuthority || '',
  });
  
  const [documents, setDocuments] = useState<Record<string, ALCDocument | null>>({
    passport: null,
    ppo: null,
    canadian_id: null,
    other: null,
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifier = useNotifier();

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
      const newDoc: ALCDocument = {
        id: `doc-${docType}-${Date.now()}`,
        name: file.name,
        url: base64,
        type: file.type,
        file: file
      };
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasConsented) {
        notifier.addToast("You must agree to the Privacy Policy to proceed.", "warning");
        return;
    }

    const requiredDocsUploaded = DOCUMENT_SLOTS.every(slot => !slot.required || !!documents[slot.id]);
    if (!requiredDocsUploaded || !signature) {
        notifier.addToast("Please provide all required documents and a signature.", 'warning');
        return;
    }
    
    setIsSubmitting(true);
    try {
        const docsToSubmit = Object.values(documents).filter(doc => doc !== null) as ALCDocument[];
        await createApplication({
            pensionerId: user.id,
            pensionerName: formData.name,
            fatherHusbandName: formData.fatherHusbandName,
            dateOfBirth: formData.dob,
            placeOfBirth: formData.placeOfBirth,
            nationality: formData.nationality,
            email: formData.email,
            overseasAddress: formData.overseasAddress,
            indianAddress: formData.indianAddress,
            phoneNumber: formData.phoneNumber,
            indianPhoneNumber: formData.indianPhoneNumber,
            rank: formData.rank,
            serviceNumber: formData.serviceNumber,
            ppoNumber: formData.ppoNumber,
            passportNumber: formData.passportNumber,
            passportIssueDate: formData.passportIssueDate,
            passportExpiryDate: formData.passportExpiryDate,
            passportAuthority: formData.passportAuthority,
            documents: docsToSubmit,
            pensionerSignature: signature
        });
        notifier.addToast('Certificate submitted to notary successfully!', 'success');
        onSuccess();
    } catch (err: any) {
        let msg = "Submission failed. Please check your connection.";
        
        if (err.code === 'storage/unauthorized') {
            msg = "Permission Denied: Cannot upload files. Please check Storage Rules.";
        } else if (err.code === 'storage/retry-limit-exceeded') {
            msg = "Upload Failed: Network unstable or file too large.";
        } else if (err.message) {
            msg = err.message;
        }
        
        notifier.addToast(msg, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const requiredDocsUploaded = DOCUMENT_SLOTS.every(slot => !slot.required || !!documents[slot.id]);
  const isFormReady = requiredDocsUploaded && !!signature && hasConsented;

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary text-base md:text-sm border p-2 bg-white dark:bg-gray-700 text-black dark:text-white";

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg max-w-4xl mx-auto w-full border dark:border-gray-700">
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-lg">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 truncate pr-4">
          New Annual Life Certificate
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1">
            <X className="h-6 w-6" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-8">
        
        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 flex-shrink-0">1</span>
                Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className={inputClass} placeholder="e.g. Subedar Rajinder Singh" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Father/Husband Name</label>
                    <input type="text" name="fatherHusbandName" value={formData.fatherHusbandName} onChange={handleInputChange} className={inputClass} placeholder="e.g. Late Havaldar Harnam Singh" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                    <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Place of Birth</label>
                    <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} className={inputClass} placeholder="e.g. Jalandhar, Punjab" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} className={inputClass} placeholder="e.g. Indian" />
                </div>
            </div>
        </div>

        <div className="space-y-4">
             <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 flex-shrink-0">2</span>
                Contact Details
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="e.g. rajinder@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Overseas Address</label>
                    <textarea name="overseasAddress" rows={3} value={formData.overseasAddress} onChange={handleInputChange} className={inputClass} placeholder="Enter your current residential address abroad" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indian Address</label>
                    <textarea name="indianAddress" rows={3} value={formData.indianAddress} onChange={handleInputChange} className={inputClass} placeholder="Enter your permanent address in India" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone No (Overseas)</label>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. +44 7700 900000" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Indian Phone No</label>
                    <input type="tel" name="indianPhoneNumber" value={formData.indianPhoneNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. +91 98765 43210" />
                </div>
             </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 flex-shrink-0">3</span>
                Service Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Number</label>
                    <input type="text" name="serviceNumber" required value={formData.serviceNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. 12345678X" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rank</label>
                    <input type="text" name="rank" value={formData.rank} onChange={handleInputChange} className={inputClass} placeholder="e.g. Subedar" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PPO Number</label>
                    <input type="text" name="ppoNumber" required value={formData.ppoNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. PPO-2023-998877" />
                </div>
            </div>
        </div>

        <div className="space-y-4">
             <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 flex-shrink-0">4</span>
                Passport Details
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Passport No</label>
                    <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleInputChange} className={inputClass} placeholder="e.g. Z1234567" />
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issuing Authority</label>
                    <input type="text" name="passportAuthority" value={formData.passportAuthority} onChange={handleInputChange} className={inputClass} placeholder="e.g. CGI London" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date</label>
                    <input type="date" name="passportIssueDate" value={formData.passportIssueDate} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                    <input type="date" name="passportExpiryDate" value={formData.passportExpiryDate} onChange={handleInputChange} className={inputClass} />
                </div>
             </div>
        </div>

        <div className="space-y-6">
            <h4 className="text-base font-bold text-primary uppercase border-b dark:border-gray-700 pb-2 flex items-center">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 flex-shrink-0">5</span>
                Documents & Declaration
            </h4>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload ID Proofs</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Upload clear images or PDFs for each required document.
                    </p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/jpg,application/pdf" 
                        onChange={handleFileChange}
                    />
                </div>

                <div className="space-y-4">
                    {DOCUMENT_SLOTS.map(slot => {
                        const doc = documents[slot.id];
                        return (
                            <div key={slot.id} className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{slot.label}</p>
                                    {slot.required && <span className="text-xs text-red-500 dark:text-red-400">Required</span>}
                                </div>
                                {doc ? (
                                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                                        <div className="flex items-center space-x-2 flex-1 min-w-0 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded px-2 py-1">
                                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-xs font-medium truncate" title={doc.name}>{doc.name}</span>
                                        </div>
                                        <div className="flex items-center flex-shrink-0">
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-500 hover:text-primary dark:hover:text-blue-400"><Eye className="w-4 h-4"/></a>
                                            <button type="button" onClick={() => removeDocument(slot.id)} className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleUploadClick(slot.id)}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none disabled:opacity-50"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Digital Signature</label>
                <SignaturePad onSave={setSignature} label="Sign below to declare truthfulness" />
            </div>

            {/* PRIVACY ACT COMPLIANCE: EXPLICIT CONSENT */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="privacy-consent"
                            name="privacy-consent"
                            type="checkbox"
                            checked={hasConsented}
                            onChange={(e) => setHasConsented(e.target.checked)}
                            className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="privacy-consent" className="font-medium text-gray-700 dark:text-gray-300">
                            I consent to the collection, processing, and transmission of my personal and biometric data to the Defence Accounts Department (SPARSH) as detailed in the <span className="text-primary font-bold">Privacy Policy</span>. I understand this data is required to process my Life Certificate.
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-0">
            <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mr-3"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={isSubmitting || !isFormReady}
                className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Submit to Notary
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
}
