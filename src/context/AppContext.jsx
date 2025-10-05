import { useState, useEffect } from 'react'
import { createContext } from 'react'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { auth,db } from '../config/firebase'


export const AppContext = createContext();

const AppContextProvider = (props) => {

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    
    const loadUserData = async (uid) => {
        try {
            setLoading(true)
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            setUserData(userData);
            setCurrentUser([uid, ...userData])
            await updateDoc(userRef,{
                lastSeen:Date.now()
            })
            setInterval(async ()=>{
                if(auth.chatUser){
                    await updateDoc(userRef,{
                        lastSeen:Date.now()
                    })
                }
            },60000);
            setLoading(false)
        } catch (error) {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data()?.chatsData || [];
                const tempData = [];
                for (const item of chatItems) {
                    const userRef = doc(db, 'users', item.rId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    tempData.push({ ...item, userData })
                }
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt))
            })
            return (() => {
                unSub();
            })
        }
    }, [userData]);

    const value = {
        userData, setUserData,
        chatData, setChatData,
        loadUserData,
        currentUser, setCurrentUser,
        loading,
        messages,setMessages,
        messagesId,setMessagesId,
        chatUser,setChatUser
    }


    return (
        <AppContext.Provider value={value} >
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider