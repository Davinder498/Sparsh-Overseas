
import React from 'react';
import { ArrowLeft, Shield, Globe, Lock, UserCheck, AlertCircle, Ban } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={onBack} className="flex items-center text-primary dark:text-accent hover:underline mb-6 transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </button>
        
        <div className="text-center mb-10">
            <Shield className="h-12 w-12 text-primary dark:text-accent mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                Compliance: PIPEDA (Canada) & GDPR (Global)<br/>
                Effective Date: {new Date().toLocaleDateString()}
            </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8">
            <div className="bg-primary-soft dark:bg-primary/10 p-4 rounded-lg border border-primary/20 dark:border-primary/30 text-sm">
                <h3 className="text-primary dark:text-accent font-bold flex items-center mt-0">
                    <Globe className="h-4 w-4 mr-2" /> International Data Transfer Notice
                </h3>
                <p className="mb-0 text-stone-700 dark:text-stone-300">
                    Sparsh Overseas utilizes secure cloud infrastructure (Google Firebase). Your personal information may be processed and stored on servers located outside of your country of residence. By using this service, you consent to this transfer.
                </p>
            </div>

            <section>
                <h2 className="text-xl font-bold flex items-center"><UserCheck className="h-5 w-5 mr-2 text-primary dark:text-accent"/> 1. Accountability</h2>
                <p>Sparsh Overseas is responsible for personal information under its control. We have designated a Privacy Officer who is accountable for our compliance with this policy and applicable privacy laws, including PIPEDA.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold">2. Information We Collect</h2>
                <p>We collect only the information strictly necessary to facilitate your Annual Life Certificate (ALC) submission to the Defence Accounts Department (SPARSH):</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Identity Data:</strong> Name, Rank, Service Number, PPO Number.</li>
                    <li><strong>Contact Data:</strong> Email address, phone numbers, and residential address.</li>
                    <li><strong>Verification Data:</strong> Digital signatures and copies of government ID strictly for notary verification.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold flex items-center"><Lock className="h-5 w-5 mr-2 text-primary dark:text-accent"/> 3. Safeguards & Storage</h2>
                <p>We implement commercial-grade security safeguards, including:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Encryption:</strong> Data is encrypted in transit (HTTPS/TLS) and at rest (AES-256).</li>
                    <li><strong>Access Control:</strong> Only authorized Notaries assigned to your application can view sensitive documents.</li>
                    <li><strong>OAuth Protocols:</strong> We do not store your Google Account credentials.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold">4. Individual Access (Your Rights)</h2>
                <p>You have the right to access and download a full copy of your data using the <strong>"Export Data"</strong> feature in Account Settings. You may also request permanent deletion of your profile at any time.</p>
            </section>
            
            <section className="bg-stone-50 dark:bg-stone-900/30 p-6 rounded-lg border dark:border-stone-700">
                <h2 className="text-xl font-bold flex items-center mt-0"><AlertCircle className="h-5 w-5 mr-2 text-primary dark:text-accent"/> 5. Contact Privacy Officer</h2>
                <p className="text-sm">If you have questions regarding our compliance or data handling, please contact:</p>
                <div className="mt-2 text-sm">
                    <p className="font-bold">Privacy Compliance Team</p>
                    <p className="text-primary dark:text-accent">Email: privacy@sparsh-overseas.app</p>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
}
