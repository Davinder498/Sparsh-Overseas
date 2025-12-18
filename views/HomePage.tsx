
import React from 'react';
import { User, View } from '../types';
import { FileText, Users, Briefcase, Mail, Fingerprint, ChevronRight, Info, Archive } from 'lucide-react';

interface Props {
  user: User;
  navigateTo: (view: View, params?: { title: string }) => void;
}

const services = [
  {
    title: 'Annual Identification',
    description: 'Submit your Life Certificate (Jeevan Pramaan) for SPARSH.',
    icon: FileText,
    view: 'PENSIONER_DASHBOARD',
  },
  {
    title: 'Initiate Family Pension',
    description: 'Report the death of a pensioner to start family pension.',
    icon: Users,
    view: 'FAMILY_PENSION',
  },
  {
    title: 'My Documents',
    description: 'Request Form-16, Accounts Statement, or PPO copies.',
    icon: Archive,
    view: 'REQUEST_DOCUMENTS',
  },
  {
    title: 'Update Email',
    description: 'Update your email for official SPARSH notifications.',
    icon: Mail,
    view: 'UPDATE_EMAIL',
  },
  {
    title: 'Update Aadhaar/PAN',
    description: 'Keep your active identification records up to date.',
    icon: Fingerprint,
    view: 'UPDATE_ID',
  },
  {
    title: 'Report Employment',
    description: 'Report employment in Government service outside India.',
    icon: Briefcase,
    view: 'REPORT_EMPLOYMENT',
  },
];

export default function HomePage({ user, navigateTo }: Props) {
  const handleServiceClick = (service: typeof services[0]) => {
    const availableServices: View[] = ['PENSIONER_DASHBOARD', 'FAMILY_PENSION', 'UPDATE_EMAIL', 'UPDATE_ID', 'REQUEST_DOCUMENTS'];
    if (availableServices.includes(service.view as View)) {
      navigateTo(service.view as View);
    } else {
      navigateTo('SERVICE_UNAVAILABLE', { title: service.title });
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Welcome back, {user.name.split(' ')[0]}</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Select a secure service from the dashboard below.</p>
      </div>

      <div className="mb-10 bg-gradient-to-r from-primary/5 to-primary/0 dark:from-primary/10 dark:to-transparent border border-primary/10 dark:border-primary/20 p-6 rounded-2xl flex items-start">
        <div className="bg-primary-soft dark:bg-primary/20 p-2.5 rounded-xl mr-5">
          <Info className="h-6 w-6 text-primary dark:text-accent" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">SPARSH Identification Window</p>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
            Annual Life Certificates remain valid for 12 months from submission. NRI pensioners are encouraged to submit early to ensure continuous pension disbursements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <button
            key={service.title}
            onClick={() => handleServiceClick(service)}
            className="group relative flex flex-col p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                <service.icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 group-hover:text-primary transition-colors">{service.title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{service.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
