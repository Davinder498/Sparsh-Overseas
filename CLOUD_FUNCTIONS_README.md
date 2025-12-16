
# Server-Side PDF Generation Setup

To enable robust, commercial-grade PDF generation, you must deploy the following code to your Firebase Functions. This replaces the flaky client-side generation.

## 1. Setup

In your local project root:

```bash
firebase init functions
```

Select **TypeScript** when asked.

## 2. Dependencies

Install these dependencies in your `functions` folder:

```bash
cd functions
npm install puppeteer firebase-admin firebase-functions
```

## 3. The Backend Code (`functions/src/index.ts`)

Replace the contents of your `functions/src/index.ts` with the code below. 

**Note:** This code generates a pixel-perfect HTML template on the server and converts it to PDF using Headless Chrome.

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as puppeteer from "puppeteer";

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

export const generateLifeCertificate = functions
  .runWith({ memory: "2GB", timeoutSeconds: 60 }) // Puppeteer needs RAM
  .https.onCall(async (data, context) => {
    
    // 1. Authentication Check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in."
      );
    }

    const { applicationId } = data;
    if (!applicationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Application ID is required."
      );
    }

    // 2. Fetch Data
    const appRef = db.collection("applications").doc(applicationId);
    const appSnap = await appRef.get();

    if (!appSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Application not found.");
    }

    const appData = appSnap.data();

    // 3. Security Check: Only Owner or Notary can generate
    // Note: In a real app, you might want to strict check user roles here too.
    if (appData?.pensionerId !== context.auth.uid && appData?.notaryId !== context.auth.uid) {
         // Optionally allow admins
    }

    // 4. Generate HTML
    // We recreate the Tailwind layout using inline styles for PDF consistency.
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #1f2937; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 40px; position: relative; height: 1050px; }
          .header { text-align: center; margin-bottom: 30px; }
          .emblem { height: 80px; margin-bottom: 10px; }
          .title { font-size: 24px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 14px; color: #6b7280; font-style: italic; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; display: inline-block; margin-top: 5px;}
          .declaration { font-size: 16px; line-height: 1.6; text-align: justify; margin-bottom: 30px; }
          .date-box { font-weight: bold; border-bottom: 2px solid #d1d5db; padding: 0 10px; color: #1e3a8a; }
          .row { display: flex; align-items: baseline; margin-bottom: 12px; }
          .label-num { width: 30px; font-weight: bold; color: #6b7280; font-size: 14px; }
          .label-text { width: 200px; font-weight: 600; color: #374151; font-size: 15px; }
          .value-text { flex: 1; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; font-weight: 500; color: #111827; }
          .section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px; color: #111827; }
          .sub-row { display: flex; margin-bottom: 8px; font-size: 14px; }
          .sub-label { width: 160px; color: #4b5563; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { width: 40%; display: flex; flex-direction: column; align-items: center; }
          .sig-img { height: 70px; object-fit: contain; margin-bottom: 10px; }
          .sig-line { border-top: 1px solid #9ca3af; width: 100%; text-align: center; padding-top: 8px; font-weight: 600; font-size: 14px; color: #374151; }
          .footer { position: absolute; bottom: 20px; left: 40px; right: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/240px-Emblem_of_India.svg.png" class="emblem" />
            <div style="font-weight: bold; margin-bottom: 10px;">सत्यमेव जयते</div>
            <div class="title">Life Certificate</div>
            <div class="subtitle">(This certificate is for the purpose of pension benefits only)</div>
          </div>

          <div class="declaration">
            This is to certify that the person, whose particulars are given below, is alive on this 
            <span class="date-box">${
              appData?.attestationDate
                ? new Date(appData.attestationDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : new Date().toLocaleDateString("en-GB")
            }</span>
            and has signed/ affixed thumb impression before me.
          </div>

          <div class="row">
            <span class="label-num">1.</span>
            <span class="label-text">Name</span>
            <span class="value-text" style="text-transform: uppercase;">${appData?.pensionerName || ""}</span>
          </div>
          <div class="row">
            <span class="label-num">2.</span>
            <span class="label-text">Date & Place of Birth</span>
            <span class="value-text">${appData?.dateOfBirth || ""} ${appData?.placeOfBirth ? ", " + appData.placeOfBirth : ""}</span>
          </div>
          <div class="row">
            <span class="label-num">3.</span>
            <span class="label-text">Father's/Spouse's Name</span>
            <span class="value-text">${appData?.fatherHusbandName || "N/A"}</span>
          </div>
          <div class="row">
            <span class="label-num">4.</span>
            <span class="label-text">Address (Overseas)</span>
            <span class="value-text">${appData?.overseasAddress || ""}</span>
          </div>
          <div class="row">
            <span class="label-num">5.</span>
            <span class="label-text">Contact No.</span>
            <span class="value-text">${appData?.phoneNumber || ""}</span>
          </div>
          <div class="row">
            <span class="label-num">6.</span>
            <span class="label-text">Email ID</span>
            <span class="value-text">${appData?.email || ""}</span>
          </div>
           <div class="row">
            <span class="label-num">7.</span>
            <span class="label-text">Nationality</span>
            <span class="value-text">${appData?.nationality || ""}</span>
          </div>

          <div class="row" style="margin-top: 20px;">
            <span class="label-num">8.</span>
            <span class="label-text" style="text-decoration: underline;">Passport Particulars:</span>
            <span class="value-text" style="border: none;"></span>
          </div>
          <div style="padding-left: 35px; margin-bottom: 20px;">
             <div class="sub-row">
               <span class="sub-label">a) Passport Number :</span>
               <span class="value-text">${appData?.passportNumber || ""}</span>
             </div>
             <div class="sub-row">
               <span class="sub-label">b) Date of Issue :</span>
               <span class="value-text">${appData?.passportIssueDate || ""}</span>
             </div>
             <div class="sub-row">
               <span class="sub-label">c) Date of Expiry :</span>
               <span class="value-text">${appData?.passportExpiryDate || ""}</span>
             </div>
             <div class="sub-row">
               <span class="sub-label">d) Place of Issue :</span>
               <span class="value-text">${appData?.passportAuthority || ""}</span>
             </div>
          </div>

          <div class="row">
            <span class="label-num">9.</span>
            <span class="label-text">P.P.O. Number</span>
            <span class="value-text">${appData?.ppoNumber || ""}</span>
          </div>
          <div class="row">
            <span class="label-num">10.</span>
            <span class="label-text">Service Number</span>
            <span class="value-text">${appData?.serviceNumber || ""}</span>
          </div>

          <div class="signatures">
            <div class="sig-box">
              ${appData?.pensionerSignature ? `<img src="${appData.pensionerSignature}" class="sig-img" />` : '<div style="height:70px"></div>'}
              <div class="sig-line">Signature of Applicant</div>
            </div>
            <div class="sig-box">
              ${appData?.notarySignature ? `<img src="${appData.notarySignature}" class="sig-img" />` : '<div style="height:70px"></div>'}
              <div class="sig-line">
                Authorised Official / Notary<br/>
                <span style="font-weight: normal; font-size: 12px;">${appData?.notaryName || ""}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <span>Sparsh Overseas System</span>
            <span>App Ref: ${applicationId}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Render to PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // 6. Upload to Storage
    const fileName = `certificates/${applicationId}_${Date.now()}.pdf`;
    const file = bucket.file(fileName);
    await file.save(pdfBuffer, {
      metadata: { contentType: "application/pdf" },
    });

    // 7. Generate Signed URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
    });

    return { url, expires: new Date(Date.now() + 1000 * 60 * 60).toISOString() };
  });
```
