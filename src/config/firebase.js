import { initializeApp } from "firebase/app";
import {getAuth,signOut,createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import {getFirestore, setDoc, doc,updateDoc,getDoc} from 'firebase/firestore';
import {toast} from 'react-toastify'
import {getMessaging, getToken, onMessage} from 'firebase/messaging'
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

const rtdb = getDatabase(
  app,
  process.env.REACT_APP_FIREBASE_DATABASE_URL
); // Realtime Database (Singapore region)


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
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
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
            fcmToken: null,
            status: 'online'
        });
        
        await setDoc(doc(db,"chats",user.uid),{
            chatsData:[]
        });
        
        // Request notification permission after signup
        await saveFcmToken(user.uid);

         // Setup presence tracking
         await setupPresence(user.uid);
        
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

         // Setup presence tracking
         await setupPresence(res.user.uid);
        
        toast.success("Logged in successfully!");
        return res.user;
    }catch (error){
        console.error("Login error:", error);
        toast.error(error.code.split('/')[1].split('-').join(' '));
        throw error;
    }
}

const logout = async(presenceInterval) => {
  try{
      const user = auth.currentUser;
      if (user) {
          // Clear FCM token
          await updateDoc(doc(db, "users", user.uid), { fcmToken: null });
          
          // Cleanup presence
          await cleanupPresence(user.uid, presenceInterval);
      }
      
      await signOut(auth);
      toast.success("Logged out successfully!");
  }catch(error){
      console.error("Logout error:", error);
      toast.error(error.code.split('/')[1].split('-').join(' '));
      throw error;
  }
}


// Setup user presence tracking
const setupPresence = async (uid) => {
  if (!uid) return;

  try {
    const userStatusRef = ref(rtdb, `/status/${uid}`);
    const userFirestoreRef = doc(db, 'users', uid);

    // Online status object
    const isOnlineData = {
      state: 'online',
      lastChanged: rtdbServerTimestamp(),
    };

    // Offline status object
    const isOfflineData = {
      state: 'offline',
      lastChanged: rtdbServerTimestamp(),
    };

    // Create a reference to the special '.info/connected' path in Realtime Database
    // This path tells us when the client connects/disconnects
    const connectedRef = ref(rtdb, '.info/connected');

    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✅ User connected');
    
        // Set user as online in Realtime Database
        set(userStatusRef, isOnlineData);
    
        // Queue offline update for Realtime Database when disconnecting
        onDisconnect(userStatusRef).set(isOfflineData);
    
        // Update Firestore immediately
        updateDoc(userFirestoreRef, {
          status: 'online',
          lastSeen: Date.now()
        }).catch(err => console.error('Firestore update error:', err));
    
      } else {
        console.log('❌ User disconnected');
    
        // Update Firestore directly — already offline
        updateDoc(userFirestoreRef, {
          status: 'offline',
          lastSeen: Date.now()
        }).catch(err => console.error('Firestore update error:', err));
      }
    });
    

    // Update presence every 5 minutes while user is active
    const presenceInterval = setInterval(async () => {
      try {
        const userDoc = await getDoc(userFirestoreRef);
        if (userDoc.exists() && userDoc.data().status === 'online') {
          await updateDoc(userFirestoreRef, {
            lastSeen: Date.now()
          });
          console.log('🔄 Presence heartbeat updated');
        }
      } catch (error) {
        console.error('Presence update error:', error);
      }
    }, 300000); // 5 minutes

    // Store interval ID so we can clear it on logout
    return presenceInterval;
  } catch (error) {
    console.error('Error setting up presence:', error);
    return null;
  }
};

// Clean up presence on logout
const cleanupPresence = async (uid, presenceInterval) => {
  if (!uid) return;

  try {
    // Clear the heartbeat interval
    if (presenceInterval) {
      clearInterval(presenceInterval);
    }

    // Set user as offline
    const userFirestoreRef = doc(db, 'users', uid);
    await updateDoc(userFirestoreRef, {
      status: 'offline',
      lastSeen: Date.now()
    });

    console.log('✅ Presence cleaned up');
  } catch (error) {
    console.error('Error cleaning up presence:', error);
  }
};


export {
    signup, 
    login, 
    logout,
    auth,
    db,
    onMessage, 
    saveFcmToken,
    messaging,
    requestNotificationPermission,
    setupPresence, 
    cleanupPresence,
    rtdb 
}