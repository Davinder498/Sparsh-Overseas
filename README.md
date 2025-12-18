
# Firebase Configuration Instructions

This guide assumes you have already created a Firebase project and enabled Authentication, Firestore, and Storage.

## 🔴 CRITICAL: Fix File Upload Errors (CORS)

If you see **"Access to XMLHttpRequest blocked by CORS policy"** or **"storage/unauthorized"**, you **MUST** run the command below. This is a one-time setup for your project's storage bucket.

### One-Line Command (The Definitive Fix)
1. Open [Google Cloud Shell](https://console.cloud.google.com/?cloudshell=true).
2. **First, set your project:**
   ```bash
   gcloud config set project sparsh-life-certificate-nri
   ```
3. **Then, apply the definitive CORS policy:**
   ```bash
   echo '[{"origin": ["*"],"method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],"responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],"maxAgeSeconds": 3600}]' > cors.json && gsutil cors set cors.json gs://sparsh-life-certificate-nri.firebasestorage.app
   ```

---

## 1. Firestore Database Rules
1. Go to [Firebase Console > Build > Firestore Database > Rules](https://console.firebase.google.com/).
2. Copy the content of `firestore.rules`.
3. Paste and **Publish**.
4. **Note:** You do NOT need to create the `audit_logs` or `users` collections manually. Firestore will create them on the first write.

## 2. Storage Rules
1. Go to [Firebase Console > Build > Storage > Rules](https://console.firebase.google.com/).
2. Copy the content of `storage.rules`.
3. Paste and **Publish**.

## 3. Authentication Authorized Domains
1. Go to [Firebase Console > Build > Authentication > Settings](https://console.firebase.google.com/).
2. Under **Authorized domains**, click **Add domain**.
3. Add your hosting domain (e.g., `sparsh-life-certificate-nri.web.app`) and `localhost`.
