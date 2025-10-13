import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Smile, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx';
import { onSnapshot, doc, updateDoc, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '.././config/firebase';
import { toast } from 'react-toastify';

const ChatBox = ({ onOpenProfile }) => {
  const { userData, messagesId, chatUser, messages, setMessages } = useContext(AppContext);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);


  useEffect(() => {
    if (!messagesId) return;
  
    const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
      const newMessages = res.data()?.messages || [];
      setMessages(newMessages);
    });
  
    return () => unSub();
  }, [messagesId, setMessages]);

  // Update message status to "sent" after being added to Firestore
useEffect(() => {
  if (!messagesId || !messages.length) return;

  const updateMessageStatus = async () => {
    try {
      const messagesRef = doc(db, 'messages', messagesId);
      const messagesSnapshot = await getDoc(messagesRef);
      
      if (!messagesSnapshot.exists()) return;

      const allMessages = messagesSnapshot.data()?.messages || [];
      const hasUnsent = allMessages.some(msg => msg.status === 'sending');

      if (hasUnsent) {
        // Update all "sending" messages to "sent"
        const updatedMessages = allMessages.map(msg => 
          msg.status === 'sending' 
            ? { ...msg, status: 'sent' }
            : msg
        );

        await updateDoc(messagesRef, { messages: updatedMessages });
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  // Debounce to avoid too many updates
  const timer = setTimeout(updateMessageStatus, 500);
  return () => clearTimeout(timer);
}, [messages, messagesId]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    const markAsRead = async () => {
      if (!messagesId || !userData?.id) return;

      try {
        const userChatsRef = doc(db, 'chats', userData.id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (!userChatsSnapshot.exists()) return;

        const userChatData = userChatsSnapshot.data();
        const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);

        if (chatIndex !== -1 && userChatData.chatsData[chatIndex].messageSeen === false) {
          userChatData.chatsData[chatIndex].messageSeen = true;
          userChatData.chatsData[chatIndex].unreadCount = 0;
          await updateDoc(userChatsRef, { chatsData: userChatData.chatsData });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markAsRead();
  }, [messagesId, userData?.id]);

  //chats that are opene mark read 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mark messages as seen by recipient
useEffect(() => {
  const markMessagesSeen = async () => {
    if (!messagesId || !userData?.id) return;

    try {
      const messagesRef = doc(db, 'messages', messagesId);
      const messagesSnapshot = await getDoc(messagesRef);

      if (!messagesSnapshot.exists()) return;

      const allMessages = messagesSnapshot.data()?.messages || [];
      let hasUnseen = false;

      const updatedMessages = allMessages.map(msg => {
        // If message is from the other person and not yet seen
        if (msg.sid !== userData.id && !msg.seen) {
          hasUnseen = true;
          return {
            ...msg,
            seen: true,
            seenAt: Timestamp.now()
          };
        }
        return msg;
      });

      // Only update if there were unseen messages
      if (hasUnseen) {
        await updateDoc(messagesRef, { messages: updatedMessages });
        console.log('✅ Messages marked as seen');
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  markMessagesSeen();
}, [messagesId, userData?.id, messages.length]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !messagesId) return;

    try {
      // Add message to messages collection with proper timestamp
      await updateDoc(doc(db, 'messages', messagesId), {
        messages: arrayUnion({
          sid: userData.id,
          text: message,
          timestamp: Timestamp.now(),
          status:'sending',
          seen:false,
          seenAt:null
        }),
      });

      // Update chatsData for sender and receiver
      const userIds = [chatUser?.rId, userData.id].filter(Boolean);
      await Promise.all(
        userIds.map(async (id) => {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (!userChatsSnapshot.exists()) return;

          const userChatData = userChatsSnapshot.data();
          const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);

          if (chatIndex === -1) return;

          userChatData.chatsData[chatIndex].lastMessage = message.slice(0, 30);
          userChatData.chatsData[chatIndex].updatedAt = Date.now();

          // Mark as unread for receiver, read for sender
        
if (userChatData.chatsData[chatIndex].rId === userData.id) {
  const currentUnread = userChatData.chatsData[chatIndex].unreadCount || 0;
  userChatData.chatsData[chatIndex].unreadCount = currentUnread + 1;
  userChatData.chatsData[chatIndex].messageSeen = false;
} else {
  userChatData.chatsData[chatIndex].unreadCount = 0;
  userChatData.chatsData[chatIndex].messageSeen = true;
}

          await updateDoc(userChatsRef, { chatsData: userChatData.chatsData });
        })
      );
    } catch (error) {
      toast.error(error.message);
      console.error("Send message error:", error);
    }

    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle Firestore Timestamp object
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Handle string timestamp
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    // Handle Date object or number
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const MessageBubble = ({ msg }) => {
    const isMe = msg.sid === userData.id;
    
    // Determine status icon and text
    const getStatusIndicator = () => {
      if (!isMe) return null; // Only show for sent messages
      
      if (msg.status === 'sending') {
        return (
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-blue-100 rounded-full animate-pulse"></span>
              <span className="w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <span className="text-xs text-blue-100">Sending</span>
          </div>
        );
      }
      
      if (msg.seen) {
        return (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
            <svg className="w-4 h-4 text-blue-100 -ml-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
            <span className="text-xs text-blue-100"></span>
          </div>
        );
      }
      
      // Default: sent but not seen (single checkmark)
      return (
        <svg 
          className="w-4 h-4 text-blue-100"
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
        </svg>
      );
    };
  
    return (
      <div className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
            isMe
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-blue-100'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
          <div className="flex items-center justify-end mt-1 gap-1">
            <span className={`text-xs ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
              {msg.seenAt ? formatTimestamp(msg.seenAt) : formatTimestamp(msg.timestamp)}
            </span>
            {getStatusIndicator()}
          </div>
        </div>
      </div>
    );
  };

  return chatUser ? (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-blue-100 pt-3 pb-[17.6px] px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
        <div className="relative">
  <img 
    src={chatUser.userData?.avatar || chatUser.rAvatar || "/favicon.ico"} 
    alt="chat user" 
    className="w-10 h-10 rounded-full object-cover" 
  />
  {/* Online status indicator */}
  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
    chatUser.userData?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
  }`}></div>
</div>
          <div>
  <h3 className="font-medium text-gray-800">
    {chatUser.userData?.name || chatUser.rName || "Unknown"}
  </h3>
  <p className={`text-xs text-start ${
    chatUser.userData?.status === 'online' ? 'text-green-500' : 'text-gray-500'
  }`}>
    {chatUser.userData?.status === 'online' 
      ? 'Online' 
      : chatUser.userData?.lastSeen 
        ? `Last seen ${formatLastSeen(chatUser.userData.lastSeen)}`
        : 'Offline'
    }
  </p>
</div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600" onClick={onOpenProfile}>
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-24 h-24 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Send className="w-12 h-12 text-blue-400" />
              </div>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-blue-100 px-4 pt-[17.6px] py-3">
        <div className="flex items-center space-x-3">
          <button className="text-blue-400 hover:text-blue-600 transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <button className="text-blue-400 hover:text-blue-600 transition-colors">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-blue-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-full transition-colors ${
              message.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-100 text-blue-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gradient-to-b from-gray-50 to-white">
      <svg className="w-32 h-32 mb-6 animate-bounce" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="48" height="36" rx="6" stroke="currentColor" strokeWidth="4" />
        <path d="M16 24h32M16 32h32M16 40h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 52l-4 4v-4h4z" fill="currentColor" />
      </svg>
      <p className="text-lg font-medium text-gray-500">Select a user to start chatting</p>
      <p className="text-sm mt-2 text-gray-400">Your messages will appear here once you start a conversation</p>
    </div>
  );
};

export default ChatBox;