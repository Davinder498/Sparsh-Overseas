
import { db, storage, auth } from './firebaseConfig';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; 
import { ALCApplication, ApplicationStatus, User, UserRole } from '../types';
import { sendNotification, getStatusMessage } from './pushNotificationService';
import { logAudit, AuditAction } from './auditService';

// Helper: Generate a consistent Capital Letter + Numeric ID
export const generateSecureID = (length: number = 10, prefix: string = ''): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

// Helper: Convert Base64 Data URI to Blob for robust upload
const dataURItoBlob = (dataURI: string) => {
  try {
    if (!dataURI || !dataURI.includes(',')) {
        return null;
    }
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  } catch (e) {
    console.error("Error converting data URI to blob", e);
    throw new Error("Failed to process file for upload.");
  }
};

// --- Authentication ---

export const registerUser = async (email: string, pass: string, name: string, role: UserRole): Promise<User> => {
  const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
  const uid = userCredential.user?.uid;
  if (!uid) throw new Error("User creation failed");

  const displayId = generateSecureID(8, role === UserRole.PENSIONER ? 'PS-' : 'NT-');

  const newUser: User = {
    id: uid,
    displayId: displayId,
    name,
    email,
    role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=fff`,
    fatherHusbandName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: '',
    serviceNumber: '',
    rank: '',
    ppoNumber: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    passportAuthority: '',
    overseasAddress: '',
    indianAddress: '',
    phoneNumber: '',
    indianPhoneNumber: '',
  };

  await db.collection("users").doc(uid).set(newUser);
  logAudit(uid, AuditAction.LOGIN, undefined, 'User Registered');
  return newUser;
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  const userCredential = await auth.signInWithEmailAndPassword(email, pass);
  const uid = userCredential.user?.uid;
  if (!uid) throw new Error("Login failed");

  const userDocRef = db.collection("users").doc(uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data() as User;
    
    // Recovery: If legacy user has no displayId, generate one
    if (!userData.displayId) {
        const displayId = generateSecureID(8, userData.role === UserRole.PENSIONER ? 'PS-' : 'NT-');
        await userDocRef.update({ displayId });
        userData.displayId = displayId;
    }

    logAudit(uid, AuditAction.LOGIN, undefined, 'Email Login');
    return userData;
  } else {
    throw new Error("User profile not found.");
  }
};

export const loginWithGoogle = async (role: UserRole = UserRole.PENSIONER): Promise<User> => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/gmail.send');

  const authDomain = window.location.hostname || 'sparsh-life-certificate-nri.firebaseapp.com';
  provider.setCustomParameters({ 'auth_domain': authDomain });
  
  const result = await auth.signInWithPopup(provider);
  const user = result.user!;
  
  logAudit(user.uid, AuditAction.LOGIN, undefined, 'Google Login');

  const userDocRef = db.collection("users").doc(user.uid);
  const userDoc = await userDocRef.get();
  
  if (userDoc.exists) {
    const userData = userDoc.data() as User;
    if (!userData.displayId) {
        const displayId = generateSecureID(8, userData.role === UserRole.PENSIONER ? 'PS-' : 'NT-');
        await userDocRef.update({ displayId });
        userData.displayId = displayId;
    }
    return userData;
  } else {
    const displayId = generateSecureID(8, role === UserRole.PENSIONER ? 'PS-' : 'NT-');
    const newUser: User = {
        id: user.uid,
        displayId: displayId,
        name: user.displayName || "Unknown",
        email: user.email || "",
        role: role, 
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=1e40af&color=fff`,
        fatherHusbandName: '', dateOfBirth: '', placeOfBirth: '', nationality: '', serviceNumber: '', rank: '', ppoNumber: '',
        passportNumber: '', passportIssueDate: '', passportExpiryDate: '', passportAuthority: '', overseasAddress: '',
        indianAddress: '', phoneNumber: '', indianPhoneNumber: ''
    };
    await userDocRef.set(newUser);
    return newUser;
  }
};

export const linkGoogleAccount = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user signed in.");

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    const authDomain = window.location.hostname || 'sparsh-life-certificate-nri.firebaseapp.com';
    provider.setCustomParameters({ 'auth_domain': authDomain });

    try {
        const result = await user.linkWithPopup(provider);
        const credential = result.credential as firebase.auth.OAuthCredential;
        const token = credential?.accessToken;
        logAudit(user.uid, AuditAction.LINK_GOOGLE, undefined, 'Linked Google Account');
        if (token) {
            sessionStorage.setItem('google_access_token', token);
            return token;
        } else throw new Error("No token returned.");
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use') {
             const credential = error.credential as firebase.auth.OAuthCredential;
             if (credential?.accessToken) {
                 sessionStorage.setItem('google_access_token', credential.accessToken);
                 return credential.accessToken;
             }
        }
        throw error;
    }
};

export const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("No user signed in.");
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
  await user.reauthenticateWithCredential(credential);
  await user.updatePassword(newPassword);
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  const userRef = db.collection("users").doc(userId);
  await userRef.update(data);
};

export const exportUserData = async (userId: string): Promise<object> => {
  logAudit(userId, AuditAction.EXPORT_DATA, undefined, 'Exported Data');
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const appsSnapshot = await db.collection("applications").where("pensionerId", "==", userId).get();
  const applications = appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { profile: userData, applications, exportDate: new Date().toISOString() };
};

export const deleteUserAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  const userId = user.uid;
  logAudit(userId, AuditAction.DELETE_ACCOUNT, undefined, 'Initiated account deletion');
  await db.collection("users").doc(userId).delete();
  await user.delete();
};

// --- Applications ---

export const getApplications = (role: UserRole, userId: string, onUpdate: (apps: ALCApplication[]) => void): (() => void) => {
  let q: firebase.firestore.Query = db.collection("applications");
  if (role === UserRole.PENSIONER) {
    q = q.where("pensionerId", "==", userId);
  } else {
    q = q.where("status", "in", [ApplicationStatus.SUBMITTED, ApplicationStatus.ATTESTED, ApplicationStatus.REJECTED]);
  }

  const unsubscribe = q.onSnapshot((querySnapshot) => {
    let apps: ALCApplication[] = [];
    querySnapshot.forEach((docSnap) => {
      const app = { id: docSnap.id, ...docSnap.data() } as ALCApplication;
      if (role === UserRole.NOTARY) {
        if (app.status === ApplicationStatus.SUBMITTED || app.notaryId === userId) apps.push(app);
      } else apps.push(app);
    });
    onUpdate(apps.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()));
  });
  return unsubscribe;
};

export const getApplicationsForReport = async (notaryId: string): Promise<ALCApplication[]> => {
  const querySnapshot = await db.collection("applications")
    .where("notaryId", "==", notaryId)
    .where("status", "in", [ApplicationStatus.ATTESTED, ApplicationStatus.REJECTED])
    .get();
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ALCApplication));
};

export const createApplication = async (appData: Omit<ALCApplication, 'id' | 'status' | 'submittedDate'>): Promise<ALCApplication> => {
    const timestamp = new Date().toISOString();
    const userId = appData.pensionerId;
    const appId = generateSecureID(10, 'ALC-');
    
    let sigUrl = '';
    if (appData.pensionerSignature) {
        const sigRef = storage.ref(`signatures/${userId}/${Date.now()}_sig.png`);
        const sigBlob = dataURItoBlob(appData.pensionerSignature);
        if (sigBlob) {
          await sigRef.put(sigBlob, { contentType: 'image/png' });
          sigUrl = await sigRef.getDownloadURL();
        }
    }

    const processedDocs: any[] = [];
    for (const docItem of appData.documents) {
        const fileRef = storage.ref(`documents/${userId}/${Date.now()}_${docItem.name}`);
        const fileToUpload = docItem.file ? docItem.file : dataURItoBlob(docItem.url);
        if (fileToUpload) {
            await fileRef.put(fileToUpload, { contentType: docItem.type });
            const downloadUrl = await fileRef.getDownloadURL();
            processedDocs.push({ ...docItem, url: downloadUrl, file: undefined });
        }
    }

    const newAppPayload = {
      ...appData,
      pensionerSignature: sigUrl,
      documents: processedDocs,
      status: ApplicationStatus.SUBMITTED,
      submittedDate: timestamp,
      history: [{ status: ApplicationStatus.SUBMITTED, timestamp: timestamp, details: 'Application submitted' }]
    };

    await db.collection("applications").doc(appId).set(newAppPayload);
    logAudit(userId, AuditAction.CREATE_APPLICATION, appId, 'Application Submitted');
    return { id: appId, ...newAppPayload } as ALCApplication;
};

export const updateApplicationStatus = async (appId: string, status: ApplicationStatus, notaryData?: Partial<ALCApplication>): Promise<void> => {
    const appRef = db.collection("applications").doc(appId);
    const timestamp = new Date().toISOString();
    let finalNotaryData = { ...notaryData };

    if (notaryData?.notarySignature?.startsWith('data:') && notaryData.notaryId) {
        const sigRef = storage.ref(`signatures/${notaryData.notaryId}/${Date.now()}_${appId}.png`);
        const sigBlob = dataURItoBlob(notaryData.notarySignature);
        if (sigBlob) {
            await sigRef.put(sigBlob, { contentType: 'image/png' });
            finalNotaryData.notarySignature = await sigRef.getDownloadURL();
        }
    }

    const snap = await appRef.get();
    const currentHistory = snap.exists ? snap.data()?.history || [] : [];
    
    await appRef.update({
        status,
        ...finalNotaryData,
        history: [ ...currentHistory, { status, timestamp, details: `Status updated to ${status}` } ]
    });
    
    const currentUser = auth.currentUser;
    if(currentUser) logAudit(currentUser.uid, AuditAction.UPDATE_STATUS, appId, `Updated to ${status}`);
};

export const getApplicationById = async (id: string): Promise<ALCApplication | undefined> => {
    const snap = await db.collection("applications").doc(id).get();
    if (snap.exists) {
        const app = { id: snap.id, ...snap.data() } as ALCApplication;
        if(auth.currentUser) logAudit(auth.currentUser.uid, AuditAction.VIEW_APPLICATION, id, 'Viewed Application');
        return app;
    }
    return undefined;
};
