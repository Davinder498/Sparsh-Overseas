
import React, { useState, useRef } from 'react';
import { User, ALCDocument } from '../types';
import { createApplication } from '../services/firebaseBackend';
import SignaturePad from '../components/SignaturePad';
import { Loader2, Save, X, Upload, Trash2, CheckCircle } from 'lucide-react';
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

const generateDocID = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomValues = new Uint32Array(8);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 8; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

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
        id: `DOC-${generateDocID()}`,
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
        notifier.addToast(err.message || 'Submission failed.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isFormReady = DOCUMENT_SLOTS.every(slot => !slot.required || !!documents[slot.id]) && !!signature && hasConsented;

  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl max-w-4xl mx-auto w-full border border-gray-200 dark:border-gray-800">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Annual Life Certificate Application
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500 transition-colors p-2">
            <X className="h-6 w-6" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10">
        
        {/* Section 1 */}
        <div className="space-y-6">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">01</span>
                Personal Particulars
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label-standard">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="form-input-standard" placeholder="e.g. Subedar Rajinder Singh" />
                </div>
                <div>
                    <label className="form-label-standard">Father/Husband Name</label>
                    <input type="text" name="fatherHusbandName" value={formData.fatherHusbandName} onChange={handleInputChange} className="form-input-standard" placeholder="e.g. Late Havaldar Harnam Singh" />
                </div>
                <div>
                    <label className="form-label-standard">Date of Birth</label>
                    <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className="form-input-standard" />
                </div>
                <div>
                    <label className="form-label-standard">Place of Birth</label>
                    <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} className="form-input-standard" placeholder="e.g. Jalandhar, Punjab" />
                </div>
                <div>
                    <label className="form-label-standard">Nationality</label>
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} className="form-input-standard" placeholder="e.g. Indian" />
                </div>
            </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-6">
             <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">02</span>
                Communication Details
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="form-label-standard">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input-standard" placeholder="e.g. rajinder@example.com" />
                </div>
                <div>
                    <label className="form-label-standard">Overseas Residence</label>
                    <textarea name="overseasAddress" rows={3} value={formData.overseasAddress} onChange={handleInputChange} className="form-input-standard" placeholder="Full residential address abroad" />
                </div>
                <div>
                    <label className="form-label-standard">Indian Permanent Address</label>
                    <textarea name="indianAddress" rows={3} value={formData.indianAddress} onChange={handleInputChange} className="form-input-standard" placeholder="Permanent address in India" />
                </div>
             </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-6">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">03</span>
                Service Records
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="form-label-standard">Service Number</label>
                    <input type="text" name="serviceNumber" required value={formData.serviceNumber} onChange={handleInputChange} className="form-input-standard" />
                </div>
                <div>
                    <label className="form-label-standard">Rank</label>
                    <input type="text" name="rank" value={formData.rank} onChange={handleInputChange} className="form-input-standard" />
                </div>
                <div>
                    <label className="form-label-standard">SPARSH PPO No.</label>
                    <input type="text" name="ppoNumber" required value={formData.ppoNumber} onChange={handleInputChange} className="form-input-standard" />
                </div>
            </div>
        </div>

        {/* Section 4 */}
        <div className="space-y-6">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest flex items-center">
                <span className="bg-primary/10 text-primary rounded-lg w-8 h-8 flex items-center justify-center mr-3">04</span>
                Evidence & Attestation
            </h4>
            
            <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="mb-4">
                    <label className="form-label-standard mb-3">Upload Supporting Documents</label>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DOCUMENT_SLOTS.map(slot => {
                        const doc = documents[slot.id];
                        return (
                            <div key={slot.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between transition-all hover:border-primary/30">
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

            <div>
                <label className="form-label-standard">Applicant's Signature</label>
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <SignaturePad onSave={setSignature} label="Please sign within the box" />
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
                            I solemnly declare that the information provided is true and complete. I authorize the processing of my personal data for the purpose of Annual Identification under SPARSH.
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center space-x-4">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all">Cancel</button>
            <button
                type="submit"
                disabled={isSubmitting || !isFormReady}
                className="btn-primary-standard px-10"
            >
                {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Processing...</> : <><Save className="h-4 w-4 mr-2" /> Submit to Notary</>}
            </button>
        </div>
      </form>
    </div>
  );
}
