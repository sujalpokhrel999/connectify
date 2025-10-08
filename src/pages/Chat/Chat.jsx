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
  const chatListenersRef = useRef({});
  const lastNotifiedRef = useRef({});
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (chatData && userData) {
      setLoading(false);
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 1000);
    }
  }, [chatData, userData]);
  
  // Real-time message listener for BROWSER notifications
  useEffect(() => {
    if (!userData?.id || !chatData?.length) return;
  
    chatData.forEach((chat) => {
      if (!chatListenersRef.current[chat.messageId]) {
        let isFirstSnapshot = true;
        
        const unsubscribe = onSnapshot(doc(db, 'messages', chat.messageId), (res) => {
          const messages = res.data()?.messages || [];
          const lastMessage = messages[messages.length - 1];
  
          if (isFirstSnapshot || initialLoadRef.current) {
            isFirstSnapshot = false;
            if (lastMessage) {
              const messageKey = `${chat.messageId}-${lastMessage.timestamp?.seconds || lastMessage.timestamp}-${lastMessage.text}`;
              lastNotifiedRef.current[chat.messageId] = messageKey;
            }
            return;
          }

          if (lastMessage && lastMessage.sid !== userData.id) {
            const messageKey = `${chat.messageId}-${lastMessage.timestamp?.seconds || lastMessage.timestamp}-${lastMessage.text}`;
            
            if (lastNotifiedRef.current[chat.messageId] !== messageKey) {
              lastNotifiedRef.current[chat.messageId] = messageKey;
              
              // BROWSER NOTIFICATION (System pop-up)
              if (messagesId !== chat.messageId && Notification.permission === "granted") {
                new Notification(`New message from ${chat.rName}`, {
                  body: lastMessage.text || "New message",
                  icon: chat.rAvatar,
                  tag: messageKey,
                  requireInteraction: false
                });
              }
            }
          }
        });
  
        chatListenersRef.current[chat.messageId] = unsubscribe;
      }
    });
  
    return () => {
      Object.values(chatListenersRef.current).forEach((unsub) => unsub());
      chatListenersRef.current = {};
    };
  }, [chatData, userData, messagesId]);
  
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