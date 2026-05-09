import React, { useState, useContext, useEffect } from "react";
import {
  Search,
  Plus,
  Archive,
  Inbox,
  MessageSquareMore,
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

const ChatSidebar = ({ onChatOpen }) => {
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

  // ===== CHANGE 1: Filter friends by search term =====
  const filteredFriends = (friends || []).filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ⭐ ACTIVE CHATS - Only show chats that are NOT deleted
  const activeChats = (chatData || [])
    .filter((chat) => {
      const deletionTime = chat.deletedFor?.[userData.id];
      if (!deletionTime) {
        return true;
      }
      return chat.updatedAt > deletionTime;
    })
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

  // ⭐ ARCHIVED CHATS - Only show deleted chats with NO new messages
  const archivedChats = (chatData || [])
    .filter((chat) => {
      const deletionTime = chat.deletedFor?.[userData.id];
      return deletionTime && chat.updatedAt <= deletionTime;
    })
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
    // ── RESPONSIVE: tell parent to show ChatBox on mobile ──
    if (onChatOpen) onChatOpen();
  };

  // ===== CHANGE 2: New function to handle clicking a friend =====
  const setFriendChat = async (friend) => {
    try {
      const existingChat = chatData?.find(chat => chat.rId === friend.id);
      if (existingChat) {
        setChat(existingChat);
      } else {
        const friendAsChatUser = {
          messageId: null,
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
        setActiveChat(friend.id);
        setMessagesId(null);
        // ── RESPONSIVE: tell parent to show ChatBox on mobile ──
        if (onChatOpen) onChatOpen();
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
    /*
     * RESPONSIVE:
     * Desktop : flex-row — icon rail left, panel beside it, fixed width
     * Mobile  : flex-col-reverse — panel fills screen, icon rail becomes bottom nav
     */
    <div className="flex flex-col-reverse sm:flex-row h-full bg-[#0a0e11]">

      {/* ── Icon rail ──
          Desktop : narrow vertical strip (w-16, flex-col)
          Mobile  : full-width horizontal bottom bar (flex-row, h-14)
      */}
      <div className="
        flex sm:flex-col items-center
        bg-[#1d1f1f]
        border-t sm:border-t-0 sm:border-r border-[#2a3942]
        py-2 sm:py-4
        px-4 sm:px-0
        gap-3 sm:gap-6
        h-14 sm:h-auto
        w-full sm:w-16
        justify-around sm:justify-start
        flex-shrink-0
        z-10
      ">
        <button
          className={`p-2.5 rounded-lg transition-colors duration-200 ${
            selectedTab === "chats"
              ? "bg-[#2a3942] text-[#aebac1]"
              : "hover:bg-[#2a3942] text-[#aebac1]"
          }`}
          onClick={() => setSelectedTab("chats")}
        >
          <MessageSquareMore className="w-5 h-5" />
        </button>

        <button
          className={`p-2.5 rounded-lg transition-colors duration-200 ${
            selectedTab === "friends"
              ? "bg-[#2a3942] text-[#aebac1]"
              : "hover:bg-[#2a3942] text-[#aebac1]"
          }`}
          onClick={() => setSelectedTab("friends")}
        >
          <Users className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
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
            <Archive className="w-4 h-4" />
          ) : (
            <Inbox className="w-4 h-4" />
          )}
        </button>

        {/* Spacer — desktop only, pushes avatar to bottom */}
        <div className="hidden sm:flex flex-1" />

        <button
          onClick={() => navigate('/profile')}
          className="p-2.5 hover:bg-[#2a3942] rounded-lg transition-colors duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00a884] to-[#017561] flex items-center justify-center overflow-hidden hover:shadow-lg hover:shadow-[#00a884]/30 transition-all duration-200">
            {userData?.avatar ? (
              <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* ── Chats panel ── */}
      {selectedTab === "chats" && (
        <div className="flex-1 sm:w-80 sm:flex-none bg-[#141616] flex flex-col border-r border-[#2a2d2d] min-h-0">
          <div className="h-14 sm:h-16 bg-[#141616] flex items-center justify-between px-4 border-b border-[#2a2d2d] flex-shrink-0">
            <h1 className="text-white text-lg sm:text-xl font-bold tracking-wide">Chats</h1>
            <button
              onClick={() => setIsOpen(true)}
              className="p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200"
            >
              <Plus className="w-5 h-5 text-[#00a884]" />
            </button>
            <AddFriendModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </div>

          <div className="p-3 bg-[#141616] flex-shrink-0">
            <div className="flex items-center gap-3 bg-[#2E2F2F] px-4 py-2.5 rounded-full hover:bg-[#242626] transition-colors duration-200 focus-within:bg-[#242626]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#8696a0] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-[#8696a0] outline-none text-sm min-w-0"
              />
            </div>
          </div>

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
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover group-hover:shadow-lg transition-all duration-200"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#111b21] transition-all duration-200 ${
                        chat.userData?.status === "online" ? "bg-[#00a884]" : "bg-[#565d61]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                      <h4
                        className={`text-sm truncate font-medium transition-colors duration-200 ${
                          chat.messageSeen === false ? "text-white" : "text-[#aebac1]"
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
                          chat.messageSeen === false ? "text-[#aebac1] font-medium" : "text-[#8696a0]"
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

          <button onClick={handleLogout} className="text-white py-2 px-4 text-sm border-t border-[#2a2d2d] flex-shrink-0">
            Logout
          </button>
        </div>
      )}

      {/* ===== CHANGE 3: Friends Tab ===== */}
      {selectedTab === "friends" && (
        <div className="flex-1 sm:w-80 sm:flex-none bg-[#141616] flex flex-col border-r border-[#2a2d2d] min-h-0">
          <div className="h-14 sm:h-16 bg-[#141616] flex items-center justify-between px-4 border-b border-[#2a2d2d] flex-shrink-0">
            <h1 className="text-white text-lg sm:text-xl font-bold tracking-wide">Friends</h1>
          </div>

          <div className="p-3 bg-[#141616] flex-shrink-0">
            <div className="flex items-center gap-3 bg-[#2E2F2F] px-4 py-2.5 rounded-full hover:bg-[#242626] transition-colors duration-200 focus-within:bg-[#242626]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#8696a0] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search friends"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-[#8696a0] outline-none text-sm min-w-0"
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
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
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