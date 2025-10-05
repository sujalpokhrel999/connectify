import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Smile, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx'
import { onSnapshot, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore'
import { db } from '.././config/firebase'
import { toast } from 'react-toastify'

const ChatBox = ( {onOpenProfile}) => {

  const { userData, messagesId, chatUser, messages, setMessages } = useContext(AppContext)


  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!messagesId) return;
  
    const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
      const newMessages = res.data()?.messages || [];
      setMessages(newMessages);
    });
  
    return () => unSub();
  }, [messagesId]);






  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {

    try {

      if (message && messagesId) {
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sid: userData.id,
            text: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })
        })
        const userIds = [chatUser.rId, userData.id];

        userIds.forEach(async (id) => {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);
            userChatData.chatsData[chatIndex].lastMessage = message.slice(0, 30);
            userChatData.chatsData[chatIndex].updatedAt = Date.now();

            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }

            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData
            })
          }
        })
      }
    } catch (error) {
      toast.error(error.message)
    }
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageBubble = ({ msg }) => {
    const isMe = msg.sid===userData.id;
    return (
      <div className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs lg:max-w-md px-2 py-2 rounded-lg ${
            isMe
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-blue-100'
            }`}
        >
          <p className="text-sm">{msg.text}</p>
          <div className={`flex items-center justify-end mt-1 gap-1`}>
            <span className={`text-xs ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
              {msg.timestamp}
            </span>
            {isMe && (
              <div className="flex">
                {msg.status === 'sent' && (
                  <svg className="w-4 h-4 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {msg.status === 'delivered' && (
                  <div className="flex">
                    <svg className="w-4 h-4 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <svg className="w-4 h-4 text-blue-100 -ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {msg.status === 'read' && (
                  <div className="flex">
                    <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <svg className="w-4 h-4 text-blue-300 -ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  };

  return chatUser ? (
    <div className="flex w-4-/5 flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-blue-100 pt-3 pb-[17.6px] px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={chatUser.userData?.avatar} alt="chat user" className="w-10 h-10  rounded-full " />
          <div>
            <h3 className="font-medium text-gray-800">{chatUser.userData?.name}</h3>
            <p className="text-xs text-blue-500">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600" onClick ={onOpenProfile}>
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="space-y-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
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
  )
    : (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
      {/* Animated chat bubble SVG */}
      <svg
        className="w-32 h-32 mb-6 animate-bounce"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="12" width="48" height="36" rx="6" stroke="currentColor" strokeWidth="4" />
        <path d="M16 24h32M16 32h32M16 40h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M20 52l-4 4v-4h4z" fill="currentColor" />
      </svg>
    
      <p className="text-lg font-medium text-gray-500">Select a user to start chatting</p>
      <p className="text-sm mt-2 text-gray-400">Your messages will appear here once you start a conversation</p>
    </div>
    
    )
};

export default ChatBox;