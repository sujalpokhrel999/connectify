import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { Send, Smile, Paperclip, Phone, Video, MoreVertical, X, ArrowLeft } from 'lucide-react';
import { AppContext } from '../context/AppContext.jsx';
import { onSnapshot, doc, updateDoc, getDoc, arrayUnion, Timestamp, setDoc, collection } from 'firebase/firestore';
import { db } from '.././config/firebase';
import { toast } from 'react-toastify';
import doodle from '.././assets/doodle.png';

// ── Emoji data (no external library needed) ──────────────────────────────────
const EMOJI_CATEGORIES = {
  'Smileys': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠','🤡','🤥','🤫','🤭','🧐','🤓'],
  'Gestures': ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🪳','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒'],
  'Food': ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🫒','🥦','🥬','🥒','🌶','🫑','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','🍵','☕','🫖','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
  'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩'],
  'Objects': ['💌','💣','🔪','🗡','⚔️','🛡','🔫','🪃','🔧','🪛','🔨','⚒','🛠','⛏','🔩','🪤','🧱','⛓','🔗','🪝','🧲','🪜','🧰','🪣','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🫧','🪥','🧽','🧯','🛒','🚪','🪞','🪟','🛏','🛋','🪑','🚽','🚿','🛁','🪠','🧴','💊','💉','🩸','🩹','🩺','🩻','🌡','⏱','⏲','⏰','🕰','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯','🪔','🧱','💰','💴','💵','💶','💷','💸','💳','🪙','💹','💱','💲','📈','📉','📊','📋','🗒','🗓','📆','📅','📇','📌','📍','📎','🖇','📏','📐','✂️','🗃','🗄','🗑','🔒','🔓','🔏','🔐'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (typeof timestamp === 'string') return timestamp;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Offline';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

// ── MessageBubble (outside component so it never re-creates on parent render) ─
const MessageBubble = React.memo(({ msg, currentUserId }) => {
  const isMe = msg.sid === currentUserId;

  const StatusIndicator = () => {
    if (!isMe) return null;
    if (msg.status === 'sending') {
      return (
        <div className="flex gap-0.5">
          {[0, 0.1, 0.2].map((delay, i) => (
            <span key={i} className="w-1 h-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>
      );
    }
    if (msg.seen) {
      return (
        <div className="flex items-center gap-0.5">
          <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
          <svg className="w-3.5 h-3.5 text-blue-300 -ml-2" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
        </div>
      );
    }
    return (
      <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
      </svg>
    );
  };

  return (
    <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75vw] sm:max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 ${
        isMe ? 'bg-[#056162] text-white rounded-br-none hover:shadow-md' : 'bg-[#1f2937] text-white rounded-bl-none hover:shadow-md'
      }`}>
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-[0.65em] ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
            {msg.seenAt ? formatTimestamp(msg.seenAt) : formatTimestamp(msg.timestamp)}
          </span>
          <StatusIndicator />
        </div>
      </div>
    </div>
  );
});

// ── Typing indicator bubble ───────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex mb-3 justify-start">
    <div className="bg-[#1f2937] text-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
      <div className="flex items-center gap-1">
        {[0, 0.15, 0.3].map((delay, i) => (
          <span
            key={i}
            className="w-2 h-2 bg-[#8696a0] rounded-full animate-bounce"
            style={{ animationDelay: `${delay}s`, animationDuration: '0.8s' }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ── Emoji Picker ──────────────────────────────────────────────────────────────
const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const pickerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 left-0 w-64 sm:w-72 bg-[#1f2c34] border border-[#2a3942] rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-[#2a3942] scrollbar-none">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors duration-150 ${
              activeCategory === cat
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="h-48 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#2a3942] scrollbar-track-transparent">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].map((emoji, i) => (
            <button
              key={i}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#2a3942] rounded-lg transition-colors duration-100 hover:scale-110 transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main ChatBox ──────────────────────────────────────────────────────────────
const ChatBox = ({ onOpenProfile, onBack }) => {
  const {
    userData, messagesId, setMessagesId, setChatUser,
    chatUser, messages, setMessages, setChatData,
  } = useContext(AppContext);

  const [message, setMessage]         = useState('');
  const [isSending, setIsSending]     = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [peerIsTyping, setPeerIsTyping]       = useState(false);

  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ── Filter messages on deletion ───────────────────────────────────────────
  useEffect(() => {
    if (!messagesId || !userData?.id || !chatUser) return;
    if (chatUser.deletedFor?.includes(userData.id)) setMessages([]);
  }, [messagesId, userData?.id, chatUser]);

  // ── Subscribe to messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!messagesId) return;

    const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
      const allMessages = res.data()?.messages || [];
      let deletionTime = null;

      if (chatUser?.deletedFor) {
        if (typeof chatUser.deletedFor === 'object' && !Array.isArray(chatUser.deletedFor)) {
          deletionTime = chatUser.deletedFor[userData.id];
        } else if (Array.isArray(chatUser.deletedFor) && chatUser.deletedFor.includes(userData.id)) {
          deletionTime = 0;
        }
      }

      if (deletionTime !== null && deletionTime !== undefined) {
        setMessages(allMessages.filter(msg => {
          const msgTime = msg.timestamp?.seconds ? msg.timestamp.seconds * 1000 : msg.timestamp;
          return msgTime > deletionTime;
        }));
      } else {
        setMessages(allMessages);
      }

      const typingData = res.data()?.typing || {};
      const peerId = chatUser?.rId;
      setPeerIsTyping(!!typingData[peerId]);
    });

    return () => unSub();
  }, [messagesId, setMessages, chatUser, userData.id]);

  // ── Update sending → sent ─────────────────────────────────────────────────
  useEffect(() => {
    if (!messagesId || !messages.length) return;
    const timer = setTimeout(async () => {
      try {
        const messagesRef = doc(db, 'messages', messagesId);
        const snap = await getDoc(messagesRef);
        if (!snap.exists()) return;
        const all = snap.data()?.messages || [];
        if (!all.some(m => m.status === 'sending')) return;
        await updateDoc(messagesRef, {
          messages: all.map(m => m.status === 'sending' ? { ...m, status: 'sent' } : m),
        });
      } catch (e) { console.error('Status update error:', e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [messages, messagesId]);

  // ── Mark chat as read ─────────────────────────────────────────────────────
  useEffect(() => {
    const markAsRead = async () => {
      if (!messagesId || !userData?.id) return;
      try {
        const ref = doc(db, 'chats', userData.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const idx = data.chatsData.findIndex(c => c.messageId === messagesId);
        if (idx !== -1 && data.chatsData[idx].messageSeen === false) {
          data.chatsData[idx].messageSeen = true;
          data.chatsData[idx].unreadCount = 0;
          await updateDoc(ref, { chatsData: data.chatsData });
        }
      } catch (e) { console.error('markAsRead error:', e); }
    };
    markAsRead();
  }, [messagesId, userData?.id]);

  // ── Mark messages as seen ─────────────────────────────────────────────────
  useEffect(() => {
    const hasUnseenFromOther = messages.some(m => m.sid !== userData.id && !m.seen);
    if (!hasUnseenFromOther) return;

    const markSeen = async () => {
      if (!messagesId || !userData?.id) return;
      try {
        const ref = doc(db, 'messages', messagesId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const all = snap.data()?.messages || [];
        const updated = all.map(m =>
          m.sid !== userData.id && !m.seen ? { ...m, seen: true, seenAt: Timestamp.now() } : m
        );
        await updateDoc(ref, { messages: updated });
      } catch (e) { console.error('markSeen error:', e); }
    };
    markSeen();
  }, [messagesId, userData?.id, messages.length]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Cleanup typing on unmount / chat change ───────────────────────────────
  useEffect(() => {
    return () => {
      clearTypingStatus();
    };
  }, [messagesId]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const setTypingStatus = useCallback(async (isTyping) => {
    if (!messagesId || !userData?.id) return;
    try {
      await updateDoc(doc(db, 'messages', messagesId), {
        [`typing.${userData.id}`]: isTyping,
      });
    } catch (e) { /* silently ignore */ }
  }, [messagesId, userData?.id]);

  const clearTypingStatus = useCallback(() => {
    setTypingStatus(false);
  }, [setTypingStatus]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
    setTypingStatus(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 2000);
  }, [setTypingStatus]);

  // ── Emoji insert ──────────────────────────────────────────────────────────
  const handleEmojiSelect = useCallback((emoji) => {
    const input = inputRef.current;
    if (!input) { setMessage(prev => prev + emoji); return; }
    const start = input.selectionStart;
    const end   = input.selectionEnd;
    setMessage(prev => prev.slice(0, start) + emoji + prev.slice(end));
    requestAnimationFrame(() => {
      input.selectionStart = input.selectionEnd = start + emoji.length;
      input.focus();
    });
  }, []);

  // ── Create chat on first message ──────────────────────────────────────────
  const createNewChat = useCallback(async (friendId, friendData) => {
    const newMsgRef = doc(collection(db, 'messages'));
    await setDoc(newMsgRef, { createdAt: Timestamp.now(), messages: [] });
    const messageId = newMsgRef.id;

    const baseChatEntry = (rId, rName, rAvatar) => ({
      messageId, lastMessage: '', rId, rName, rAvatar,
      updatedAt: Date.now(), messageSeen: true, unreadCount: 0, deletedFor: [],
    });

    await updateDoc(doc(db, 'chats', userData.id), {
      chatsData: arrayUnion(baseChatEntry(friendId, friendData.rName, friendData.rAvatar)),
    });
    await updateDoc(doc(db, 'chats', friendId), {
      chatsData: arrayUnion(baseChatEntry(userData.id, userData.name, userData.avatar)),
    });

    return messageId;
  }, [userData]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || !chatUser || isSending) return;

    setIsSending(true);
    setMessage('');
    clearTimeout(typingTimeoutRef.current);
    setTypingStatus(false);

    try {
      let currentMessageId = messagesId;
      if (!messagesId) {
        currentMessageId = await createNewChat(chatUser.rId, {
          rName: chatUser.rName,
          rAvatar: chatUser.rAvatar,
        });
        setMessagesId(currentMessageId);
        setChatUser(prev => ({ ...prev, messageId: currentMessageId }));
      }

      await updateDoc(doc(db, 'messages', currentMessageId), {
        messages: arrayUnion({
          sid: userData.id,
          text: trimmed,
          timestamp: Timestamp.now(),
          status: 'sending',
          seen: false,
          seenAt: null,
        }),
      });

      const userIds = [chatUser?.rId, userData.id].filter(Boolean);
      await Promise.all(userIds.map(async (id) => {
        const ref  = doc(db, 'chats', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const idx  = data.chatsData.findIndex(c => c.messageId === currentMessageId);
        if (idx === -1) return;

        data.chatsData[idx].lastMessage = trimmed.slice(0, 30);
        data.chatsData[idx].updatedAt   = Date.now();

        if (data.chatsData[idx].rId === userData.id) {
          data.chatsData[idx].unreadCount  = (data.chatsData[idx].unreadCount || 0) + 1;
          data.chatsData[idx].messageSeen  = false;
        } else {
          data.chatsData[idx].unreadCount  = 0;
          data.chatsData[idx].messageSeen  = true;
        }

        await updateDoc(ref, { chatsData: data.chatsData });
      }));
    } catch (error) {
      toast.error(error.message);
      console.error('Send message error:', error);
      setMessage(trimmed);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [message, chatUser, isSending, messagesId, userData, createNewChat, setMessagesId, setChatUser, setTypingStatus]);

  // ── Key handler ───────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // ─────────────────────────────────────────────────────────────────────────
  return chatUser ? (
    <div
      className="flex flex-col h-full bg-[#0a0e11]"
      style={{
        backgroundImage: `url(${doodle})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        backgroundSize: 'auto',
        backgroundAttachment: 'fixed',
        backgroundColor: '#141616',
      }}
    >
      {/* ── Header ── */}
      <div className="h-14 sm:h-16 bg-[#141616] flex items-center justify-between px-3 sm:px-6 border border-[#2a2d2d] flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          {/* ── RESPONSIVE: back arrow — visible on mobile only ── */}
          <button
            onClick={onBack}
            className="sm:hidden p-2 hover:bg-[#2a3942] rounded-full transition-colors duration-200 flex-shrink-0"
            aria-label="Back to chats"
          >
            <ArrowLeft className="w-5 h-5 text-[#aebac1]" />
          </button>

          <div className="relative flex-shrink-0">
            <img
              src={chatUser.userData?.avatar || chatUser.rAvatar || '/favicon.ico'}
              alt="chat user"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm"
            />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#202c33] transition-all duration-200 ${
              chatUser.userData?.status === 'online' ? 'bg-[#00a884]' : 'bg-[#565d61]'
            }`} />
          </div>

          <div className="min-w-0">
            <h3 className="font-medium text-white text-sm sm:text-base truncate">
              {chatUser.userData?.name || chatUser.rName || 'Unknown'}
            </h3>
            <p className={`text-xs transition-colors duration-200 truncate ${
              chatUser.userData?.status === 'online' ? 'text-[#00a884]' : 'text-[#8696a0]'
            }`}>
              {chatUser.userData?.status === 'online'
                ? 'Online'
                : chatUser.userData?.lastSeen
                  ? `Last seen ${formatLastSeen(chatUser.userData.lastSeen)}`
                  : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button className="p-2 sm:p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#aebac1]" />
          </button>
          <button className="p-2 sm:p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-[#aebac1]" />
          </button>
          <button
            className="p-2 sm:p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200"
            onClick={onOpenProfile}
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-[#aebac1]" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 relative scrollbar scrollbar-thin scrollbar-thumb-[#2a3942] scrollbar-track-transparent border border-[#2a2d2d] rounded-lg"
        style={{ backgroundColor: '#141616eb' }}
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
              <MessageBubble key={idx} msg={msg} currentUserId={userData.id} />
            ))
          )}

          {peerIsTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="bg-[#141616] px-2 sm:px-6 py-3 sm:py-4 border-t border-[#2a2d2d] flex-shrink-0">
        <div className="flex items-center space-x-1 sm:space-x-3 relative">

          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className={`p-2 sm:p-2.5 rounded-full transition-colors duration-200 flex-shrink-0 ${
              showEmojiPicker ? 'bg-[#2a3942] text-[#00a884]' : 'hover:bg-[#2a3942] text-[#aebac1]'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                handleEmojiSelect(emoji);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          <button className="p-2 sm:p-2.5 hover:bg-[#2a3942] rounded-full transition-colors duration-200 text-[#aebac1] flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              disabled={isSending}
              className="w-full px-4 sm:px-5 py-2.5 bg-[#242626] text-white placeholder:text-[#8696a0] rounded-full focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all duration-200 text-sm disabled:opacity-60"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 flex-shrink-0 ${
              message.trim() && !isSending
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
        <path d="M16 24h32M16 32h32M16 40h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 52l-4 4v-4h4z" fill="currentColor" />
      </svg>
      <p className="text-lg font-medium text-gray-500">Select a user to start chatting</p>
      <p className="text-sm mt-2 text-gray-400">Your messages will appear here once you start a conversation</p>
    </div>
  );
};

export default ChatBox;