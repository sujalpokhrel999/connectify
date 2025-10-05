import { initializeApp } from "firebase/app";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

/**
 * Save FCM token for a user if not already saved
 */
const saveFcmToken = async (uid) => {
    try {
        if (!uid) {
            console.warn("❌ No userId provided to saveFcmToken()");
            return;
        }

        // Check if token is already saved for this user
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().fcmToken) {
            console.log("✅ FCM token already exists for this user");
            return;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        console.log("Notification permission:", permission);

        if (permission === "granted") {
            const token = await getToken(messaging, {
                vapidKey: "BFR4GjxKJNGnp1bOEFPOA65drvCbakGA_KS3hnlZNlJBviDIZ503cY-3--qM69eO4QVyadXTj9OLqK-UIHgPhLg"
            });

            if (token) {
                await updateDoc(userRef, { fcmToken: token });
                console.log("✅ FCM token saved for:", uid, token);
            } else {
                console.warn("⚠️ No registration token available.");
            }
        } else {
            console.warn("⚠️ Notification permission not granted.");
        }
    } catch (error) {
        console.error("Error saving FCM token:", error);
    }
};

const signup = async (firstName, lastName, email, password, confirmPassword, terms) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        lastSeen: Date.now(),
        avatar: "https://i.pravatar.cc/150?u=" + user.uid,
        fcmToken: null
    });

    await setDoc(doc(db, "chats", user.uid), {
        chatData: []
    });

    // Save FCM token after signup
    await saveFcmToken(user.uid);
};

const login = async (email, password) => {
    try {
        const res = await signInWithEmailAndPassword(auth, email, password);

        // Save FCM token after login if not already saved
        await saveFcmToken(res.user.uid);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(' '));
        throw error;
    }
};

export { signup, login, logout, auth, db, onMessage, saveFcmToken, messaging };
