import React, { useState, useContext, useEffect } from "react";
import {
  Search,
  Plus,
  Archive,
  Inbox,
  MessageSquareMore,
  Bell,
  Users,
  Settings,
  User,
} from "lucide-react";
import { logout } from "../config/firebase";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import AddFriendModal from "./AddFriendModal.jsx";
import { AppContext } from "../context/AppContext.jsx";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../config/firebase";

const ChatSidebar = () => {
  const {
    chatData,
    userData,
    setCurrentUser,
    chatUser,
    setChatUser,
    messagesId,
    setMessagesId,
    presenceInterval,
    friends
  } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(presenceInterval);
      setCurrentUser(null);
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedTab, setSelectedTab] = useState("chats");
  const [localFriends, setLocalFriends] = useState([]);

useEffect(() => {
  setLocalFriends(friends || []);
}, [friends]);

  console.log(friends);

  // ===== CHANGE 1: Filter friends by search term =====
  const filteredFriends = (friends || []).filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Active chats
  const activeChats = (chatData || [])
    .filter((chat) => !chat.deletedFor?.includes(userData.id))
    .map((chat) => {
      const messagesArray = chat.messages || [];
      const unseenCount = messagesArray.filter(
        (msg) => msg.sid !== userData.id && !msg.seen
      ).length;
      return { ...chat, unseenCount };
    })
    .filter(
      (chat) =>
        chat.rName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chat.lastMessage || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

  // Archived chats
  const archivedChats = (chatData || [])
    .filter((chat) => chat.deletedFor?.includes(userData.id))
    .map((chat) => {
      const messagesArray = chat.messages || [];
      const unseenCount = messagesArray.filter(
        (msg) => msg.sid !== userData.id && !msg.seen
      ).length;
      return { ...chat, unseenCount };
    })
    .filter(
      (chat) =>
        chat.rName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chat.lastMessage || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    

  const displayChats = showArchived ? archivedChats : activeChats;

  const setChat = async (chat) => {
    setMessagesId(chat.messageId);
    setChatUser(chat);
    setActiveChat(chat.messageId);
  };

  // ===== CHANGE 2: New function to handle clicking a friend =====
  const setFriendChat = async (friend) => {
    try {
      // Check if chat already exists with this friend
      const existingChat = chatData?.find(chat => chat.rId === friend.id);
      
      if (existingChat) {
        // Chat exists, just open it
        setChat(existingChat);
      } else {
        // Chat doesn't exist yet
        // Convert friend object to chatUser format for ChatBox
        const friendAsChatUser = {
          messageId: null, // Will be set when first message is sent
          rId: friend.id,
          rName: friend.name,
          rAvatar: friend.avatar,
          lastMessage: "",
          updatedAt: Date.now(),
          messageSeen: true,
          unreadCount: 0,
          deletedFor: [],
          userData: {
            name: friend.name,
            avatar: friend.avatar,
            status: 'offline'
          }
        };
        
        setChatUser(friendAsChatUser);
        setActiveChat(friend.id); // Set to friend.id so UI knows which friend is selected
        setMessagesId(null); // No messageId yet
      }
    } catch (error) {
      console.error("Error opening friend chat:", error);
      toast.error("Failed to open chat");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const diff = now - date;
      const hours = diff / (1000 * 60 * 60);
      if (hours < 24 && now.getDate() === date.getDate()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (hours < 48 && now.getDate() - date.getDate() === 1) {
        return "Yesterday";
      } else if (hours < 168) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    } catch (error) {
      console.error("Time format error:", error);
      return "";
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0e11]">
      {/* Left Vertical Menu */}
      <div className="w-16 bg-[#1d1f1f] flex flex-col items-center py-4 gap-6 border-r border-[#2a3942]">
      <button
  className={`p-2.5 rounded-lg transition-colors duration-200 ${
    selectedTab === "chats"
      ? "bg-[#2a3942] text-[#aebac1]" // active background
      : "hover:bg-[#2a3942] text-[#aebac1]" // inactive with hover
  }`}
  onClick={() => setSelectedTab("chats")}
>
  <MessageSquareMore className="w-5 h-5" />
</button>

<button
  className={`p-2.5 rounded-lg transition-colors duration-200 ${
    selectedTab === "notifications"
      ? "bg-[#2a3942] text-[#aebac1]" // active background
      : "hover:bg-[#2a3942] text-[#aebac1]" // inactive with hover
  }`}
  onClick={() => setSelectedTab("notifications")}
>
  <Bell className="w-5 h-5" />
</button>


<button
  className={`p-2.5 rounded-lg transition-colors duration-200 ${
    selectedTab === "friends"
      ? "bg-[#2a3942] text-[#aebac1]" // active background
      : "hover:bg-[#2a3942] text-[#aebac1]" // inactive with hover
  }`}
  onClick={() => setSelectedTab("friends")}
>
  <Users className="w-5 h-5" />
</button>

        <button
            onClick={() =>  {
              setShowArchived(!showArchived);
              setSelectedTab("chats");
            }}
            className={`p-2.5 hover:bg-[#2a3942] rounded-lg transition-colors duration-200 ${
              showArchived
                ? "bg-[#2a3942] text-[#aebac1]"
                : "text-[#aebac1] hover:bg-[#2a3942]/50"
            }`}
          >
            {showArchived ? (
              <>
                <Archive className="w-4 h-4" />
                <span className="text-sm font-medium">
                </span>
              </>
            ) : (
              <>
                <Inbox className="w-4 h-4" />
                <span className="text-sm font-medium">

                </span>
              </>
            )}
          </button>

        <div className="flex-1" />

        <button className="p-2.5 hover:bg-[#2a3942] rounded-lg transition-colors duration-200"  onClick={() => setSelectedTab("setting")}>
          <Settings className="w-5 h-5 text-[#aebac1]" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="p-2.5 hover:bg-[#2a3942] rounded-lg transition-colors duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00a884] to-[#017561] flex items-center justify-center overflow-hidden hover:shadow-lg hover:shadow-[#00a884]/30 transition-all duration-200">
            {userData?.avatar ? (
              <img
                src={userData.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Main Chat Sidebar */}
        {selectedTab === "chats" && (
      <div className="w-80 bg-[#141616] flex flex-col border-r border-[#2a2d2d]">
        {/* Header */}
          
        <div className="h-16 bg-[#141616] flex items-center justify-between px-4 border-b border-[#2a2d2d]">
          <h1 className="text-white text-xl font-bold tracking-wide">Chats</h1>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200"
          >
            <Plus className="w-5 h-5 text-[#00a884]" />
          </button>
          <AddFriendModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>

       {/* Search */}
        <div className="p-3 bg-[#141616]">
          <div className="flex items-center gap-3 bg-[#2E2F2F] px-4 py-2.5 rounded-full hover:bg-[#242626] transition-colors duration-200 focus-within:bg-[#242626]">
            <Search className="w-5 h-5 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder:text-[#8696a0] outline-none text-sm"
            />
          </div>
        </div>


       {/* Chat List */}
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a3942] scrollbar-track-transparent">
          {displayChats.length === 0 ? (
            <div className="text-center py-12 text-[#8696a0] text-sm">
              <p className="text-lg mb-2">📭</p>
              {showArchived ? "No archived chats" : "No conversations yet"}
            </div>
          ) : (
            displayChats.map((chat) => (
              <button
                key={chat.messageId}
                onClick={() => setChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#242626] transition-all duration-150 border-b border-[#2a2d2d] group ${
                  activeChat === chat.messageId ? "bg-[#2e2f2f]" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.rAvatar || "/favicon.ico"}
                    alt={chat.rName}
                    className="w-12 h-12 rounded-full object-cover group-hover:shadow-lg transition-all duration-200"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] transition-all duration-200 ${
                      chat.userData?.status === "online"
                        ? "bg-[#00a884]"
                        : "bg-[#565d61]"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`text-sm truncate font-medium transition-colors duration-200 ${
                        chat.messageSeen === false
                          ? "text-white"
                          : "text-[#aebac1]"
                      }`}
                    >
                      {chat.rName || "Unknown"}
                    </h4>
                    <span className="text-xs text-[#8696a0] ml-2 flex-shrink-0">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs truncate transition-colors duration-200 ${
                        chat.messageSeen === false
                          ? "text-[#aebac1] font-medium"
                          : "text-[#8696a0]"
                      }`}
                    >
                      {chat.lastMessage || "No messages yet"}
                    </p>
                    {chat.messageSeen === false && chat.unreadCount > 0 && (
                      <span className="ml-2 bg-[#00a884] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#00a884]/30">
                        {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      
                      <button onClick={handleLogout} className="text-white">Logout</button>

      </div>
      )}    

      {/* ===== CHANGE 3: Friends Tab with clickable friends ===== */}
      {selectedTab === "friends" && (
        <div className="w-80 bg-[#141616] flex flex-col border-r border-[#2a2d2d]">
          <div className="h-16 bg-[#141616] flex items-center justify-between px-4 border-b border-[#2a2d2d]">
            <h1 className="text-white text-xl font-bold tracking-wide">Friends</h1>
          </div>

          {/* Search for Friends */}
          <div className="p-3 bg-[#141616]">
            <div className="flex items-center gap-3 bg-[#2E2F2F] px-4 py-2.5 rounded-full hover:bg-[#242626] transition-colors duration-200 focus-within:bg-[#242626]">
              <Search className="w-5 h-5 text-[#8696a0]" />
              <input
                type="text"
                placeholder="Search friends"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-[#8696a0] outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a3942] scrollbar-track-transparent">
            {filteredFriends.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">
                {searchTerm ? "No friends found" : "No friends yet. Add some friends to start chatting!"}
              </p>
            ) : (
              <div className="space-y-0">
                {filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setFriendChat(friend)}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#242626] transition-all duration-150 border-b border-[#2a2d2d] ${
                      activeChat === friend.id ? "bg-[#2e2f2f]" : ""
                    }`}
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm text-start text-[#aebac1] truncate font-medium transition-colors duration-200">
                        {friend.name}
                      </h3>
                      <p className="text-xs text-start truncate text-[#8696a0] transition-colors duration-200">
                        {friend.email}
                      </p>
                    </div>
                    <span className="text-xs text-[#8696a0] ml-2 flex-shrink-0">
                      {new Date(friend.addedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatSidebar;