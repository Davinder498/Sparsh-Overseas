
import React, { useState, useEffect } from 'react';
import { User, UserRole, View, Theme } from './types';
import { loginUser, registerUser, updateUserProfile, loginWithGoogle, changeUserPassword, exportUserData, deleteUserAccount } from './services/firebaseBackend';
import { Shield, LogOut, User as UserIcon, FileCheck, Menu, X, Home, Settings, Lock, Key, Mail, Loader2, Edit2, Save, BarChart3, Trash2, DownloadCloud, AlertTriangle, FileText } from 'lucide-react';
import PensionerDashboard from './views/PensionerDashboard';
import NotaryDashboard from './views/NotaryDashboard';
import ThemeToggle from './components/ThemeToggle';
import HomePage from './views/HomePage';
import LandingPage from './views/LandingPage';
import ServiceUnavailablePage from './views/ServiceUnavailablePage';
import NotaryReports from './views/NotaryReports';
import PrivacyPolicy from './views/PrivacyPolicy';
import TermsOfService from './views/TermsOfService';
import CookieConsent from './components/CookieConsent';
import { auth } from './services/firebaseConfig';
import { doc, getDoc } from '@firebase/firestore';
import { db } from './services/firebaseConfig';
import FamilyPensionForm from './views/FamilyPensionForm';
import UpdateEmailForm from './views/UpdateEmailForm';
import UpdateIdForm from './views/UpdateIdForm';
import RequestDocumentsForm from './views/RequestDocumentsForm';
import { useNotifier } from './contexts/NotificationContext';
import { captureError } from './services/errorMonitoringService';
import NotificationCenter from './components/NotificationCenter';
import { requestNotificationPermission } from './services/pushNotificationService';

// Extracted DetailItem component to prevent re-rendering issues (focus loss)
interface DetailItemProps {
  label: string;
  value?: string;
  name: string;
  type?: string;
  editMode: boolean;
  area?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, name, type = "text", editMode, area = false, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
    {editMode ? (
      area ? <textarea name={name} value={value || ''} onChange={onChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-700"/>
           : <input type={type} name={name} value={value || ''} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-700"/>
    ) : (
      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || <span className="text-gray-400 italic">Not set</span>}</p>
    )}
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<View>('LANDING');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unavailableServiceTitle, setUnavailableServiceTitle] = useState<string>('');
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
  });
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userProfile = userDoc.data() as User;
          setCurrentUser(userProfile);
          setCurrentView(userProfile.role === UserRole.PENSIONER ? 'HOME_PAGE' : 'NOTARY_DASHBOARD');
          
          // Request notification permissions when user logs in
          requestNotificationPermission().then(granted => {
              if(granted) console.log("Notifications enabled");
          });

        } else {
          captureError(new Error("User in auth but not in Firestore"), { userId: firebaseUser.uid });
          await auth.signOut();
          setCurrentUser(null);
          setCurrentView('LANDING');
        }
      } else {
        setCurrentUser(null);
        setCurrentView('LANDING');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    sessionStorage.removeItem('google_access_token');
    auth.signOut().catch((error) => {
        captureError(error, { action: 'handleLogout' });
    }).finally(() => {
        setCurrentUser(null);
        setCurrentView('LANDING');
        setIsDrawerOpen(false);
    });
  };

  const navigateTo = (view: View, params?: { title: string }) => {
    // Exception for Legal Pages which can be accessed without login from footer/menu if needed (logic below handles it)
    if (view === 'PRIVACY_POLICY' || view === 'TERMS_OF_SERVICE') {
        setCurrentView(view);
        setIsDrawerOpen(false);
        return;
    }
    
    if (view !== 'LOGIN' && view !== 'LANDING' && !currentUser) {
        return;
    }
    
    if (view === 'SERVICE_UNAVAILABLE' && params?.title) {
        setUnavailableServiceTitle(params.title);
    }

    // Extended views
    setCurrentView(view);
    setIsDrawerOpen(false);
  };

  const getHomeView = (): View => {
    if (currentUser?.role === UserRole.PENSIONER) return 'HOME_PAGE';
    if (currentUser?.role === UserRole.NOTARY) return 'NOTARY_DASHBOARD';
    return 'LANDING';
  };

  const LoginScreen = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const notifier = useNotifier();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.PENSIONER);

    const handleSuccess = (user: User) => {
      setCurrentUser(user);
      notifier.addToast(`Welcome, ${user.name.split(' ')[0]}!`, 'success');
      if (user.role === UserRole.PENSIONER) setCurrentView('HOME_PAGE');
      else if (user.role === UserRole.NOTARY) setCurrentView('NOTARY_DASHBOARD');
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const user = isRegistering 
          ? await registerUser(email, password, name, role) 
          : await loginUser(email, password);
        handleSuccess(user);
      } catch (err: any) {
        let msg = "Authentication failed.";
        if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        else if (err.code === 'auth/email-already-in-use') msg = "Email already registered. Please sign in.";
        else if (err.code === 'permission-denied') msg = "Permission Error: Please check Firestore Rules.";
        else if (err.message) msg = err.message;
        notifier.addToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const user = await loginWithGoogle(role);
            handleSuccess(user);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
               notifier.addToast(err.message || "Google Sign-In failed.", 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 flex items-center justify-center mb-6">
               <img src="/logo.png" alt="Sparsh Overseas" className="h-full w-full rounded-2xl shadow-lg" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isRegistering ? 'Create an Account' : 'Sign In to Your Account'}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                {isRegistering && (
                  <div>
                    <label htmlFor="name" className="sr-only">Full Name</label>
                    <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm shadow-sm" placeholder="Full Name" />
                  </div>
                )}
                <div>
                  <label htmlFor="email-address" className="sr-only">Email address</label>
                  <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm shadow-sm" placeholder="Email address" />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm shadow-sm" placeholder="Password" />
                </div>
            </div>
            {isRegistering && (
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">I am a:</label>
                    <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm">
                        <option value={UserRole.PENSIONER}>Pensioner</option>
                        <option value={UserRole.NOTARY}>Notary Public</option>
                    </select>
                </div>
            )}
            <div>
              <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? 'Register' : 'Sign In')}
              </button>
            </div>
          </form>
           <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>
            <div>
              <button onClick={handleGoogleLogin} disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
            </div>
          <div className="text-sm text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="font-medium text-primary hover:text-blue-700 dark:hover:text-blue-400">
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const PersonalDetails = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const notifier = useNotifier();
    const [formData, setFormData] = useState<Partial<User>>({
        name: currentUser?.name || '',
        fatherHusbandName: currentUser?.fatherHusbandName || '',
        dateOfBirth: currentUser?.dateOfBirth || '',
        placeOfBirth: currentUser?.placeOfBirth || '',
        nationality: currentUser?.nationality || '',
        serviceNumber: currentUser?.serviceNumber || '',
        rank: currentUser?.rank || '',
        ppoNumber: currentUser?.ppoNumber || '',
        passportNumber: currentUser?.passportNumber || '',
        passportIssueDate: currentUser?.passportIssueDate || '',
        passportExpiryDate: currentUser?.passportExpiryDate || '',
        passportAuthority: currentUser?.passportAuthority || '',
        overseasAddress: currentUser?.overseasAddress || '',
        indianAddress: currentUser?.indianAddress || '',
        phoneNumber: currentUser?.phoneNumber || '',
        indianPhoneNumber: currentUser?.indianPhoneNumber || '',
    });

    if (!currentUser) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateUserProfile(currentUser.id, formData);
            setCurrentUser(prev => prev ? { ...prev, ...formData } : null);
            notifier.addToast('Profile updated successfully!', 'success');
            setIsEditing(false);
        } catch (error: any) {
            notifier.addToast(error.message || 'Failed to update profile.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b dark:border-gray-700">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Personal &amp; Service Details</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Your information for official correspondence.</p>
                </div>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"><Edit2 className="h-4 w-4 mr-2"/>Edit</button>
                ) : (
                    <button onClick={() => setIsEditing(false)} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"><X className="h-4 w-4 mr-2"/>Cancel</button>
                )}
            </div>
            <form onSubmit={handleSave}>
                <div className="px-4 py-5 sm:p-6 space-y-8">
                     <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <DetailItem label="Full Name" name="name" value={formData.name} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Father/Husband Name" name="fatherHusbandName" value={formData.fatherHusbandName} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Nationality" name="nationality" value={formData.nationality} editMode={isEditing} onChange={handleInputChange} />
                        <div className="sm:col-span-2"><hr className="dark:border-gray-700"/></div>
                        <DetailItem label="Service Number" name="serviceNumber" value={formData.serviceNumber} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Rank" name="rank" value={formData.rank} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="PPO Number" name="ppoNumber" value={formData.ppoNumber} editMode={isEditing} onChange={handleInputChange} />
                        <div className="sm:col-span-2"><hr className="dark:border-gray-700"/></div>
                        <DetailItem label="Passport Number" name="passportNumber" value={formData.passportNumber} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Passport Authority" name="passportAuthority" value={formData.passportAuthority} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Passport Issue Date" name="passportIssueDate" type="date" value={formData.passportIssueDate} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Passport Expiry Date" name="passportExpiryDate" type="date" value={formData.passportExpiryDate} editMode={isEditing} onChange={handleInputChange} />
                        <div className="sm:col-span-2"><hr className="dark:border-gray-700"/></div>
                        <div className="sm:col-span-2"><DetailItem label="Overseas Address" name="overseasAddress" value={formData.overseasAddress} editMode={isEditing} area={true} onChange={handleInputChange} /></div>
                        <div className="sm:col-span-2"><DetailItem label="Indian Address" name="indianAddress" value={formData.indianAddress} editMode={isEditing} area={true} onChange={handleInputChange} /></div>
                        <DetailItem label="Phone Number (Overseas)" name="phoneNumber" value={formData.phoneNumber} editMode={isEditing} onChange={handleInputChange} />
                        <DetailItem label="Phone Number (Indian)" name="indianPhoneNumber" value={formData.indianPhoneNumber} editMode={isEditing} onChange={handleInputChange} />
                     </dl>
                </div>
                {isEditing && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-right sm:px-6 border-t dark:border-gray-700">
                        <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 disabled:opacity-50">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2"/>}
                            Save Changes
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
  };
  
  const AccountSettings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const notifier = useNotifier();

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            notifier.addToast('New passwords do not match.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await changeUserPassword(currentPassword, newPassword);
            notifier.addToast('Password updated successfully!', 'success');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error: any) {
            notifier.addToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExport = async () => {
        if (!currentUser) return;
        setExportLoading(true);
        try {
            const data = await exportUserData(currentUser.id);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sparsh_data_export_${currentUser.id}.json`;
            link.click();
            notifier.addToast('Data exported successfully.', 'success');
        } catch(error: any) {
            notifier.addToast('Export failed. Please try again.', 'error');
        } finally {
            setExportLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if(!window.confirm("ARE YOU SURE? This will permanently delete your login and profile. This action cannot be undone.")) return;
        
        try {
            await deleteUserAccount();
            // Logout happens automatically via auth state change
            notifier.addToast('Account deleted.', 'info');
        } catch(error: any) {
            notifier.addToast('Failed to delete account. You may need to re-login first.', 'error');
        }
    };
    
    if (!currentUser) return null;
    const isGoogleUser = currentUser.id.startsWith("google:") || (currentUser.avatar && currentUser.avatar.includes('googleusercontent'));

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border dark:border-gray-700">
                <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Security & Login</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Manage your credentials.</p>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-6">
                    <div>
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Login Email</h4>
                        <div className="mt-2 flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border dark:border-gray-700">
                            <Mail className="h-5 w-5 text-gray-400 mr-3"/>
                            <span className="text-gray-700 dark:text-gray-300">{currentUser.email}</span>
                            {isGoogleUser && <span className="ml-auto text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">Google Account</span>}
                        </div>
                    </div>

                    {!isGoogleUser && (
                        <form onSubmit={handlePasswordChange} className="space-y-4 pt-6 border-t dark:border-gray-700">
                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Change Password</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 bg-white dark:bg-gray-700"/>
                            </div>
                            <div className="text-right">
                                <button type="submit" disabled={isLoading} className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800 disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Key className="h-4 w-4 mr-2"/>}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-red-100 dark:border-red-900/30">
                 <div className="px-4 py-5 sm:px-6 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-t-lg">
                    <h3 className="text-lg leading-6 font-medium text-red-800 dark:text-red-400 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" /> Data Privacy & Danger Zone
                    </h3>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Export Your Data</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of all your personal data and application history (GDPR).</p>
                        </div>
                        <button onClick={handleExport} disabled={exportLoading} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                             {exportLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <DownloadCloud className="h-4 w-4 mr-2"/>} Export JSON
                        </button>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div>
                            <h4 className="text-md font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Permanently remove your account and personal profile from our systems.</p>
                        </div>
                        <button onClick={handleDeleteAccount} className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-800 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40">
                             <Trash2 className="h-4 w-4 mr-2"/> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case 'LANDING': return <LandingPage navigateTo={navigateTo} theme={theme} setTheme={setTheme} />;
      case 'LOGIN': return <LoginScreen />;
      case 'HOME_PAGE': return currentUser && <HomePage user={currentUser} navigateTo={navigateTo} />;
      case 'PENSIONER_DASHBOARD': return currentUser && <PensionerDashboard user={currentUser} onBack={() => navigateTo('HOME_PAGE')} />;
      case 'NOTARY_DASHBOARD': return currentUser && <NotaryDashboard user={currentUser} />;
      case 'PERSONAL_DETAIL': return <PersonalDetails />;
      case 'ACCOUNT_SETTING': return <AccountSettings />;
      case 'NOTARY_REPORTS': return currentUser && <NotaryReports user={currentUser} />;
      case 'SERVICE_UNAVAILABLE': return <ServiceUnavailablePage serviceTitle={unavailableServiceTitle} onBack={() => navigateTo('HOME_PAGE')} />;
      case 'FAMILY_PENSION': return currentUser && <FamilyPensionForm user={currentUser} onBack={() => navigateTo('HOME_PAGE')} />;
      case 'UPDATE_EMAIL': return currentUser && <UpdateEmailForm user={currentUser} onBack={() => navigateTo('HOME_PAGE')} />;
      case 'UPDATE_ID': return currentUser && <UpdateIdForm user={currentUser} onBack={() => navigateTo('HOME_PAGE')} />;
      case 'REQUEST_DOCUMENTS': return currentUser && <RequestDocumentsForm user={currentUser} onBack={() => navigateTo('HOME_PAGE')} />;
      case 'PRIVACY_POLICY': return <PrivacyPolicy onBack={() => navigateTo(currentUser ? getHomeView() : 'LANDING')} />;
      case 'TERMS_OF_SERVICE': return <TermsOfService onBack={() => navigateTo(currentUser ? getHomeView() : 'LANDING')} />;
      default: return null;
    }
  };
  
  const getPageTitle = () => {
      if (!currentUser) return "Welcome";
      switch(currentView) {
          case 'HOME_PAGE': return "Dashboard";
          case 'PENSIONER_DASHBOARD': return "My Certificates";
          case 'NOTARY_DASHBOARD': return "Notary Workbench";
          case 'PERSONAL_DETAIL': return "My Profile";
          case 'ACCOUNT_SETTING': return "Account Settings";
          case 'NOTARY_REPORTS': return "Reports";
          default: return "Services";
      }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }
  
  // Show cookie consent on all screens
  const cookieBanner = <CookieConsent />;

  if (!currentUser) {
      // Allow viewing legal pages even when logged out
      if (currentView === 'PRIVACY_POLICY' || currentView === 'TERMS_OF_SERVICE') {
           return (
             <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                {renderView()}
                {cookieBanner}
             </div>
           );
      }
      return (
        <>
            {renderView()}
            {cookieBanner}
            <div className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 flex justify-center space-x-6 text-xs text-gray-400 z-40">
                <button onClick={() => navigateTo('PRIVACY_POLICY')} className="hover:text-primary">Privacy Policy</button>
                <span>|</span>
                <button onClick={() => navigateTo('TERMS_OF_SERVICE')} className="hover:text-primary">Terms of Service</button>
            </div>
        </>
      );
  }
  
  // FIX: Explicitly type nav item arrays to prevent TypeScript from widening the 'view' property to a generic string.
  const pensionerNavItems: { view: View; icon: React.ElementType; label: string }[] = [
      { view: getHomeView(), icon: Home, label: "Home" },
      { view: 'PERSONAL_DETAIL', icon: UserIcon, label: "My Profile" },
      { view: 'ACCOUNT_SETTING', icon: Settings, label: "Account Settings" },
  ];
  
  const notaryNavItems: { view: View; icon: React.ElementType; label: string }[] = [
      { view: 'NOTARY_DASHBOARD', icon: Home, label: "Workbench" },
      { view: 'NOTARY_REPORTS', icon: BarChart3, label: "Reports" },
      { view: 'PERSONAL_DETAIL', icon: UserIcon, label: "My Profile" },
      { view: 'ACCOUNT_SETTING', icon: Settings, label: "Account Settings" },
  ];
  
  const drawerNavItems: { view: View; icon: React.ElementType; label: string }[] = currentUser.role === UserRole.NOTARY ? notaryNavItems : pensionerNavItems;
  
  const legalNavItems: { view: View; icon: React.ElementType; label: string }[] = [
      { view: 'PRIVACY_POLICY', icon: Shield, label: "Privacy Policy" },
      { view: 'TERMS_OF_SERVICE', icon: FileText, label: "Terms of Service" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {cookieBanner}
      <div className="lg:hidden">
        <div className={`fixed inset-0 flex z-40 ${isDrawerOpen ? '' : 'pointer-events-none'}`}>
          <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsDrawerOpen(false)}></div>
          <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 transition-transform transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className={`absolute top-0 right-0 -mr-12 pt-2 transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}>
              <button onClick={() => setIsDrawerOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg" />
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Sparsh Overseas</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {drawerNavItems.map(item => (
                    <button key={item.label} onClick={() => navigateTo(item.view)} className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left ${currentView === item.view ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        <item.icon className={`mr-4 flex-shrink-0 h-6 w-6 ${currentView === item.view ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                        {item.label}
                    </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Legal</p>
                    {legalNavItems.map(item => (
                        <button key={item.label} onClick={() => navigateTo(item.view)} className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`}>
                            <item.icon className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                            {item.label}
                        </button>
                    ))}
                </div>
              </nav>
            </div>
             <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
               <button onClick={handleLogout} className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <LogOut className="inline-block h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">Logout</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-lg" />
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Sparsh Overseas</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {drawerNavItems.map(item => (
                <button key={item.label} onClick={() => navigateTo(item.view)} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${currentView === item.view ? 'bg-gray-100 dark:bg-gray-900/50 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <item.icon className={`mr-3 flex-shrink-0 h-6 w-6 ${currentView === item.view ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                    {item.label}
                </button>
              ))}
              
               <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Legal</p>
                    {legalNavItems.map(item => (
                        <button key={item.label} onClick={() => navigateTo(item.view)} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`}>
                            <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>
          </div>
           <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <button onClick={handleLogout} className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                <div className="flex-shrink-0">
                    <img className="inline-block h-9 w-9 rounded-full" src={currentUser.avatar} alt="User Avatar" />
                </div>
                <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs font-medium text-red-500 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">Sign Out</p>
                </div>
                </div>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
         <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 border-b dark:border-gray-700">
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <div className="flex items-center">
                    <button onClick={() => setIsDrawerOpen(true)} className="lg:hidden -ml-2 mr-2 p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none">
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{getPageTitle()}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <NotificationCenter />
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
            </div>
        </header>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {renderView()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
