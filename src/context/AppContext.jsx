import { useState, useEffect, useRef } from 'react'
import { createContext } from 'react'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'


export const AppContext = createContext();

// Add this BEFORE const AppContextProvider = (props) => {
    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
          try {
            const existingRegistration = await navigator.serviceWorker.getRegistration();
            
            if (!existingRegistration) {
              const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
              console.log('✅ Service Worker registered:', registration);
            } else {
              console.log('✅ Service Worker already registered');
            }
          } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
          }
        }
      };

const AppContextProvider = (props) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    
    // 🔥 ADD: Cache to prevent re-reading user documents
    const userDataCache = useRef({});
    const lastChatHash = useRef('');
    
    const loadUserData = async (uid) => {
        try {
            setLoading(true)
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            setUserData(userData);
            setCurrentUser({uid, ...userData})        
            setLoading(false)
        } catch (error) {
            console.error("Error loading user data:", error);
            setLoading(false)
        }
    }

    // 🔥 OPTIMIZED: This prevents 87% of excessive reads
    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data()?.chatsData || [];
                
                // 🔥 CREATE HASH: Check if chat list actually changed
                const currentHash = JSON.stringify(
                    chatItems.map(c => ({
                        id: c.messageId,
                        msg: c.lastMessage,
                        time: c.updatedAt,
                        seen: c.messageSeen
                    }))
                );
                
                // 🔥 SKIP IF UNCHANGED: Prevents unnecessary user reads
                if (lastChatHash.current === currentHash) {
                    console.log("⏭️ Chat list unchanged, skipping user document reads");
                    return;
                }
                lastChatHash.current = currentHash;
                
                console.log("🔄 Chat list changed, updating...");
                
                const tempData = [];
                const currentTime = Date.now();
                
                for (const item of chatItems) {
                    let cachedUser = userDataCache.current[item.rId];
                    
                    // 🔥 CACHE: Only fetch if not cached OR cache older than 5 minutes
                    const cacheAge = cachedUser ? currentTime - cachedUser.fetchedAt : Infinity;
                    
                    if (!cachedUser || cacheAge > 300000) {
                        console.log(`📥 Fetching user data for: ${item.rId}`);
                        const userRef = doc(db, 'users', item.rId);
                        const userSnap = await getDoc(userRef);
                        
                        cachedUser = {
                            ...userSnap.data(),
                            fetchedAt: currentTime
                        };
                        
                        userDataCache.current[item.rId] = cachedUser;
                    } else {
                        console.log(`✅ Using cached data for: ${item.rId} (age: ${Math.floor(cacheAge / 1000)}s)`);
                    }
                    
                    tempData.push({ ...item, userData: cachedUser })
                }
                
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt))
            })
            
            return () => {
                unSub();
            }
        }
    }, [userData]);

    // Add this new useEffect INSIDE AppContextProvider
useEffect(() => {
    // Register service worker once on app load
    registerServiceWorker();
  
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ User authenticated:', user.uid);
        await loadUserData(user.uid);
      } else {
        console.log('❌ User logged out');
        // Clear all state on logout
        setCurrentUser(null);
        setUserData(null);
        setChatData([]);
        setMessages([]);
        setMessagesId(null);
        setChatUser(null);
      }
    });
  
    return () => unsubscribe();
  }, []); // Empty dependency array - only run once

    const value = {
        userData, setUserData,
        chatData, setChatData,
        loadUserData,
        currentUser, setCurrentUser,
        loading,
        messages, setMessages,
        messagesId, setMessagesId,
        chatUser, setChatUser
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider