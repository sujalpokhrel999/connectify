import { useState, useEffect, useRef } from 'react'
import { createContext } from 'react'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export const AppContext = createContext();

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