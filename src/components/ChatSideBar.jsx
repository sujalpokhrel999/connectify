import React, { useState, useContext } from "react";
import { Search, LogOut, Plus } from "lucide-react";
import { logout } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddFriendModal from './AddFriendModal.jsx';
import { AppContext } from '../context/AppContext.jsx';


const ChatSidebar = () => {



  const { chatData, userData, setCurrentUser, chatUser, setChatUser, messagesId, setMessagesId } = useContext(AppContext); // should be an array
  const navigate = useNavigate();

  const handleLogout = async () => {

    await logout();
    setCurrentUser(null)
    navigate('/login');
    toast.success('Successfully logged out');
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [isOpen, setIsOpen] = useState(false);



  // Filter chats based on rName or lastMessage
  const filteredChats = (chatData || []).filter(
    (chat) =>
      chat.rName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase())
  );


  const setChat = async (chat) =>{
   setMessagesId(chat.messageId);
   setChatUser(chat);
  }

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
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
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
                  onClick={() => setActiveChat(chat.messageId)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 group ${
                    activeChat === chat.messageId ? "bg-blue-100 shadow" : "hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center space-x-3" onClick={()=>setChat(chat)}>
                    <img alt="" src={chat.rAvatar} className="w-12 h-12 rounded-full border" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">{chat.rName}</h4>
                        <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {!isNaN(new Date(chat.updatedAt).getTime())
  ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate text-start">
                        {chat.lastMessage || "No messages yet"}
                      </p>
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
       <Link to="/profile" ><img alt="userAvatar" src={userData?.avatar} className="w-10 h-10 rounded-full" /> </Link>
          <div>
            <h3 className="font-semibold text-start text-sm">{userData?.name}</h3>
            <p className="text-xs text-gray-400">{userData?.email}</p>
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
