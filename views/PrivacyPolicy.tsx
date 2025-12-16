
import React from 'react';
import { ArrowLeft, Shield, Globe, Lock, UserCheck, AlertCircle, Ban } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={onBack} className="flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </button>
        
        <div className="text-center mb-10">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                Compliance: PIPEDA (Canada) & GDPR (Global)<br/>
                Effective Date: {new Date().toLocaleDateString()}
            </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                <h3 className="text-blue-800 dark:text-blue-300 font-bold flex items-center mt-0">
                    <Globe className="h-4 w-4 mr-2" /> International Data Transfer Notice
                </h3>
                <p className="mb-0 text-blue-700 dark:text-blue-200">
                    Sparsh Overseas utilizes secure cloud infrastructure (Google Firebase). Your personal information may be processed and stored on servers located outside of your country of residence (including the United States). By using this service, you consent to this transfer.
                </p>
            </div>

            <section>
                <h2 className="text-xl font-bold flex items-center"><UserCheck className="h-5 w-5 mr-2 text-gray-400"/> 1. Accountability</h2>
                <p>Sparsh Overseas is responsible for personal information under its control. We have designated a Privacy Officer who is accountable for our compliance with this policy and applicable privacy laws, including PIPEDA.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold">2. Information We Collect</h2>
                <p>We collect only the information strictly necessary to facilitate your Annual Life Certificate (ALC) submission to the Defence Accounts Department (SPARSH):</p>
                <ul className="list-disc pl-5 mt-2">
                    <li><strong>Identity Data:</strong> Name, Rank, Service Number, PPO Number.</li>
                    <li><strong>Contact Data:</strong> Email address, phone numbers, and residential address.</li>
                    <li><strong>Biometric/Verification Data:</strong> Digital signatures and copies of government ID (Passport, Aadhaar/PAN) strictly for notary verification.</li>
                    <li><strong>Technical Data:</strong> IP address and device logs for security auditing.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold">3. Purpose of Collection</h2>
                <p>Your data is collected for the following identified purposes:</p>
                <ul className="list-disc pl-5 mt-2">
                    <li>To verify your identity as a living pensioner (Life Certificate).</li>
                    <li>To facilitate digital attestation by a registered Notary.</li>
                    <li>To transmit your application to SPARSH via secure email protocols.</li>
                    <li>To meet legal and regulatory requirements for audit trails.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold flex items-center"><Lock className="h-5 w-5 mr-2 text-gray-400"/> 4. Safeguards & Storage</h2>
                <p>We implement security safeguards appropriate to the sensitivity of the information, including:</p>
                <ul className="list-disc pl-5 mt-2">
                    <li><strong>Encryption:</strong> Data is encrypted in transit (HTTPS/TLS) and at rest (AES-256).</li>
                    <li><strong>Access Control:</strong> Only the specific Notary assigned to your case can view your sensitive documents.</li>
                    <li><strong>Data Minimization:</strong> We do not store your Google Account password (we use OAuth tokens).</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold">5. Retention and Destruction</h2>
                <p>Personal information is retained only as long as necessary for the fulfillment of the identified purposes or as required by law (typically 7 years for financial/legal audits). When no longer required, information is securely destroyed or anonymized.</p>
                <p className="mt-2">You may delete your account at any time via "Account Settings", which will remove your profile from our active database.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold">6. Individual Access (Your Rights)</h2>
                <p>Upon request, you have the right to be informed of the existence, use, and disclosure of your personal information and to be given access to that information. You can download a full copy of your data using the <strong>"Export Data"</strong> feature in Account Settings.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold flex items-center"><Ban className="h-5 w-5 mr-2 text-gray-400"/> 7. Withdrawal of Consent</h2>
                <p>You may withdraw your consent to the collection, use, or disclosure of your personal information at any time, subject to legal or contractual restrictions and reasonable notice. To withdraw consent, please use the "Delete Account" feature or contact our Privacy Officer. Note that withdrawing consent may prevent us from providing the Life Certificate service.</p>
            </section>
            
            <section>
                <h2 className="text-xl font-bold flex items-center"><AlertCircle className="h-5 w-5 mr-2 text-gray-400"/> 8. Challenging Compliance</h2>
                <p>If you have questions or concerns about our privacy practices, please contact our Privacy Officer:</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mt-2">
                    <p><strong>Privacy Officer</strong><br/>
                    Email: privacy@sparsh-overseas.app<br/>
                    </p>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    <strong>For Canadian Users:</strong> If you are not satisfied with our response, you have the right to file a complaint with the <a href="https://www.priv.gc.ca/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Office of the Privacy Commissioner of Canada</a>.
                </p>
            </section>
        </div>
      </div>
    </div>
  );
}
