import React, { useState, useContext, useEffect, useRef } from 'react';
import Sidebar from '../../components/ChatSideBar.jsx';
import ChatBox from '../../components/ChatBox.jsx';
import { AppContext } from '../../context/AppContext.jsx';
import UserProfile from '../../components/UserProfile.jsx';
import { saveFcmToken, messaging, db } from '../../config/firebase';
import { onMessage } from 'firebase/messaging';
import { onSnapshot, doc } from 'firebase/firestore';

const Chat = () => {
  const { chatData, userData, messagesId } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);


  useEffect(() => {
    if (chatData && userData) {
      setLoading(false);
    }
  }, [chatData, userData]);
  

  
  // Handle foreground FCM messages
  useEffect(() => {
    if (!userData?.id) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground FCM message received:', payload);
      
      const messageIdFromPayload = payload.data?.messageId;
      if (messageIdFromPayload === messagesId) {
        return;
      }
      
      if (Notification.permission === "granted") {
        const { title, body, icon } = payload.notification || {};
        new Notification(title || 'New Message', {
          body: body || 'You have a new message',
          icon: icon || '/favicon.ico',
          tag: `fcm-${Date.now()}`,
          requireInteraction: false
        });
      }
    });

    return () => unsubscribe();
  }, [userData, messagesId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* NO NotificationBanner - Only Browser Notifications */}
      
      <div className="w-[20%]">
        <Sidebar />
      </div>
      <div className="w-[80%]">
        <ChatBox onOpenProfile={() => setShowProfile(true)} />
      </div>
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Chat;