import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, MessageSquare } from 'lucide-react';
import { AppNotification, subscribeToNotifications, markAllAsRead } from '../services/pushNotificationService';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((updatedList) => setNotifications(updatedList));
    // Fix: Explicitly return void from cleanup to avoid returning boolean from unsubscribe()
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) markAllAsRead();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-primary-soft transition-colors relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 bg-red-500 transform translate-x-1/4 -translate-y-1/4"></span>}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in-up">
          <div className="py-2">
             <div className="px-4 py-2 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                <span className="text-xs text-gray-500">{notifications.length} Total</span>
             </div>
             <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center">
                        <BellOff className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y dark:divide-gray-700">
                        {notifications.map((note) => (
                            <li key={note.id} className="px-4 py-3 hover:bg-primary-soft/50 transition-colors">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div className="h-8 w-8 rounded-full bg-primary-soft dark:bg-primary/20 flex items-center justify-center text-primary dark:text-accent">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{note.title}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{note.body}</p>
                                    </div>
                                    {!note.read && <div className="ml-2 flex-shrink-0"><span className="inline-block h-2 w-2 rounded-full bg-primary"></span></div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;