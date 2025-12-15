
# Firebase Configuration Instructions

This guide assumes you have already created a Firebase project and enabled Authentication, Firestore, and Storage.

## 🔴 CRITICAL: Fix File Upload Errors (CORS)

If you see **"Access to XMLHttpRequest blocked by CORS policy"** or **"storage/unauthorized"**, you **MUST** run the command below. This is a one-time setup for your project's storage bucket.

**I cannot do this for you. You must run it in your Google Cloud Console.**

### One-Line Command (The Definitive Fix)
1. Open [Google Cloud Shell](https://console.cloud.google.com/?cloudshell=true).
2. **First, set your project:**
   ```bash
   gcloud config set project sparsh-life-certificate-nri
   ```
3. **Then, apply the definitive CORS policy with the correct bucket name:**
   ```bash
   echo '[{"origin": ["*"],"method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],"responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],"maxAgeSeconds": 3600}]' > cors.json && gsutil cors set cors.json gs://sparsh-life-certificate-nri.firebasestorage.app
   ```
   *(If it says "Bucket not found", you MUST find your correct bucket name in the Firebase Storage console and use it in the command above.)*

---

## 1. Firestore Database Rules (Production Security)
1. Go to [Firebase Console > Build > Firestore Database > Rules](https://console.firebase.google.com/).
2. Copy the entire content of `firestore.rules`.
3. Paste it into the editor, replacing the default rules.
4. Click **Publish**.

## 2. Storage Rules (Production Security)
1. Go to [Firebase Console > Build > Storage > Rules](https://console.firebase.google.com/).
2. Copy the entire content of `storage.rules`.
3. Paste it into the editor, replacing the default rules.
4. Click **Publish**.

## 3. Authentication Authorized Domains (To Fix Google Sign-In)
If you get an `auth/unauthorized-domain` error when using Google Sign-In or linking accounts, you must add your app's domain to the approved list.

1. Go to [Firebase Console > Build > Authentication > Settings](https://console.firebase.google.com/).
2. Under the **Authorized domains** section, click **Add domain**.
3. Add the domains where your app is hosted. For local development, this is often `localhost`.
4. Click **Add**.

### ⭐ Troubleshooting: Still getting an "unauthorized-domain" error?
If you have already added `localhost` but the error persists, it's likely because the app is running in a secure `iframe` or container with a different hostname. To find the correct domain to authorize:
1.  **Run the application** in your browser.
2.  **Open the Developer Console** (Right-click -> Inspect -> Console tab).
3.  Look for a highlighted log message: `Firebase Auth Domain to Authorize: some-domain-name.com`
4.  **Copy** `some-domain-name.com` and add it to your list of Authorized domains in Firebase. 
    - **Important:** Even if the hostname looks like a random string of letters and numbers (e.g., `42619ee4-df00-4c8e-a123-bfd4782e08bd`), you **must** copy this exact string and add it to your authorized domains. This is the correct behavior for certain sandboxed environments.
