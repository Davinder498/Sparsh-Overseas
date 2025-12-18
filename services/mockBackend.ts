import { ALCApplication, ApplicationStatus, User, UserRole } from '../types';

// Mock Data
const MOCK_PENSIONER: User = {
  id: 'u1',
  // Added missing displayId property
  displayId: 'PS-MOCK101',
  name: 'Subedar Rajinder Singh (Retd)',
  email: 'rajinder.singh@example.com',
  role: UserRole.PENSIONER,
  avatar: 'https://picsum.photos/200',
  
  // Extended Profile Data
  fatherHusbandName: 'Late Havaldar Harnam Singh',
  dateOfBirth: '1955-04-15',
  placeOfBirth: 'Jalandhar, Punjab',
  nationality: 'Indian',
  serviceNumber: '12345678X',
  rank: 'Subedar',
  ppoNumber: 'PPO-2023-998877',
  passportNumber: 'Z1234567',
  passportIssueDate: '2015-01-01',
  passportExpiryDate: '2025-01-01',
  passportAuthority: 'CGI, London',
  overseasAddress: '123 Baker Street, London, UK',
  indianAddress: 'VPO Jalandhar, Punjab, India',
  phoneNumber: '+44 7700 900000',
  indianPhoneNumber: '+91 98765 43210',
};

const MOCK_NOTARY: User = {
  id: 'u2',
  // Added missing displayId property
  displayId: 'NT-MOCK202',
  name: 'Sarah Jenkins, JD',
  email: 'sarah.notary@example.com',
  role: UserRole.NOTARY,
  avatar: 'https://picsum.photos/201'
};

// In-memory store
let applications: ALCApplication[] = [
  {
    id: 'alc-101',
    pensionerId: 'u1',
    pensionerName: 'Subedar Rajinder Singh (Retd)',
    fatherHusbandName: 'Late Havaldar Harnam Singh',
    serviceNumber: '12345678X',
    rank: 'Subedar',
    ppoNumber: 'PPO-2023-998877',
    dateOfBirth: '1955-04-15',
    placeOfBirth: 'Jalandhar, Punjab',
    nationality: 'Indian',
    email: 'rajinder.singh@example.com',
    passportNumber: 'Z1234567',
    passportIssueDate: '2015-01-01',
    passportExpiryDate: '2025-01-01',
    passportAuthority: 'CGI, London',
    overseasAddress: '123 Baker Street, London, UK',
    indianAddress: 'VPO Jalandhar, Punjab, India',
    phoneNumber: '+44 7700 900000',
    indianPhoneNumber: '+91 98765 43210',
    submittedDate: new Date().toISOString(),
    status: ApplicationStatus.SUBMITTED,
    documents: [
      {
        id: 'doc-1',
        name: 'Passport Front Page',
        url: 'https://picsum.photos/400/250',
        type: 'image/jpeg'
      }
    ],
    pensionerSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // dummy
    history: [
      {
        status: ApplicationStatus.SUBMITTED,
        timestamp: new Date().toISOString(),
        details: 'Application submitted by pensioner'
      }
    ]
  }
];

export const login = async (role: UserRole): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(role === UserRole.PENSIONER ? MOCK_PENSIONER : MOCK_NOTARY);
    }, 500);
  });
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
        // Simple mock auth
        if (!email || !pass) {
            reject(new Error("Invalid credentials"));
            return;
        }
        
        if (email.toLowerCase().includes('notary')) {
            resolve({ ...MOCK_NOTARY, email });
        } else {
            resolve({ ...MOCK_PENSIONER, email });
        }
    }, 800);
  });
};

export const registerUser = async (email: string, pass: string, name: string, role: UserRole): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'u-' + Math.floor(Math.random() * 10000),
          // Added missing displayId property
          displayId: (role === UserRole.PENSIONER ? 'PS-' : 'NT-') + Math.floor(Math.random() * 10000),
          name,
          email,
          role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });
      }, 800);
    });
};

export const getApplications = (role: UserRole, userId: string): ALCApplication[] => {
  if (role === UserRole.PENSIONER) {
    return applications.filter(app => app.pensionerId === userId);
  } else {
    // Notary sees all submitted applications or those they already processed
    return applications.filter(app => app.status !== ApplicationStatus.DRAFT);
  }
};

export const createApplication = async (app: Omit<ALCApplication, 'id' | 'status' | 'submittedDate'>): Promise<ALCApplication> => {
  const timestamp = new Date().toISOString();
  const newApp: ALCApplication = {
    ...app,
    id: `alc-${Math.floor(Math.random() * 10000)}`,
    status: ApplicationStatus.SUBMITTED,
    submittedDate: timestamp,
    history: [
      {
        status: ApplicationStatus.SUBMITTED,
        timestamp: timestamp,
        details: 'Application submitted successfully'
      }
    ]
  };
  applications.unshift(newApp); // Add to top
  return newApp;
};

export const updateApplicationStatus = async (
  appId: string, 
  status: ApplicationStatus, 
  notaryData?: Partial<ALCApplication>
): Promise<void> => {
  const timestamp = new Date().toISOString();
  applications = applications.map(app => {
    if (app.id === appId) {
      const history = app.history || [];
      let details = '';
      
      if (status === ApplicationStatus.ATTESTED) details = `Attested by Notary: ${notaryData?.notaryName || 'Unknown'}`;
      else if (status === ApplicationStatus.REJECTED) details = `Rejected by Notary: ${notaryData?.rejectionReason || 'No reason provided'}`;
      else if (status === ApplicationStatus.SENT_TO_SPARSH) details = 'Transmitted to SPARSH Defense Pension System';

      return { 
        ...app, 
        status, 
        ...notaryData,
        history: [
          ...history,
          {
            status,
            timestamp,
            details
          }
        ]
      };
    }
    return app;
  });
};

export const getApplicationById = (id: string): ALCApplication | undefined => {
  return applications.find(a => a.id === id);
};