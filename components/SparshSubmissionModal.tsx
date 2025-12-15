import React, { useState, useEffect } from 'react';
import { Loader2, Send, X, ShieldCheck, AlertTriangle, Check } from 'lucide-react';

export type SubmissionStatus = 'IDLE' | 'PREPARING' | 'GENERATING' | 'SENDING' | 'SUCCESS' | 'ERROR';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: React.ReactNode;
    onAuthorize: () => Promise<void>;
    onSubmit: () => Promise<void>;
    submissionStatus: SubmissionStatus;
    errorMessage: string;
}

export default function SparshSubmissionModal({ isOpen, onClose, title, description, onAuthorize, onSubmit, submissionStatus, errorMessage }: Props) {
    const [hasToken, setHasToken] = useState(false);
    const [isAuthorizing, setIsAuthorizing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setHasToken(!!sessionStorage.getItem('google_access_token'));
        }
    }, [isOpen]);
    
    // In case token is revoked from an error, re-sync state
    useEffect(() => {
        setHasToken(!!sessionStorage.getItem('google_access_token'));
    }, [submissionStatus]);

    const handleAuthorize = async () => {
        setIsAuthorizing(true);
        try {
            await onAuthorize();
            setHasToken(true);
        } catch (error) {
            // Error is handled by the parent component, which will pass down `errorMessage`
        } finally {
            setIsAuthorizing(false);
        }
    };
    
    if (!isOpen) return null;

    const getLoadingMessage = () => {
        switch(submissionStatus) {
            case 'PREPARING': return 'Preparing Documents...';
            case 'GENERATING': return 'Generating PDF Certificate...';
            case 'SENDING': return 'Sending Secure Email...';
            default: return 'Processing...';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 text-center relative border dark:border-gray-700 animate-fade-in-up">
                <button onClick={onClose} disabled={submissionStatus === 'SENDING' || submissionStatus === 'GENERATING' || submissionStatus === 'PREPARING'} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50">
                    <X className="h-6 w-6" />
                </button>
                
                {submissionStatus === 'SUCCESS' ? (
                    <div className="py-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Submission Successful!</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            The request has been sent from your account to SPARSH.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-gray-700 mb-4">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
                        
                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                           {description}
                        </div>

                        {!hasToken && submissionStatus !== 'SENDING' && submissionStatus !== 'GENERATING' && submissionStatus !== 'PREPARING' && (
                             <div className="mt-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-600/50 text-amber-800 dark:text-amber-300 px-4 py-3 rounded text-sm text-left flex flex-col items-start gap-3">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-amber-600" />
                                    <div>
                                        <p className="font-bold">Google Account Authorization Required</p>
                                        <p className="mt-1">To use the automatic email feature, you must grant permission for this app to send emails on your behalf.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAuthorize}
                                    disabled={isAuthorizing}
                                    className="w-full sm:w-auto self-center sm:self-end inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                                >
                                    {isAuthorizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                                    {isAuthorizing ? 'Authorizing...' : 'Authorize Google Account'}
                                </button>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600/50 text-red-700 dark:text-red-300 px-4 py-3 rounded text-sm">
                                {errorMessage}
                            </div>
                        )}

                        <div className="mt-6">
                            {(submissionStatus === 'IDLE' || submissionStatus === 'ERROR') ? (
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-4 space-y-2 space-y-reverse sm:space-y-0">
                                    <button onClick={onClose} type="button" className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none sm:w-auto sm:text-sm">
                                        Cancel
                                    </button>
                                    <button onClick={onSubmit} type="button" disabled={!hasToken} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-800 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Send className="h-5 w-5 mr-2" />
                                        Submit Now
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Loader2 className="animate-spin h-8 w-8 text-primary mb-2" />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        {getLoadingMessage()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
