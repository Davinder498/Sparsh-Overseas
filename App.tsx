
declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}

import React, { useState, useEffect } from 'react';
import { User, UserRole, View, Theme } from './types';
import { loginUser, registerUser, updateUserProfile, loginWithGoogle, deleteUserAccount } from './services/firebaseBackend';
import { Shield, LogOut, User as UserIcon, Menu, Home, Loader2, Save, Trash2, ChevronRight } from 'lucide-react';
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
import { auth, db } from './services/firebaseConfig';
import FamilyPensionForm from './views/FamilyPensionForm';
import UpdateEmailForm from './views/UpdateEmailForm';
import UpdateIdForm from './views/UpdateIdForm';
import RequestDocumentsForm from './views/RequestDocumentsForm';
import { useNotifier } from './contexts/NotificationContext';
import { initErrorMonitoring } from './services/errorMonitoringService';
import NotificationCenter from './components/NotificationCenter';
import { requestNotificationPermission } from './services/pushNotificationService';

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
  <div className="w-full">
    <label className="form-label-standard">{label}</label>
    {editMode ? (
      area ? <textarea name={name} value={value || ''} onChange={onChange} rows={3} className="form-input-standard"/>
           : <input type={type} name={name} value={value || ''} onChange={onChange} className="form-input-standard"/>
    ) : (
      <p className="mt-1 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 text-sm text-gray-900 dark:text-gray-100">
        {value || <span className="text-gray-400 italic">Not set</span>}
      </p>
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
        const userDocRef = db.collection("users").doc(firebaseUser.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          const userProfile = userDoc.data() as User;
          setCurrentUser(userProfile);
          setCurrentView(userProfile.role === UserRole.PENSIONER ? 'HOME_PAGE' : 'NOTARY_DASHBOARD');
          requestNotificationPermission();
        } else {
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
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    sessionStorage.removeItem('google_access_token');
    auth.signOut().finally(() => {
        setCurrentUser(null);
        setCurrentView('LANDING');
        setIsDrawerOpen(false);
    });
  };

  const navigateTo = (view: View, params?: { title: string }) => {
    if (view === 'PRIVACY_POLICY' || view === 'TERMS_OF_SERVICE') {
        setCurrentView(view);
        setIsDrawerOpen(false);
        return;
    }
    if (view !== 'LOGIN' && view !== 'LANDING' && !currentUser) return;
    if (view === 'SERVICE_UNAVAILABLE' && params?.title) setUnavailableServiceTitle(params.title);
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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const user = isRegistering ? await registerUser(email, password, name, role) : await loginUser(email, password);
        setCurrentUser(user);
        notifier.addToast(`Welcome, ${user.name.split(' ')[0]}!`, 'success');
        setCurrentView(user.role === UserRole.PENSIONER ? 'HOME_PAGE' : 'NOTARY_DASHBOARD');
      } catch (err: any) {
        notifier.addToast(err.message || "Auth failed", 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const user = await loginWithGoogle(role);
            setCurrentUser(user);
            setCurrentView(user.role === UserRole.PENSIONER ? 'HOME_PAGE' : 'NOTARY_DASHBOARD');
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') notifier.addToast(err.message || "Google Login failed", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary-soft dark:bg-primary/20 rounded-xl mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{isRegistering ? 'Create Account' : 'Sign In'}</h2>
            <p className="mt-1 text-sm text-gray-500">Access your secure Sparsh Overseas portal</p>
          </div>
          
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3 text-left">
                {isRegistering && (
                  <div>
                    <label className="form-label-standard">Full Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="form-input-standard" placeholder="Enter your full name" />
                  </div>
                )}
                <div>
                  <label className="form-label-standard">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input-standard" placeholder="name@example.com" />
                </div>
                <div>
                  <label className="form-label-standard">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="form-input-standard" placeholder="••••••••" />
                </div>
                {isRegistering && (
                  <div>
                    <label className="form-label-standard">Account Type</label>
                    <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="form-input-standard">
                        <option value={UserRole.PENSIONER}>Pensioner</option>
                        <option value={UserRole.NOTARY}>Notary Public</option>
                    </select>
                  </div>
                )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary-standard w-full mt-4">
                {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (isRegistering ? 'Register' : 'Sign In')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or continue with</span></div>
          </div>

          <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm h-[46px]">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </button>
          
          <div className="text-center pt-2">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-medium text-primary hover:text-primary-dark transition-all">
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
    const [formData, setFormData] = useState<Partial<User>>({ ...currentUser });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateUserProfile(currentUser!.id, formData);
            setCurrentUser(prev => prev ? { ...prev, ...formData } : null);
            notifier.addToast('Profile updated!', 'success');
            setIsEditing(false);
        } catch (error: any) {
            notifier.addToast('Update failed', 'error');
        } finally { setIsLoading(false); }
    };
    
    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Personal Information</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your service profile and contact details.</p>
                </div>
                {!isEditing && <button onClick={() => setIsEditing(true)} className="btn-secondary-standard py-2 px-4 text-xs">Edit Profile</button>}
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <DetailItem label="Full Name" name="name" value={formData.name} editMode={isEditing} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    <DetailItem label="Service No" name="serviceNumber" value={formData.serviceNumber} editMode={isEditing} onChange={(e) => setFormData({...formData, serviceNumber: e.target.value})} />
                    <DetailItem label="Rank" name="rank" value={formData.rank} editMode={isEditing} onChange={(e) => setFormData({...formData, rank: e.target.value})} />
                    <DetailItem label="PPO Number" name="ppoNumber" value={formData.ppoNumber} editMode={isEditing} onChange={(e) => setFormData({...formData, ppoNumber: e.target.value})} />
                </div>
                {isEditing && (
                    <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-800 space-x-4">
                        <button type="button" onClick={() => setIsEditing(false)} className="btn-text-standard">Cancel</button>
                        <button type="submit" disabled={isLoading} className="btn-primary-standard">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
  };
  
  const getViewTitle = (): string => {
    switch (currentView) {
      case 'HOME_PAGE': return 'Dashboard';
      case 'PENSIONER_DASHBOARD': return 'Life Certificates';
      case 'NOTARY_DASHBOARD': return 'Notary Review';
      case 'PERSONAL_DETAIL': return 'My Profile';
      case 'ACCOUNT_SETTING': return 'Settings';
      case 'FAMILY_PENSION': return 'Family Pension';
      case 'UPDATE_EMAIL': return 'Contact Details';
      case 'UPDATE_ID': return 'Identity Update';
      case 'REQUEST_DOCUMENTS': return 'Document Requests';
      default: return '';
    }
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

  const AccountSettings = () => {
    const notifier = useNotifier();
    const handleDelete = async () => {
        if(!window.confirm("Confirm account deletion? All your data will be permanently removed.")) return;
        try { await deleteUserAccount(); notifier.addToast('Account deleted', 'info'); } 
        catch(e) { notifier.addToast('Deletion failed', 'error'); }
    };
    return (
        <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-red-500" /> Security & Privacy
            </h3>
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
              <h4 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase">Danger Zone</h4>
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">Permanently deleting your account will remove all submitted certificates and personal service history from the Sparsh Overseas portal.</p>
              <button onClick={handleDelete} className="mt-5 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all text-sm">Delete Account Permanently</button>
            </div>
        </div>
    );
  };

  if (loadingAuth) return <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  
  const isPublicView = ['LANDING', 'LOGIN', 'PRIVACY_POLICY', 'TERMS_OF_SERVICE'].includes(currentView);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <CookieConsent />
      
      {!isPublicView && (
        <>
          {/* Mobile Sidebar */}
          <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
            <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900 h-full shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
               <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xl font-black text-primary tracking-tight">Sparsh Overseas</span>
                  <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 p-2"><Menu className="h-6 w-6" /></button>
               </div>
               <nav className="mt-6 px-4 space-y-2">
                  <button onClick={() => navigateTo(getHomeView())} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${currentView === getHomeView() ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-primary-soft dark:hover:bg-gray-800'}`}>
                      <Home className="mr-4 h-5 w-5" /> Home
                  </button>
                  <button onClick={() => navigateTo('PERSONAL_DETAIL')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${currentView === 'PERSONAL_DETAIL' ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-primary-soft dark:hover:bg-gray-800'}`}>
                      <UserIcon className="mr-4 h-5 w-5" /> My Profile
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold mt-auto">
                      <LogOut className="mr-4 h-5 w-5" /> Sign Out
                  </button>
               </nav>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 shadow-sm">
            <div className="p-8 border-b border-gray-50 dark:border-gray-800/50">
              <span className="text-2xl font-black text-primary tracking-tight">Sparsh Overseas</span>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Defence Accounts Portal</p>
            </div>
            <nav className="mt-8 px-4 space-y-2 flex-1">
                <button onClick={() => navigateTo(getHomeView())} className={`w-full flex items-center px-5 py-3.5 rounded-xl transition-all font-semibold group ${currentView === getHomeView() ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary'}`}>
                    <Home className={`mr-3 h-5 w-5 transition-colors ${currentView === getHomeView() ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} /> Home
                </button>
                <button onClick={() => navigateTo('PERSONAL_DETAIL')} className={`w-full flex items-center px-5 py-3.5 rounded-xl transition-all font-semibold group ${currentView === 'PERSONAL_DETAIL' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary'}`}>
                    <UserIcon className={`mr-3 h-5 w-5 transition-colors ${currentView === 'PERSONAL_DETAIL' ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} /> My Profile
                </button>
            </nav>
            <div className="p-6 mt-auto border-t border-gray-50 dark:border-gray-800/50">
                <button onClick={handleLogout} className="w-full flex items-center px-5 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-bold group">
                    <LogOut className="mr-3 h-5 w-5 transition-transform group-hover:translate-x-1" /> Sign Out
                </button>
            </div>
          </aside>
        </>
      )}

      <div className={`${!isPublicView ? 'lg:pl-72' : ''} flex flex-col flex-1`}>
         {!isPublicView && (
           <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800 h-20 flex items-center justify-between px-6 sm:px-10">
              <div className="flex items-center">
                  <button onClick={() => setIsDrawerOpen(true)} className="lg:hidden p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors mr-3 border dark:border-gray-800"><Menu className="h-5 w-5" /></button>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center">
                    {getViewTitle()}
                    <ChevronRight className="h-4 w-4 mx-2 text-gray-300" />
                  </h1>
              </div>
              <div className="flex items-center space-x-3">
                  <NotificationCenter />
                  <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
          </header>
         )}
        <main className={`flex-1 ${!isPublicView ? 'py-8 px-6 sm:px-10' : ''}`}>
            {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
