
import { ApplicationStatus } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  type: 'status_change' | 'info';
}

type NotificationListener = (notifications: AppNotification[]) => void;

// In-memory store for the session
let notifications: AppNotification[] = [];
const listeners: Set<NotificationListener> = new Set();

// Request permission from the browser
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Send a notification (Native + In-App)
export const sendNotification = (title: string, body: string) => {
  // 1. Add to local store
  const newNote: AppNotification = {
    id: Date.now().toString() + Math.random().toString(),
    title,
    body,
    timestamp: new Date(),
    read: false,
    type: 'status_change'
  };
  
  notifications = [newNote, ...notifications];
  notifyListeners();

  // 2. Trigger Browser Native Notification
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        // Removed icon: '/vite.svg'
      });
    } catch (e) {
      console.error("Failed to create system notification", e);
    }
  }
};

// Subscribe UI components to changes
export const subscribeToNotifications = (listener: NotificationListener) => {
  listeners.add(listener);
  listener(notifications); // Initial call
  return () => listeners.delete(listener);
};

const notifyListeners = () => {
  listeners.forEach(l => l(notifications));
};

export const markAllAsRead = () => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  notifyListeners();
};

export const getStatusMessage = (status: ApplicationStatus, appId: string): { title: string, body: string } => {
    const idShort = appId.substring(0, 8);
    switch (status) {
        case ApplicationStatus.ATTESTED:
            return {
                title: 'Certificate Attested',
                body: `Good news! Your application (${idShort}...) has been attested by the Notary.`
            };
        case ApplicationStatus.REJECTED:
             return {
                title: 'Application Rejected',
                body: `Attention: Your application (${idShort}...) was returned by the Notary. Please check remarks.`
            };
        case ApplicationStatus.SENT_TO_SPARSH:
             return {
                title: 'Sent to SPARSH',
                body: `Success! Your certificate (${idShort}...) has been emailed to SPARSH.`
            };
        case ApplicationStatus.SUBMITTED:
            return {
                title: 'New Submission',
                body: `A new application (${idShort}...) has been submitted for review.`
            };
        default:
            return {
                title: 'Status Updated',
                body: `Application (${idShort}...) status changed to ${status}.`
            };
    }
};