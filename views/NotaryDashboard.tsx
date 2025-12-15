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
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'attest' | 'reject' | null>(null);

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
        setNotarySignature(null);
        setRejectionReason('');
    } catch (error) {
        alert("Attestation failed");
    } finally {
        setLoading(false);
        setIsConfirmModalOpen(false);
    }
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
        setRejectionReason('');
    } catch (error) {
        alert("Rejection failed");
    } finally {
        setLoading(false);
        setIsConfirmModalOpen(false);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'attest') {
      handleAttest();
    } else if (confirmAction === 'reject') {
      handleReject();
    }
    setConfirmAction(null);
  };
  
  const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText, Icon, iconColorClass }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 text-center relative border dark:border-gray-700 animate-fade-in-up">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconColorClass} mb-4`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-4 space-y-2 space-y-reverse sm:space-y-0">
                <button onClick={onCancel} type="button" className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:w-auto sm:text-sm">Cancel</button>
                <button onClick={onConfirm} type="button" className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:w-auto sm:text-sm ${iconColorClass} hover:opacity-90`}>{confirmText}</button>
            </div>
        </div>
    </div>
  );

  if (selectedApp) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900/50 min-h-screen pb-10">
        {isConfirmModalOpen && (
            <ConfirmationModal
                title={confirmAction === 'attest' ? 'Confirm Attestation' : 'Confirm Rejection'}
                message={
                    confirmAction === 'attest'
                        ? 'Are you sure you want to issue this certificate? This action is irreversible.'
                        : 'Are you sure you want to reject this application? Please provide a reason in the comments. This action is irreversible.'
                }
                confirmText={confirmAction === 'attest' ? 'Yes, Issue Certificate' : 'Yes, Reject Application'}
                Icon={confirmAction === 'attest' ? Check : AlertTriangle}
                iconColorClass={confirmAction === 'attest' ? 'bg-green-600' : 'bg-red-600'}
                onConfirm={handleConfirmAction}
                onCancel={() => { setIsConfirmModalOpen(false); setConfirmAction(null); }}
            />
        )}
        
        <div className="bg-white dark:bg-gray-800 shadow sticky top-16 z-20 border-b dark:border-gray-700">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center">
                     <button onClick={() => setSelectedApp(null)} className="mr-4 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        <ArrowLeft className="h-6 w-6"/>
                     </button>
                     <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review Application</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedApp.id} • {selectedApp.pensionerName}</p>
                     </div>
                </div>
                <div className="flex items-center space-x-2"><StatusBadge status={selectedApp.status} /></div>
             </div>
        </div>

        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center"><FileText className="h-5 w-5 mr-2 text-primary"/> Generated Certificate</h3><span className="text-xs text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Live Preview</span></div>
                    <div className="bg-white rounded shadow-2xl overflow-hidden border border-gray-200 transform origin-top scale-100"><LifeCertificateTemplate data={selectedApp} currentNotarySignature={notarySignature} /></div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center"><Info className="h-5 w-5 mr-2 text-primary"/> Verified Documents</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                            {selectedApp.documents?.length > 0 ? (
                                selectedApp.documents.map((doc) => (
                                    <div key={doc.id} className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-900/50">
                                        <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 mb-2 rounded overflow-hidden flex items-center justify-center">
                                            {doc.type === 'application/pdf' ? (<div className="flex flex-col items-center justify-center text-red-500 dark:text-red-400"><FileText className="h-10 w-10 mb-1" /><span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">PDF Document</span></div>) : (<img src={doc.url} alt={doc.name} className="h-full w-full object-contain cursor-pointer" onClick={() => window.open(doc.url, '_blank')} />)}
                                        </div>
                                        <div className="flex justify-between items-center px-1"><p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full" title={doc.name}>{doc.name}</p><a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-2"><Eye className="w-4 h-4" /></a></div>
                                    </div>
                                ))
                            ) : (<div className="col-span-2 text-center py-8 text-gray-400 dark:text-gray-500 border-2 border-dashed dark:border-gray-600 rounded-lg">No Document Uploaded</div>)}
                        </div>
                    </div>
                    {selectedApp.status === ApplicationStatus.SUBMITTED ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24 border border-blue-100 dark:border-blue-900 ring-4 ring-blue-50 dark:ring-blue-900/30">
                             <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Attestation Action</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">I have verified the documents and confirmed the pensioner's identity. By signing below, I attest the Life Certificate on the left.</p>
                                <div className="mb-4"><SignaturePad onSave={setNotarySignature} label="Sign & Stamp Here" /></div>
                                <div className="mb-4"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments / Rejection Reason (Optional)</label><textarea rows={3} className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-black dark:text-white" placeholder="Enter comments here if you are rejecting the application or need to add remarks." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></div>
                             </div>
                             <div className="flex space-x-4">
                                <button onClick={() => { setConfirmAction('attest'); setIsConfirmModalOpen(true); }} disabled={loading || !notarySignature} className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 shadow-sm transition-all">{loading && confirmAction === 'attest' ? 'Processing...' : (<><Check className="h-5 w-5 mr-2" /> Issue Certificate</>)}</button>
                                <button onClick={() => { setConfirmAction('reject'); setIsConfirmModalOpen(true); }} disabled={loading} className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm transition-all">{loading && confirmAction === 'reject' ? 'Processing...' : (<><X className="h-5 w-5 mr-2" /> Reject</>)}</button>
                             </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Application Status</h3>
                            <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 mb-4 flex items-center justify-between"><StatusBadge status={selectedApp.status} /><span className="text-sm text-gray-500 dark:text-gray-400">Processed: {selectedApp.attestationDate ? new Date(selectedApp.attestationDate).toLocaleDateString() : 'N/A'}</span></div>
                            {selectedApp.rejectionReason && (<div><h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Rejection Reason:</h4><p className="text-sm text-gray-600 dark:text-gray-200 bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-100 dark:border-red-800/50">{selectedApp.rejectionReason}</p></div>)}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  const AppList = ({ apps }) => (
    apps.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <Inbox className="h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No applications here</h3>
            <p className="mt-1">This section is currently empty.</p>
        </div>
    ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {apps.map((app) => (
                <li key={app.id}>
                    <button onClick={() => setSelectedApp(app)} className={`block w-full text-left focus:outline-none transition duration-150 ease-in-out group ${app.status === ApplicationStatus.SUBMITTED ? 'bg-blue-50/30 dark:bg-blue-900/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center"><div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">{app.pensionerName.charAt(0)}</div><div className="ml-4"><p className="text-sm font-medium text-primary group-hover:text-blue-800 dark:text-blue-300">{app.pensionerName}</p><p className="text-xs text-gray-500 dark:text-gray-400">PPO: {app.ppoNumber}</p></div></div>
                                <div className="ml-2 flex-shrink-0 flex items-center"><StatusBadge status={app.status} /><ChevronRight className="h-5 w-5 text-gray-400 ml-4" /></div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between ml-14"><div className="sm:flex"><p className="flex items-center text-xs text-gray-500 dark:text-gray-400"><Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />Submitted: {new Date(app.submittedDate).toLocaleDateString()}</p></div></div>
                        </div>
                    </button>
                </li>
            ))}
        </ul>
    )
  );

  return (
    <div className="px-4 py-4 sm:px-0">
      <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notary Workbench</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review pending Life Certificate applications and view your history.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('pending')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
            <Inbox className="h-5 w-5 mr-2"/><span>Pending Review</span>
            {pendingApps.length > 0 && <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{pendingApps.length}</span>}
          </button>
          <button onClick={() => setActiveTab('completed')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'completed' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
            <CheckSquare className="h-5 w-5 mr-2"/><span>Completed</span>
          </button>
        </nav>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-b-md border border-t-0 border-gray-200 dark:border-gray-700">
        {isFetching ? (<div className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="mt-2 text-gray-500 dark:text-gray-400">Connecting to workbench...</p></div>) : 
        activeTab === 'pending' ? <AppList apps={pendingApps} /> : <AppList apps={completedApps} />}
      </div>
    </div>
  );
}