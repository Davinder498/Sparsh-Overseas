
import React from 'react';
import { ArrowLeft, Scale } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={onBack} className="flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </button>
        
        <div className="text-center mb-10">
            <Scale className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
                <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
                <p>By accessing and using the Sparsh Overseas portal, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold">2. Service Description</h2>
                <p>Sparsh Overseas is a third-party facilitator platform designed to assist Defence Pensioners residing abroad in generating and submitting their Annual Life Certificates. <strong>We are not the Government of India or the Ministry of Defence.</strong></p>
            </section>

            <section>
                <h2 className="text-xl font-bold">3. User Responsibilities</h2>
                <p>You agree to:</p>
                <ul className="list-disc pl-5 mt-2">
                    <li>Provide true, accurate, current, and complete information about yourself.</li>
                    <li>Maintain the confidentiality of your password and account details.</li>
                    <li>Take full responsibility for all activities that occur under your account.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold">4. Limitation of Liability</h2>
                <p>While we strive for accuracy, Sparsh Overseas cannot guarantee that the generated Life Certificate will be accepted by SPARSH authorities in every instance. Rejection of certificates by government authorities is outside our control. We shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold">5. Digital Notarization</h2>
                <p>The "Notary" users on this platform are independent service providers. We verify their basic credentials but do not guarantee their standing. The digital attestation provided here is intended to facilitate the workflow but does not replace physical presence requirements if strictly mandated by local laws.</p>
            </section>
            
             <section>
                <h2 className="text-xl font-bold">6. Termination</h2>
                <p>We verify accounts for fraudulent activity. We reserve the right to terminate your access to the site without cause or notice.</p>
            </section>
        </div>
      </div>
    </div>
  );
}
