import { initializeApp } from "firebase/app";
import {getAuth,signOut,createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import {getFirestore, setDoc, doc,updateDoc} from 'firebase/firestore';
import {toast} from 'react-toastify'
import {getMessaging, getToken, onMessage} from 'firebase/messaging'

const firebaseConfig = {
    apiKey: "AIzaSyBCyvx3kzwCBeOSe1MCm6M4BFL3T6ZOTP0",
    authDomain: "connectify-9803.firebaseapp.com",
  projectId: "connectify-9803",
  storageBucket: "connectify-9803.firebasestorage.app",
  messagingSenderId: "291325959035",
  appId: "1:291325959035:web:d1ebf3fc49e76d4fc93bde",
  measurementId: "G-RZQWXL63PX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Request notification permission
const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

// Save FCM token to Firestore
const saveFcmToken = async (uid) => {
    try {
        if(!uid){
            console.log('No userId provided');
            return;
        }

      const permission = await requestNotificationPermission();
  
      if (permission) {
        const token = await getToken(messaging, {
          vapidKey: "BFR4GjxKJNGnp1bOEFPOA65drvCbakGA_KS3hnlZNlJBviDIZ503cY-3--qM69eO4QVyadXTj9OLqK-UIHgPhLg"
        });
  
        if (token) {
          await updateDoc(doc(db, "users", uid), { fcmToken: token });
          console.log("✅ FCM token saved for:", uid);
          toast.success("Notifications enabled!");
          return token;
        } else {
          console.warn("⚠️ No registration token available.");
          toast.warn("Could not get notification token");
        }
      } else {
        console.warn("⚠️ Notification permission not granted.");
        toast.info("Enable notifications for better experience");
      }
    } catch (error) {
      console.error("Error saving FCM token:", error);
      toast.error("Failed to setup notifications");
    }
    return null;
};

const signup = async (firstName,lastName,email,password,confirmPassword,terms) =>{
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        
        await setDoc(doc(db,"users",user.uid),{
            id:user.uid,
            email,
            firstName,
            lastName,
            name:`${firstName} ${lastName}`,
            lastSeen: Date.now(),
            avatar: "https://i.pravatar.cc/150?u=" + user.uid,
            fcmToken: null
        });
        
        await setDoc(doc(db,"chats",user.uid),{
            chatsData:[]
        });
        
        // Request notification permission after signup
        await saveFcmToken(user.uid);
        
        toast.success("Account created successfully!");
        return user;
    } catch (error) {
        console.error("Signup error:", error);
        toast.error(error.code.split('/')[1].split('-').join(' '));
        throw error;
    }
};

const login = async (email,password) =>{
    try{
        const res = await signInWithEmailAndPassword(auth,email,password);
        
        // Save/update FCM token on login
        await saveFcmToken(res.user.uid);
        
        toast.success("Logged in successfully!");
        return res.user;
    }catch (error){
        console.error("Login error:", error);
        toast.error(error.code.split('/')[1].split('-').join(' '));
        throw error;
    }
}

const logout = async() => {
    try{
        // Clear FCM token on logout
        const user = auth.currentUser;
        if (user) {
            await updateDoc(doc(db, "users", user.uid), { fcmToken: null });
        }
        
        await signOut(auth);
        toast.success("Logged out successfully!");
    }catch(error){
        console.error("Logout error:", error);
        toast.error(error.code.split('/')[1].split('-').join(' '));
        throw error;
    }
}





export {
    signup, 
    login, 
    logout,
    auth,
    db,
    onMessage, 
    saveFcmToken,
    messaging,
    requestNotificationPermission 
}