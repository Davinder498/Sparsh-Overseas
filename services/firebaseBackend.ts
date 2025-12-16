
import { db, storage, auth } from './firebaseConfig';
// Fix: Import the compat version of Firebase to access namespaced APIs and types.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Ensure the auth module is loaded for compat APIs
// Fix: Remove direct named imports for AuthProviders. They are accessed via firebase.auth.
// import { GoogleAuthProvider, EmailAuthProvider } from 'firebase/compat/auth'; 
import { ALCApplication, ApplicationStatus, User, UserRole } from '../types';

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
  // Fix: Use the v8 compat namespaced auth API
  const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
  const uid = userCredential.user?.uid;
  if (!uid) throw new Error("User creation failed");

  const newUser: User = {
    id: uid,
    name,
    email,
    role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
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

  // Save profile to Firestore, initializing all fields
  // Fix: Use the v8 compat namespaced firestore API
  await db.collection("users").doc(uid).set(newUser);
  return newUser;
};

export const loginUser = async (email: string, pass: string): Promise<User> => {
  // Fix: Use the v8 compat namespaced auth API
  const userCredential = await auth.signInWithEmailAndPassword(email, pass);
  const uid = userCredential.user?.uid;
  if (!uid) throw new Error("Login failed");

  // Fetch profile
  // Fix: Use the v8 compat namespaced firestore API
  const userDocRef = db.collection("users").doc(uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data() as User;
    // Fallback: If profile is somehow incomplete, merge with a default structure
    if (!userData.hasOwnProperty('fatherHusbandName')) {
        console.warn("User profile is incomplete. Merging with default structure.");
        const defaultProfile = {
            fatherHusbandName: '', dateOfBirth: '', placeOfBirth: '', nationality: '', serviceNumber: '', rank: '', ppoNumber: '',
            passportNumber: '', passportIssueDate: '', passportExpiryDate: '', passportAuthority: '', overseasAddress: '',
            indianAddress: '', phoneNumber: '', indianPhoneNumber: ''
        };
        // Fix: Use the v8 compat namespaced firestore API
        await userDocRef.set(defaultProfile, { merge: true });
        return { ...defaultProfile, ...userData } as User;
    }
    return userData as User;
  } else {
    console.error("User authenticated but profile missing. This should have been created on registration.");
    throw new Error("User profile not found in database.");
  }
};

export const loginWithGoogle = async (role: UserRole = UserRole.PENSIONER): Promise<User> => {
  // Fix: Use the v8 compat namespaced auth API for GoogleAuthProvider
  const provider = new firebase.auth.GoogleAuthProvider();
  // Request permission to send emails on user's behalf
  provider.addScope('https://www.googleapis.com/auth/gmail.send');

  // FIX: Explicitly set auth_domain to the current hostname, with a fallback to the default.
  // This is critical for sandboxed iframes where the origin can be dynamic (a GUID) or even empty.
  // It tells the popup the correct origin to communicate with via postMessage.
  const authDomain = window.location.hostname || 'sparsh-life-certificate-nri.firebaseapp.com';
  provider.setCustomParameters({
    'auth_domain': authDomain
  });
  
  // Fix: Use the v8 compat namespaced auth API
  const result = await auth.signInWithPopup(provider);
  
  // This gives you a Google Access Token. You can use it to access the Google API.
  // Use result.credential directly in compat/v8 mode.
  const credential = result.credential as firebase.auth.OAuthCredential;
  const token = credential?.accessToken;
  
  if (token) {
    // Ideally store this in a secure session manager. For this demo, sessionStorage is acceptable.
    sessionStorage.setItem('google_access_token', token);
  }

  const user = result.user!;
  
  // Fix: Use the v8 compat namespaced firestore API
  const userDocRef = db.collection("users").doc(user.uid);
  const userDoc = await userDocRef.get();
  
  if (userDoc.exists) {
    const userData = userDoc.data() as User;
     if (!userData.hasOwnProperty('fatherHusbandName')) {
        const defaultProfile = {
            fatherHusbandName: '', dateOfBirth: '', placeOfBirth: '', nationality: '', serviceNumber: '', rank: '', ppoNumber: '',
            passportNumber: '', passportIssueDate: '', passportExpiryDate: '', passportAuthority: '', overseasAddress: '',
            indianAddress: '', phoneNumber: '', indianPhoneNumber: ''
        };
        // Fix: Use the v8 compat namespaced firestore API
        await userDocRef.set(defaultProfile, { merge: true });
        return { ...defaultProfile, ...userData } as User;
    }
    return userData;
  } else {
    const newUser: User = {
        id: user.uid,
        name: user.displayName || "Unknown",
        email: user.email || "",
        role: role, 
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}&background=random}`,
        fatherHusbandName: '', dateOfBirth: '', placeOfBirth: '', nationality: '', serviceNumber: '', rank: '', ppoNumber: '',
        passportNumber: '', passportIssueDate: '', passportExpiryDate: '', passportAuthority: '', overseasAddress: '',
        indianAddress: '', phoneNumber: '', indianPhoneNumber: ''
    };
    // Fix: Use the v8 compat namespaced firestore API
    await userDocRef.set(newUser);
    return newUser;
  }
};

export const linkGoogleAccount = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No user is currently signed in to link an account.");
    }

    // Fix: Use the explicitly imported GoogleAuthProvider
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');

    // FIX: Explicitly set auth_domain to the current hostname, with a fallback to the default.
    // This is critical for sandboxed iframes where the origin can be dynamic (a GUID) or even empty.
    // It tells the popup the correct origin to communicate with via postMessage.
    const authDomain = window.location.hostname || 'sparsh-life-certificate-nri.firebaseapp.com';
    provider.setCustomParameters({
      'auth_domain': authDomain
    });

    try {
        // Fix: Use the v8 compat namespaced auth API
        const result = await user.linkWithPopup(provider);
        // Use result.credential directly in compat/v8 mode.
        const credential = result.credential as firebase.auth.OAuthCredential;
        const token = credential?.accessToken;

        if (token) {
            sessionStorage.setItem('google_access_token', token);
            return token;
        } else {
            throw new Error("Could not retrieve access token after linking.");
        }
    } catch (error: any) {
        console.error("Error linking Google account:", error);
        if (error.code === 'auth/credential-already-in-use') {
            throw new Error("This Google account is already associated with another user.");
        }
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error("Authorization popup was closed before completion.");
        }
        throw new Error("Failed to link Google Account. Please try again.");
    }
};

export const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("No user is currently signed in.");
  }

  // Re-authenticate the user as a security measure
  // Fix: Use the explicitly imported EmailAuthProvider
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
  
  try {
    // Fix: Use the v8 compat namespaced auth API
    await user.reauthenticateWithCredential(credential);
  } catch (error: any) {
    console.error("Re-authentication failed", error);
    if (error.code === 'auth/wrong-password') {
        throw new Error("The current password you entered is incorrect.");
    }
    throw new Error("Re-authentication failed. Please try again.");
  }

  // If re-authentication is successful, update the password
  try {
    // Fix: Use the v8 compat namespaced auth API
    await user.updatePassword(newPassword);
  } catch(error: any) {
    console.error("Password update failed", error);
     if (error.code === 'auth/weak-password') {
        throw new Error("Password is too weak. It must be at least 6 characters long.");
    }
    throw new Error("Failed to update password.");
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  // Fix: Use the v8 compat namespaced firestore API
  const userRef = db.collection("users").doc(userId);
  await userRef.update(data);
};

// --- Applications ---

// Fix: Use firebase.Unsubscribe for the return type.
export const getApplications = (role: UserRole, userId: string, onUpdate: (apps: ALCApplication[]) => void): (() => void) => {
  // Fix: Use the v8 compat namespaced firestore API for querying
  let q: firebase.firestore.Query = db.collection("applications");

  if (role === UserRole.PENSIONER) {
    q = q.where("pensionerId", "==", userId);
  } else {
    // Notaries see their completed work and the global pending queue.
    q = q.where("status", "in", [
        ApplicationStatus.SUBMITTED, 
        ApplicationStatus.ATTESTED, 
        ApplicationStatus.REJECTED
    ]);
  }

  // Fix: Use the v8 compat namespaced firestore API for snapshots
  const unsubscribe = q.onSnapshot((querySnapshot) => {
    let apps: ALCApplication[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const app = { id: docSnap.id, ...(data as any) } as ALCApplication;
      
      // For Notaries, filter down to only their processed items or pending items
      if (role === UserRole.NOTARY) {
        if (app.status === ApplicationStatus.SUBMITTED || app.notaryId === userId) {
            apps.push(app);
        }
      } else {
        apps.push(app);
      }
    });
    
    // Sort by most recently submitted/processed first
    const sortedApps = apps.sort((a, b) => {
        const dateA = new Date(a.attestationDate || a.submittedDate).getTime();
        const dateB = new Date(b.attestationDate || b.submittedDate).getTime();
        return dateB - dateA;
    });
    onUpdate(sortedApps);
  }, (error) => {
    console.error("Error listening to applications:", error);
  });

  return unsubscribe;
};

export const getApplicationsForReport = async (notaryId: string): Promise<ALCApplication[]> => {
  // Fix: Use the v8 compat namespaced firestore API
  const appsRef = db.collection("applications");
  
  const q = appsRef
    .where("notaryId", "==", notaryId)
    .where("status", "in", [ApplicationStatus.ATTESTED, ApplicationStatus.REJECTED]);

  const querySnapshot = await q.get();
  const apps: ALCApplication[] = [];
  querySnapshot.forEach((docSnap) => {
    apps.push({ id: docSnap.id, ...docSnap.data() } as ALCApplication);
  });
  
  // Sort by attestation date, most recent first.
  return apps.sort((a, b) => {
    const dateA = new Date(a.attestationDate || 0).getTime();
    const dateB = new Date(b.attestationDate || 0).getTime();
    return dateB - dateA;
  });
};

export const createApplication = async (appData: Omit<ALCApplication, 'id' | 'status' | 'submittedDate'>): Promise<ALCApplication> => {
  try {
    const timestamp = new Date().toISOString();
    const userId = appData.pensionerId;
    
    console.log("Starting application creation for user:", userId);

    // 1. Upload Signature
    let sigUrl = '';
    if (appData.pensionerSignature) {
        // Fix: Use the v8 compat namespaced storage API
        const sigRef = storage.ref(`signatures/${userId}/${Date.now()}_sig.png`);
        const sigBlob = dataURItoBlob(appData.pensionerSignature);
        if (sigBlob) {
          const metadata = { contentType: 'image/png' };
          await sigRef.put(sigBlob, metadata);
          sigUrl = await sigRef.getDownloadURL();
        }
    }

    // 2. Upload Documents
    const processedDocs: any[] = [];
    for (const docItem of appData.documents) {
        // Fix: Use the v8 compat namespaced storage API
        const fileRef = storage.ref(`documents/${userId}/${Date.now()}_${docItem.name}`);
        let downloadUrl = '';
        
        const fileToUpload = docItem.file ? docItem.file : dataURItoBlob(docItem.url);

        if (fileToUpload) {
            const metadata = { contentType: docItem.type };
            await fileRef.put(fileToUpload, metadata);
            downloadUrl = await fileRef.getDownloadURL();
        }

        processedDocs.push({
            id: docItem.id, name: docItem.name, type: docItem.type, url: downloadUrl || docItem.url 
        });
    }

    // 3. Save to Firestore
    const newAppPayload = {
      ...appData,
      pensionerSignature: sigUrl,
      documents: processedDocs,
      status: ApplicationStatus.SUBMITTED,
      submittedDate: timestamp,
      history: [{ status: ApplicationStatus.SUBMITTED, timestamp: timestamp, details: 'Application submitted successfully' }]
    };

    // Fix: Use the v8 compat namespaced firestore API
    const docRef = await db.collection("applications").add(newAppPayload);
    return { id: docRef.id, ...newAppPayload } as ALCApplication;

  } catch (error: any) {
    console.error("Error creating application:", error);
    if (error.code === 'storage/unauthorized') {
        throw new Error("File Upload Failed: Permission denied. Please check Storage Rules in Firebase.");
    }
    if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error("Network/CORS Error: Please check 'cors.json' configuration in README.");
    }
    throw error;
  }
};

export const updateApplicationStatus = async (
    appId: string, 
    status: ApplicationStatus, 
    notaryData?: Partial<ALCApplication>
): Promise<void> => {
    // Fix: Use the v8 compat namespaced firestore API
    const appRef = db.collection("applications").doc(appId);
    const timestamp = new Date().toISOString();
    
    let finalNotaryData = { ...notaryData };

    if (notaryData?.notarySignature && notaryData.notarySignature.startsWith('data:') && notaryData.notaryId) {
        // Fix: Use the v8 compat namespaced storage API
        const sigRef = storage.ref(`signatures/${notaryData.notaryId}/${Date.now()}_${appId}.png`);
        const sigBlob = dataURItoBlob(notaryData.notarySignature);
        if (sigBlob) {
            const metadata = { contentType: 'image/png' };
            await sigRef.put(sigBlob, metadata);
            const url = await sigRef.getDownloadURL();
            finalNotaryData.notarySignature = url;
        }
    }

    // Fix: Use the v8 compat namespaced firestore API
    const snap = await appRef.get();
    const currentHistory = snap.exists ? snap.data()?.history || [] : [];
    
    let details = '';
    if (status === ApplicationStatus.ATTESTED) details = `Attested by Notary: ${notaryData?.notaryName || 'Unknown'}`;
    else if (status === ApplicationStatus.REJECTED) details = `Rejected by Notary: ${notaryData?.rejectionReason || 'No reason provided'}`;
    else if (status === ApplicationStatus.SENT_TO_SPARSH) details = 'Transmitted to SPARSH Defense Pension System';

    // Fix: Use the v8 compat namespaced firestore API
    await appRef.update({
        status,
        ...finalNotaryData,
        history: [ ...currentHistory, { status, timestamp, details } ]
    });
};

export const getApplicationById = async (id: string): Promise<ALCApplication | undefined> => {
    // Fix: Use the v8 compat namespaced firestore API
    const docRef = db.collection("applications").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
        return { id: snap.id, ...snap.data() } as ALCApplication;
    }
    return undefined;
};
