import React from 'react';
import { FileText, Users, Briefcase, Mail, Fingerprint, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Theme } from '../types';

const services = [
  { title: 'Annual Identification', description: 'Secure Life Certificate submissions for SPARSH.', icon: FileText },
  { title: 'Family Pension', description: 'Report status changes and initiate NoK claims.', icon: Users },
  { title: 'Identity Records', description: 'Update Aadhaar and PAN details digitally.', icon: Fingerprint }
];

interface Props {
  navigateTo: (view: 'LOGIN') => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export default function LandingPage({ navigateTo, theme, setTheme }: Props) {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen font-sans">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-2xl font-black text-primary tracking-tight">Sparsh Overseas</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button
                onClick={() => navigateTo('LOGIN')}
                className="btn-primary-standard shadow-lg shadow-primary/20"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="relative pt-24 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center relative z-10">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-300 text-sm font-bold uppercase tracking-widest mb-8 border border-blue-100 dark:border-blue-800 animate-fade-in-up">
              <ShieldCheck className="w-4 h-4 mr-2" /> Secure Defence Accounts Portal
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 dark:text-gray-50 leading-[1.1]">
              Modern Pension Services for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Overseas Veterans</span>
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Experience a streamlined, fully digital workflow for Life Certificates and pension management, accessible from anywhere in the world.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <button
                 onClick={() => navigateTo('LOGIN')}
                 className="btn-primary-standard px-10 py-4 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transform hover:-translate-y-1 transition-all duration-300"
              >
                Access Portal <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <div className="flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 space-x-6 mt-6 sm:mt-0">
                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> Secure</span>
                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> Digital</span>
                <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> Compliant</span>
              </div>
            </div>
          </div>
          
          {/* Decorative Background Element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-gradient-to-tr from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        </div>
        
        <div className="py-24 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid gap-8 md:grid-cols-3">
                    {services.map((service) => (
                        <div key={service.title} className="group p-8 bg-gray-50 dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-white mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                                <service.icon className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{service.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{service.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-900 py-12 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} Sparsh Overseas Portal</p>
        </div>
      </footer>
    </div>
  );
}