import React, { useState, useContext } from "react";
import { Search, LogOut, Plus } from "lucide-react";
import { logout } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddFriendModal from './AddFriendModal.jsx';
import { AppContext } from '../context/AppContext.jsx';

const ChatSidebar = () => {
  const { chatData, userData, setCurrentUser, chatUser, setChatUser, messagesId, setMessagesId } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
      console.error('Logout error:', error);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Filter chats based on rName or lastMessage
  const filteredChats = (chatData || []).filter(
    (chat) =>
      chat.rName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const setChat = async (chat) => {
    setMessagesId(chat.messageId);
    setChatUser(chat);
    setActiveChat(chat.messageId);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      
      const now = new Date();
      const diff = now - date;
      const hours = diff / (1000 * 60 * 60);
      
      // If today, show time
      if (hours < 24 && now.getDate() === date.getDate()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      // If yesterday
      else if (hours < 48 && now.getDate() - date.getDate() === 1) {
        return "Yesterday";
      }
      // If this week
      else if (hours < 168) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      // Older
      else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Time format error:', error);
      return "";
    }
  };


  return (
    <div className="w-full bg-white text-gray-900 flex flex-col h-screen border-r border-gray-200">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 flex gap-[5px] justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
          />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors relative"
        >
          <Plus className="w-5 h-5" />
        </button>
        <AddFriendModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No conversations found
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.messageId}
                onClick={() => setChat(chat)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 group relative ${
                  activeChat === chat.messageId ? "bg-blue-100 shadow" : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      alt={chat.rName || "User"} 
                      src={chat.rAvatar || "/favicon.ico"} 
                      className="w-12 h-12 rounded-full border object-cover" 
                    />
                    {/* Online status indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm truncate ${
                        chat.messageSeen === false ? 'font-bold' : 'font-semibold'
                      }`}>
                        {chat.rName || "Unknown"}
                      </h4>
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate text-start ${
                        chat.messageSeen === false ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {chat.lastMessage || "No messages yet"}
                      </p>
                      {/* Unread badge */}
                      {chat.messageSeen === false && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer with Current User + Logout */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/profile">
            <div className="relative">
              <img 
                alt="userAvatar" 
                src={userData?.avatar || "/favicon.ico"} 
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all" 
              />
              {/* Online status for current user */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </Link>
          <div>
            <h3 className="font-semibold text-start text-sm">{userData?.name || "User"}</h3>
            <p className="text-xs text-gray-400">{userData?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-500"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;