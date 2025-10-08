import './App.css';
import React, { useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/login/Login.jsx';
import SignUp from './pages/login/SignUp.jsx';
import Chat from './pages/Chat/Chat.jsx';
import Profile from './pages/profile/Profile.jsx';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthProvider } from './config/authContext';
import { auth } from './config/firebase';
import { AppContext } from './context/AppContext.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';
import EditProfile from './pages/profile/EditProfile.jsx';
import { requestNotificationPermission } from './config/firebase';

function App() {
  const navigate = useNavigate();
  const { loadUserData } = useContext(AppContext);

  // Request notification permission on app load
  useEffect(() => {
    const setupNotifications = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered:', registration);

          // Request notification permission
          if (Notification.permission === 'default') {
            const permission = await requestNotificationPermission();
            if (permission) {
              console.log('Notification permission granted');
            }
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    setupNotifications();
  }, []);


  useEffect(() => {
    let intervalId;

    const checkUser = async (user) => {
      if (user) { // ✅ prevent duplicate triggers

  
        await loadUserData(user.uid);

  
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {

        }, 120000);
  
        if (["/", "/signup"].includes(window.location.pathname)) {
          navigate("/chat");
        }
      } 
    };
  
    const unsubscribe = onAuthStateChanged(auth, checkUser);
    
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [loadUserData, navigate]);
  

  return (
    <AuthProvider>
      <div className="App">
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route path='/' element={<LoginPage />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/editProfile' element={<EditProfile />} />
          <Route path='/chat' element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;