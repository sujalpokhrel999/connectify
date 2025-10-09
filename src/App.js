import './App.css';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/login/Login.jsx';
import SignUp from './pages/login/SignUp.jsx';
import Chat from './pages/Chat/Chat.jsx';
import Profile from './pages/profile/Profile.jsx';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './context/ProtectedRoute.jsx';
import EditProfile from './pages/profile/EditProfile.jsx';


function App() {


  return (
    
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

  );
}

export default App;