
export enum UserRole {
  PENSIONER = 'PENSIONER',
  NOTARY = 'NOTARY',
  ADMIN = 'ADMIN'
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ATTESTED = 'ATTESTED',
  REJECTED = 'REJECTED',
  SENT_TO_SPARSH = 'SENT_TO_SPARSH'
}

export type View = 'LOGIN' | 'LANDING' | 'HOME_PAGE' | 'PENSIONER_DASHBOARD' | 'NOTARY_DASHBOARD' | 'PERSONAL_DETAIL' | 'ACCOUNT_SETTING' | 'SERVICE_UNAVAILABLE' | 'FAMILY_PENSION' | 'UPDATE_EMAIL' | 'UPDATE_ID' | 'REQUEST_DOCUMENTS' | 'NOTARY_REPORTS' | 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE';
export type Theme = 'light' | 'dark';

export interface User {
  id: string; // Auth UID
  displayId: string; // Consistent Uppercase Alphanumeric ID
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  
  // Extended Profile Fields
  fatherHusbandName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;

  // Service Details
  serviceNumber?: string;
  rank?: string;
  ppoNumber?: string;

  // Passport Details
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  passportAuthority?: string;

  // Contact Details
  overseasAddress?: string;
  indianAddress?: string;
  phoneNumber?: string;
  indianPhoneNumber?: string;
}

export interface ALCDocument {
  id: string;
  name: string;
  url: string; // Base64 or URL
  type: string; // MIME type
  file?: File; // Optional raw file for upload optimization
}

export interface ApplicationHistoryItem {
  status: ApplicationStatus;
  timestamp: string;
  details?: string;
}

export interface ALCApplication {
  id: string;
  pensionerId: string;
  pensionerName: string;
  submittedDate: string;
  status: ApplicationStatus;

  // Personal Details
  fatherHusbandName?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality?: string;

  // Contact Details
  email?: string;
  overseasAddress?: string;
  indianAddress?: string;
  phoneNumber?: string;
  indianPhoneNumber?: string;

  // Service Details
  serviceNumber: string;
  rank?: string;
  ppoNumber: string;

  // Passport Details
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  passportAuthority?: string;
  
  // Documents
  documents: ALCDocument[];
  pensionerSignature?: string; // Data URL
  
  // Notary Section
  notaryId?: string;
  notaryName?: string;
  notaryComments?: string;
  notarySignature?: string;
  attestationDate?: string;
  rejectionReason?: string;

  // History Log
  history?: ApplicationHistoryItem[];
}

export interface MockStore {
  currentUser: User | null;
  applications: ALCApplication[];
}
