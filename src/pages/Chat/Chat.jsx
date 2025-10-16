import React, { useState, useContext, useEffect, useRef } from 'react';
import Sidebar from '../../components/ChatSideBar.jsx';
import ChatBox from '../../components/ChatBox.jsx';
import { AppContext } from '../../context/AppContext.jsx';
import UserProfile from '../../components/UserProfile.jsx';
import { saveFcmToken, messaging, db } from '../../config/firebase';
import { onMessage } from 'firebase/messaging';
import { onSnapshot, doc } from 'firebase/firestore'


const Chat = () => {
  const { chatData, userData, messagesId } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const lastNotifiedRef = useRef({});


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

  // Global notification listener for all chats (except active one)
  useEffect(() => {
    if (!userData?.id) return;

    const unsubscribe = onSnapshot(doc(db, 'chats', userData.id), (snapshot) => {
      const chatsData = snapshot.data()?.chatsData || [];

      // Check each chat for new unread messages
      chatsData.forEach((chat) => {
        // Skip if this is the currently active chat (ChatBox handles this one)
        if (chat.messageId === messagesId) return;

        // Only show notification if message is unread
        if (chat.messageSeen === false && chat.lastMessage) {
          // Create unique key to prevent duplicate notifications
          const notificationKey = `${chat.messageId}-${chat.updatedAt}`;

          // Check if we already showed notification for this message
          if (lastNotifiedRef.current[chat.messageId] !== notificationKey) {
            lastNotifiedRef.current[chat.messageId] = notificationKey;

            // Show browser notification
            if (Notification.permission === "granted") {
              new Notification(`New message from ${chat.rName}`, {
                body: chat.lastMessage || "New message",
                icon: chat.rAvatar || '/favicon.ico',
                tag: notificationKey,
                requireInteraction: false
              });
            }
          }
        } else if (chat.messageSeen === true) {
          // Reset notification tracking when message is read
          // This allows future messages from this chat to trigger notifications
          delete lastNotifiedRef.current[chat.messageId];
        }
      });
    });

    return () => unsubscribe();
  }, [userData?.id, messagesId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e11]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#2a3942] border-t-[#00a884] mx-auto"></div>
          <p className="text-[#aebac1] font-medium">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e11]">
      {/* Sidebar */}
      <div className="w-auto h-full flex-shrink-0 border-r border-[#2a3942]">
        <Sidebar />
      </div>

      {/* Chat area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <ChatBox onOpenProfile={() => setShowProfile(true)} />
      </div>

      {/* User Profile Modal */}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Chat;