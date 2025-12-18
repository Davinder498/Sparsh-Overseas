
import React, { useState, useEffect, useMemo } from 'react';
import { User, ALCApplication, ApplicationStatus } from '../types';
import { getApplications, updateApplicationStatus } from '../services/firebaseBackend';
import { Check, X, ChevronRight, User as UserIcon, Calendar, Info, FileText, ArrowLeft, Eye, MessageSquare, Loader2, RefreshCcw, AlertTriangle, Inbox, CheckSquare } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SignaturePad from '../components/SignaturePad';
import LifeCertificateTemplate from '../components/LifeCertificateTemplate';

interface Props {
  user: User;
}

type Tab = 'pending' | 'completed';

export default function NotaryDashboard({ user }: Props) {
  const [applications, setApplications] = useState<ALCApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<ALCApplication | null>(null);
  const [notarySignature, setNotarySignature] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');

  useEffect(() => {
    setIsFetching(true);
    const unsubscribe = getApplications(user.role, user.id, (updatedApps) => {
        setApplications(updatedApps);
        setIsFetching(false);
    });
    return () => unsubscribe();
  }, [user]);
  
  const { pendingApps, completedApps } = useMemo(() => {
    const pending = applications.filter(app => app.status === ApplicationStatus.SUBMITTED);
    const completed = applications.filter(app => app.status !== ApplicationStatus.SUBMITTED);
    return { pendingApps: pending, completedApps: completed };
  }, [applications]);

  const handleAttest = async () => {
    if (!selectedApp || !notarySignature) return;
    setLoading(true);
    try {
        await updateApplicationStatus(selectedApp.id, ApplicationStatus.ATTESTED, {
            notaryId: user.id,
            notaryName: user.name,
            notarySignature,
            attestationDate: new Date().toISOString()
        });
        setSelectedApp(null);
    } catch (error) { alert("Failed"); } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setLoading(true);
    try {
        await updateApplicationStatus(selectedApp.id, ApplicationStatus.REJECTED, {
            notaryId: user.id,
            notaryName: user.name,
            rejectionReason: rejectionReason
        });
        setSelectedApp(null);
    } catch (error) { alert("Failed"); } finally { setLoading(false); }
  };

  if (selectedApp) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900/50 min-h-screen pb-10">
        <div className="bg-white dark:bg-gray-800 shadow sticky top-16 z-20 border-b dark:border-gray-700">
             <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                     <button onClick={() => setSelectedApp(null)} className="mr-4 text-gray-500 hover:text-primary transition-colors">
                        <ArrowLeft className="h-6 w-6"/>
                     </button>
                     <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review Certificate</h1>
                        <p className="text-sm text-gray-500">{selectedApp.id}</p>
                     </div>
                </div>
                <StatusBadge status={selectedApp.status} />
             </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded shadow-2xl overflow-hidden border">
                    <LifeCertificateTemplate data={selectedApp} currentNotarySignature={notarySignature} />
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
                        <h3 className="text-lg font-medium mb-4 flex items-center text-gray-900 dark:text-gray-100"><Info className="h-5 w-5 mr-2 text-primary"/> Documents</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {selectedApp.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-primary-soft/30 dark:bg-primary/10 rounded-md">
                                    <span className="text-sm truncate flex-1 text-gray-900 dark:text-gray-200">{doc.name}</span>
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm ml-4">View</a>
                                </div>
                            ))}
                        </div>
                    </div>
                    {selectedApp.status === ApplicationStatus.SUBMITTED && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-primary dark:border-primary/50">
                             <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Attestation Action</h3>
                             <SignaturePad onSave={setNotarySignature} label="Sign & Stamp Here" />
                             <div className="mt-4"><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Remarks</label><textarea rows={3} className="form-input-standard" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
                             <div className="flex space-x-4 mt-6">
                                <button onClick={handleAttest} disabled={loading || !notarySignature} className="flex-1 btn-primary-standard">Approve</button>
                                <button onClick={handleReject} disabled={loading} className="flex-1 btn-secondary-standard text-red-600 border-red-200 hover:bg-red-50">Reject</button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workbench</h1>
          <p className="text-sm text-gray-500">Your ID: {user.displayId}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border dark:border-gray-700">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingApps.map(app => (
                <li key={app.id}>
                    <button onClick={() => setSelectedApp(app)} className="w-full text-left p-4 hover:bg-primary-soft dark:hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <div>
                            <p className="font-medium text-primary">{app.pensionerName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Submitted: {new Date(app.submittedDate).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={app.status} />
                    </button>
                </li>
            ))}
            {pendingApps.length === 0 && <li className="p-8 text-center text-gray-500">No pending requests.</li>}
        </ul>
      </div>
    </div>
  );
}
