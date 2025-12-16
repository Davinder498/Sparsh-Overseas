
import { functions } from './firebaseConfig';

export interface PDFGenerationResult {
  url: string; // The download URL of the generated PDF
  expires: string; // Expiration timestamp of the signed URL
}

/**
 * Calls the Firebase Cloud Function 'generateLifeCertificate' to create a 
 * professional, server-side rendered PDF using Puppeteer.
 * 
 * @param applicationId The ID of the application to generate
 * @returns Object containing the download URL
 */
export const generateServerSidePDF = async (applicationId: string): Promise<PDFGenerationResult> => {
  try {
    const generateFn = functions.httpsCallable('generateLifeCertificate');
    
    // Call the backend
    const result = await generateFn({ applicationId });
    
    // The cloud function should return { url: "..." }
    const data = result.data as PDFGenerationResult;
    
    if (!data || !data.url) {
        throw new Error("Server returned an invalid response.");
    }
    
    return data;
  } catch (error: any) {
    console.error("Server-Side PDF Generation Failed:", error);
    
    // Friendly error messaging for the frontend
    if (error.code === 'not-found') {
        throw new Error("The PDF generation server function is not deployed yet. Please see CLOUD_FUNCTIONS_README.md.");
    }
    if (error.code === 'internal') {
        throw new Error("The server encountered an error generating the PDF. Please try again later.");
    }
    
    throw error;
  }
};

/**
 * Helper to download the PDF blob from the generated URL.
 * Useful for the Gmail API attachment flow.
 */
export const downloadPDFBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to download the generated PDF file.");
    }
    return await response.blob();
};

/**
 * Helper to convert Blob to Base64 (without Data URI prefix)
 * which is required for the Gmail API.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove "data:application/pdf;base64," prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
