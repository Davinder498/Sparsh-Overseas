
import React from 'react';
import { FileText, Users, Briefcase, Mail, Fingerprint, Shield, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { Theme } from '../types';

const services = [
  { title: 'Annual Identification', description: 'Submit your annual Life Certificate (Jeevan Pramaan) for SPARSH.', icon: FileText },
  { title: 'Initiate Family Pension', description: 'Report the death of an existing pensioner to start the family pension process.', icon: Users },
  { title: 'Report Employment', description: 'Report employment/re-employment in Government service outside India.', icon: Briefcase },
  { title: 'Update Email', description: 'Update your email for notifications from SPARSH.', icon: Mail },
  { title: 'Update Aadhaar/PAN', description: 'Update Aadhaar and PAN details for active pensioners.', icon: Fingerprint }
];

interface Props {
  navigateTo: (view: 'LOGIN') => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export default function LandingPage({ navigateTo, theme, setTheme }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg shadow-sm" />
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Sparsh Overseas</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button
                onClick={() => navigateTo('LOGIN')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-800"
              >
                Login / Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative pt-16 pb-20 text-center bg-gray-50 dark:bg-gray-900/50">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Digital Services for <span className="text-primary">Defence Pensioners</span> Overseas
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
              A secure, streamlined, and fully digital workflow to manage your pension requirements from anywhere in the world.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                 onClick={() => navigateTo('LOGIN')}
                 className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-800 shadow-lg"
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Services Section */}
        <div className="py-20 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base font-semibold text-primary uppercase tracking-wider">Our Services</h2>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">
                        A Modern Approach to Pension Management
                    </p>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                        We provide a suite of digital tools to simplify your obligations to SPARSH.
                    </p>
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <div key={service.title} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                                <span className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                                    <service.icon className="h-6 w-6" aria-hidden="true" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{service.title}</h3>
                                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">{service.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gray-50 dark:bg-gray-900/50 py-20">
             <div className="max-w-4xl mx-auto text-center px-4">
                 <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Simple, Secure, and Swift</h2>
                 <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Our three-step digital process ensures your requirements are met with ease and confidence.</p>
                 <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                         <span className="text-primary font-bold text-4xl">1</span>
                         <h3 className="mt-2 text-lg font-medium">Register & Upload</h3>
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a secure account and upload your identification documents. Our smart system can pre-fill your forms.</p>
                     </div>
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                         <span className="text-primary font-bold text-4xl">2</span>
                         <h3 className="mt-2 text-lg font-medium">Digital Notary Review</h3>
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your application is sent to a certified notary for digital verification and attestation.</p>
                     </div>
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                         <span className="text-primary font-bold text-4xl">3</span>
                         <h3 className="mt-2 text-lg font-medium">Submit to SPARSH</h3>
                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Once attested, submit your certificate directly to SPARSH with a single click, using your own email account.</p>
                     </div>
                 </div>
             </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Sparsh Overseas Digital Portal. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
