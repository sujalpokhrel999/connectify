import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Smile, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx';
import { onSnapshot, doc, updateDoc, getDoc, arrayUnion, Timestamp, setDoc, collection } from 'firebase/firestore';
import { db } from '.././config/firebase';
import { toast } from 'react-toastify';
import doodle from '.././assets/doodle.png';

const ChatBox = ({ onOpenProfile }) => {
  const { userData, messagesId, setMessagesId,setChatUser, chatUser, messages, setMessages, setChatData } = useContext(AppContext);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // At the start of ChatBox, check if chat is deleted for current user
  useEffect(() => {
    if (!messagesId || !userData?.id || !chatUser) return;

    // If this chat is deleted for current user, don't show messages
    if (chatUser.deletedFor?.includes(userData.id)) {
      setMessages([]);
      return;
    }
  }, [messagesId, userData?.id, chatUser]);

  useEffect(() => {
    if (!messagesId) return;
  
    const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
      const allMessages = res.data()?.messages || [];
      
      // ⭐ Handle both old array format and new object format
      let deletionTime = null;
      
      if (chatUser?.deletedFor) {
        // New format: object with timestamps
        if (typeof chatUser.deletedFor === 'object' && !Array.isArray(chatUser.deletedFor)) {
          deletionTime = chatUser.deletedFor[userData.id];
        }
        // Old format: array of user IDs (backwards compatibility)
        else if (Array.isArray(chatUser.deletedFor) && chatUser.deletedFor.includes(userData.id)) {
          deletionTime = 0; // Show no old messages
        }
      }
      
      if (deletionTime !== null && deletionTime !== undefined) {
        // ⭐ Only show messages sent AFTER deletion timestamp
        const filteredMessages = allMessages.filter(msg => {
          const msgTime = msg.timestamp?.seconds 
            ? msg.timestamp.seconds * 1000 
            : msg.timestamp;
          return msgTime > deletionTime;
        });
        setMessages(filteredMessages);
      } else {
        // Not deleted, show all messages
        setMessages(allMessages);
      }
    });
  
    return () => unSub();
  }, [messagesId, setMessages, chatUser, userData.id]);

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

  // ===== CHANGE 1: New function to create chat when first message is sent =====
  const createNewChat = async (friendId, friendData) => {
    try {
      // Create new message document with proper collection reference
      const messagesRef = collection(db, 'messages');
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, { 
        createdAt: Timestamp.now(), 
        messages: [] 
      });

      const messageId = newMessageRef.id;

      // Update chatsData for current user
      await updateDoc(doc(db, 'chats', userData.id), {
        chatsData: arrayUnion({
          messageId: messageId,
          lastMessage: "",
          rId: friendId,
          rName: friendData.rName,
          rAvatar: friendData.rAvatar,
          updatedAt: Date.now(),
          messageSeen: true,
          unreadCount: 0,
          deletedFor: []
        })
      });

      // Update chatsData for recipient
      await updateDoc(doc(db, 'chats', friendId), {
        chatsData: arrayUnion({
          messageId: messageId,
          lastMessage: "",
          rId: userData.id,
          rName: userData.name,
          rAvatar: userData.avatar,
          updatedAt: Date.now(),
          messageSeen: true,
          unreadCount: 0,
          deletedFor: []
        })
      });

      return messageId;
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatUser) return;
  
    try {
      let currentMessageId = messagesId;
      
      if (!messagesId) {
        currentMessageId = await createNewChat(chatUser.rId, {
          rName: chatUser.rName,
          rAvatar: chatUser.rAvatar
        });
      }
  
      setMessagesId(currentMessageId);
      setChatUser(prev => ({
        ...prev,
        messageId: currentMessageId
      }));
  
      // ⭐ UPDATE: Don't remove deletedFor timestamp - just update chat metadata
      const userChatsRef = doc(db, 'chats', userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatData = userChatsSnapshot.data();
      const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === currentMessageId);
  
      if (chatIndex !== -1) {
        const chat = userChatData.chatsData[chatIndex];
  
        // ⭐ KEEP deletedFor intact - don't modify it
        // The chat will move to active because updatedAt will be newer than deletionTime
        userChatData.chatsData[chatIndex] = {
          ...chat,
          // deletedFor stays unchanged!
        };
  
        await updateDoc(userChatsRef, { chatsData: userChatData.chatsData });
      }
  
      // Send the message (rest of code stays same)
      await updateDoc(doc(db, 'messages', currentMessageId), {
        messages: arrayUnion({
          sid: userData.id,
          text: message,
          timestamp: Timestamp.now(),
          status: 'sending',
          seen: false,
          seenAt: null
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
          const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === currentMessageId);
  
          if (chatIndex === -1) return;
  
          userChatData.chatsData[chatIndex].lastMessage = message.slice(0, 30);
          userChatData.chatsData[chatIndex].updatedAt = Date.now(); // ⭐ This makes it move to active
  
          if (userChatData.chatsData[chatIndex].rId === userData.id) {
            const currentUnread = userChatData.chatsData[chatIndex].unreadCount || 0;
            userChatData.chatsData[chatIndex].unreadCount = currentUnread + 1;
            userChatData.chatsData[chatIndex].messageSeen = false;
          } else {
            userChatData.chatsData[chatIndex].unreadCount = 0;
            userChatData.chatsData[chatIndex].messageSeen = true;
          }
  
          // ⭐ DON'T modify deletedFor here
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
        minute: '2-digit',
        hour12: false
      });
    }

    // Handle string timestamp
    if (typeof timestamp === 'string') {
      return timestamp;
    }

    // Handle Date object or number
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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
          </div>
        );
      }

      if (msg.seen) {
        return (
          <div className="flex items-center gap-0.5">
            <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
            <svg className="w-3.5 h-3.5 text-blue-300 -ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
            </svg>
          </div>
        );
      }

      // Default: sent but not seen (single checkmark)
      return (
        <svg
          className="w-3.5 h-3.5 text-blue-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
      );
    };

    return (
      <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
            isMe
              ? 'bg-[#056162] text-white rounded-br-none hover:shadow-md'
              : 'bg-[#1f2937] text-white rounded-bl-none hover:shadow-md'
          }`}
        >
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className={`text-[0.65em] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
              {msg.seenAt ? formatTimestamp(msg.seenAt) : formatTimestamp(msg.timestamp)}
            </span>
            {getStatusIndicator()}
          </div>
        </div>
      </div>
    );
  };

  return chatUser ? (
    <div className="flex flex-col h-screen bg-[#0a0e11]"style={{
      backgroundImage: `url(${doodle})`,
      backgroundRepeat: 'repeat',
      backgroundPosition: 'center',
      backgroundSize: 'auto',
      backgroundAttachment: 'fixed',
      backgroundColor: '#141616',
    }}>
      {/* Chat Header */}
      <div className="h-16 bg-[#141616] flex items-center justify-between px-6 border border-[#2a2d2d]">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={chatUser.userData?.avatar || chatUser.rAvatar || "/favicon.ico"}
              alt="chat user"
              className="w-10 h-10 rounded-full object-cover shadow-sm"
            />
            {/* Online status indicator */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#202c33] transition-all duration-200 ${
              chatUser.userData?.status === 'online' ? 'bg-[#00a884]' : 'bg-[#565d61]'
            }`}></div>
          </div>
          <div>
            <h3 className="font-medium text-white">
              {chatUser.userData?.name || chatUser.rName || "Unknown"}
            </h3>
            <p className={`text-xs transition-colors duration-200 ${
              chatUser.userData?.status === 'online' ? 'text-[#00a884]' : 'text-[#8696a0]'
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
        <div className="flex items-center space-x-2">
          <button className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200">
            <Phone className="w-5 h-5 text-[#aebac1]" />
          </button>
          <button className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200">
            <Video className="w-5 h-5 text-[#aebac1]" />
          </button>
          <button
            className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200"
            onClick={onOpenProfile}
          >
            <MoreVertical className="w-5 h-5 text-[#aebac1]" />
          </button>
        </div>
      </div>

      {/* Messages Area with Dimmed Doodle Background */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 relative scrollbar scrollbar-thin scrollbar-thumb-[#2a3942] scrollbar-track-transparent border border-[#2a2d2d] rounded-lg"
        style={{
          backgroundColor: '#141616eb',
        }}
      >
        <div className="space-y-3 relative z-10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <div className="w-20 h-20 mb-4 bg-[#2a3942] rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-[#8696a0]" />
              </div>
              <p className="text-sm font-medium text-[#8696a0]">No messages yet</p>
              <p className="text-xs text-[#565d61]">Start the conversation!</p>
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
      <div className="bg-[#141616] px-6 py-4 border-t border-[#2a2d2d]">
        <div className="flex items-center space-x-3">
          <button className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200 text-[#aebac1]">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200 text-[#aebac1]">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="w-full px-5 py-2.5 bg-[#242626] text-white placeholder:text-[#8696a0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all duration-200 text-sm"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              message.trim()
                ? 'bg-[#00a884] text-white hover:bg-[#009a79] shadow-lg shadow-[#00a884]/30'
                : 'text-[#565d61] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#141616]">
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