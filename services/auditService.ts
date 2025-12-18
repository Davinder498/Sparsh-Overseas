
import { db, auth } from './firebaseConfig';

export enum AuditAction {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    VIEW_APPLICATION = 'VIEW_APPLICATION',
    CREATE_APPLICATION = 'CREATE_APPLICATION',
    UPDATE_STATUS = 'UPDATE_STATUS',
    DOWNLOAD_PDF = 'DOWNLOAD_PDF',
    EXPORT_DATA = 'EXPORT_DATA',
    DELETE_ACCOUNT = 'DELETE_ACCOUNT',
    LINK_GOOGLE = 'LINK_GOOGLE'
}

interface AuditLogEntry {
    userId: string;
    action: AuditAction;
    resourceId?: string | null;
    details?: string;
    timestamp: string;
    userAgent: string;
}

/**
 * Logs an action to the Firestore audit_logs collection.
 * Note: The collection is created automatically by Firestore on the first write.
 */
export const logAudit = async (userId: string, action: AuditAction, resourceId?: string, details?: string) => {
    try {
        // Use provided userId, but fallback to auth current user if available
        const effectiveUid = userId || auth.currentUser?.uid;

        if (!effectiveUid) {
            console.warn("[Audit Service] Skipping log: No userId available for action", action);
            return;
        }

        const entry: AuditLogEntry = {
            userId: effectiveUid,
            action,
            resourceId: resourceId ?? null,
            details: details || '',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // This will trigger the automatic creation of the 'audit_logs' collection
        await db.collection('audit_logs').add(entry);

    } catch (error: any) {
        // We log to console but don't break the app flow if auditing fails
        console.error("[Audit Service] Critical failure writing to audit_logs:", error.message);
    }
};
