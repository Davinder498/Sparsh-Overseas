

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
    description: 'Submit your annual Life Certificate (Jeevan Pramaan) for SPARSH.',
    icon: FileText,
    view: 'PENSIONER_DASHBOARD',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    darkBgColor: 'dark:bg-blue-900/30',
    darkIconColor: 'dark:text-blue-400',
  },
  {
    title: 'Initiate Family Pension',
    description: 'Report the death of an existing pensioner to start the family pension process.',
    icon: Users,
    view: 'FAMILY_PENSION',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    darkBgColor: 'dark:bg-purple-900/30',
    darkIconColor: 'dark:text-purple-400',
  },
  {
    title: 'My Documents',
    description: 'Request Form-16, Statement of Accounts, or a copy of your PPO.',
    icon: Archive,
    view: 'REQUEST_DOCUMENTS',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    darkBgColor: 'dark:bg-green-900/30',
    darkIconColor: 'dark:text-green-400',
  },
  {
    title: 'Update Email',
    description: 'Update your email address for receipt of notifications from SPARSH.',
    icon: Mail,
    view: 'UPDATE_EMAIL',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    darkBgColor: 'dark:bg-orange-900/30',
    darkIconColor: 'dark:text-orange-400',
  },
  {
    title: 'Update Aadhaar/PAN',
    description: 'Update Aadhaar and PAN details for active pensioners in SPARSH.',
    icon: Fingerprint,
    view: 'UPDATE_ID',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    darkBgColor: 'dark:bg-rose-900/30',
    darkIconColor: 'dark:text-rose-400',
  },
  {
    title: 'Report Employment',
    description: 'For reporting employment/re-employment in Government service outside India.',
    icon: Briefcase,
    view: 'REPORT_EMPLOYMENT',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    darkBgColor: 'dark:bg-indigo-900/30',
    darkIconColor: 'dark:text-indigo-400',
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
    <div className="px-4 py-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome, {user.name.split(' ')[0]}!</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select a service below to get started. All services are digitally verified and secure.
        </p>
      </div>

      <div className="mb-8 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-lg flex items-start">
        <Info className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium">Important Information from SPARSH</p>
          <p className="text-xs mt-1">
            SPARSH accepts Life Certificates (जीवन प्रमाण पत्र) any time during the year, and they remain valid for 12 months from the date of submission. NRI/NDG pensioners can submit at any time to avoid the rush in November each year.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <button
            key={service.title}
            onClick={() => handleServiceClick(service)}
            className={`group w-full text-left p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-lg ${service.bgColor} ${service.darkBgColor} flex items-center justify-center`}>
                <service.icon className={`w-6 h-6 ${service.iconColor} ${service.darkIconColor}`} />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{service.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}