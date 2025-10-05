import './App.css';
import React, { useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/login/Login.jsx';
import SignUp from './pages/login/SignUp.jsx';
import Chat from './pages/Chat/Chat.jsx';
import Profile from './pages/profile/Profile.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthProvider } from './config/authContext';
import { auth } from './config/firebase';
import { AppContext } from './context/AppContext.jsx';
import ProtectedRoute from './context/ProtectedRoute.jsx';
import EditProfile from './pages/profile/EditProfile.jsx';

function App() {
  const navigate = useNavigate();
  const { loadUserData} = useContext(AppContext);


  useEffect(() => {
    const checkUser = async (user) => {
      if (user) {
        await loadUserData(user.uid);
        if (['/login', '/signup'].includes(window.location.pathname)) {
          navigate('/chat');
        }
      }
    };
    const unsubscribe = onAuthStateChanged(auth, checkUser);
    return () => unsubscribe();
  }, [loadUserData, navigate]); // ✅ Dependencies added

  return (
    <AuthProvider>
      <div className="App">
        <ToastContainer autoClose={1000}/>
        <Routes>
          <Route path='/login' element={<LoginPage />} />
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
