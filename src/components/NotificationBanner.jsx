import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '../config/firebase';
import { toast } from 'react-toastify';

const NotificationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Show banner if permission is default (not asked yet)
    if (Notification.permission === 'default') {
      // Wait a bit before showing banner to not overwhelm user
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      setShowBanner(false);
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember user dismissed it (could use localStorage but we're avoiding it per instructions)
  };

  if (!showBanner || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
      <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Enable Notifications
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Stay updated with new messages and never miss a conversation!
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleEnableNotifications}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;