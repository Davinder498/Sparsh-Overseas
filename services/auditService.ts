
import { db } from './firebaseConfig';
import { captureError } from './errorMonitoringService';

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
    resourceId?: string; // e.g., Application ID
    details?: string;
    timestamp: string; // ISO String
    userAgent: string;
}

/**
 * Logs a critical user action to the immutable audit_logs collection.
 * This provides a legal trail of who did what and when.
 */
export const logAudit = async (userId: string, action: AuditAction, resourceId?: string, details?: string) => {
    try {
        const entry: AuditLogEntry = {
            userId,
            action,
            resourceId,
            details: details || '',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Fire and forget - we don't want audit logging to block the UI
        db.collection('audit_logs').add(entry).catch(err => {
            console.error("Failed to write audit log", err);
            // In a real production app, we might send this failure to Sentry
            // because missing audit logs is a compliance risk.
            captureError(err, { context: 'Audit Log Failure', entry });
        });

    } catch (error) {
        console.error("Audit Service Error", error);
    }
};
