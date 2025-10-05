import React, { useState, useContext, useEffect, useRef } from 'react';
import Sidebar from '../../components/ChatSideBar.jsx';
import ChatBox from '../../components/ChatBox.jsx';
import { AppContext } from '../../context/AppContext.jsx';
import UserProfile from '../../components/UserProfile.jsx';
import { saveFcmToken, messaging, db } from '../../config/firebase';
import { onMessage } from 'firebase/messaging';
import { onSnapshot, doc, getDoc } from 'firebase/firestore';

const Chat = () => {
  const { chatData, userData } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const chatListenersRef = useRef(false); // Prevent multiple listeners

  // Stop loading once chatData and userData are ready
  useEffect(() => {
    if (chatData && userData) setLoading(false);
  }, [chatData, userData]);

  // Save FCM token and listen for foreground messages
  useEffect(() => {
    if (!userData?.id) return;

    const initFcm = async () => {
      const userRef = doc(db, "users", userData.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().fcmToken) {
        // Save FCM token only if it doesn't exist
        await saveFcmToken(userData.id);
      }
    };

    initFcm();

    // Listen for foreground notifications
    const unsubscribeMessaging = onMessage(messaging, (payload) => {
      console.log("FCM payload received:", payload);
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "New message", {
          body: payload.notification?.body,
          icon: payload.notification?.icon,
        });
      }
    });

    return () => unsubscribeMessaging();
  }, [userData?.id]);

  // Listen for new messages in all chats (only once)
  useEffect(() => {
    if (!userData?.id || !chatData?.length || chatListenersRef.current) return;

    const unsubscribes = chatData.map((chat) =>
      onSnapshot(doc(db, 'messages', chat.messageId), (res) => {
        const messages = res.data()?.messages || [];
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.sid !== userData.id) {
          if (Notification.permission === "granted") {
            new Notification(`New message from ${chat.userName}`, {
              body: lastMessage.text,
              icon: chat.avatar,
            });
          }
        }
      })
    );

    chatListenersRef.current = true; // mark listeners as registered

    // Cleanup listeners on unmount
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [chatData, userData]);

  if (loading) return <p>Loading chats...</p>;

  return (
    <div className="flex">
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
