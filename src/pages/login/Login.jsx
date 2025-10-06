import React, { useState } from 'react';
import { login } from '../../config/firebase';
import './Login.css';
import emailImg from '../../assets/email.png';
import passwordImg from '../../assets/password.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import FormTabs from './FormTabs.jsx'
import {Eye, EyeOff} from 'lucide-react';
import ForgotPasswordModal from '../../components/ForgotPasswordModal.jsx'
const LoginPage = () => {
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await login(loginEmail, loginPassword);
      navigate('/chat'); // Navigate after successful login
    } catch (error) {
      console.error(error);
      toast.error('Invalid email or password!');
    }
  };



  return (
    <div className="login">
      <div className="upperCircle">
        <div className="circle3">
          <div className="circle2">
            <div className="circle1"></div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card">
          {/* Left Side */}
          <div className="card-left">
         <FormTabs />
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <img src={emailImg} className="email" alt="email" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}

                />
               
              </div>

              <div className="input-group relative">
      <img src={passwordImg} className="email" alt="password" />
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'&quot;\\|,.<>\/?]).{8,}$"
        title="Password must be at least 8 chars, include upper and lower case letters, a number and a special character."
        className="pr-10" // padding for the eye icon
      />
      {/* Eye icon */}
      {loginPassword && (
      <span
        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer eye"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </span>
      )}

     
    </div>
              <div className="form-footer">
                <span  onClick={() => setIsModalOpen(true)} className="forgot-password">Forgot your password?</span>
            
      {/* Render modal and pass props */}
      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
               <button type="submit" className="login-btn">Login</button>
              </div>

              <p className="switch">
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </p>
            </form>
          </div>

          {/* Right Side Illustration */}
          <div className="card-right">
            <div className="rightcircle1">
              <div className="rightcircle2">
                <div className="rightcircle3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lowerCircle">
        <div className="lowercircle3">
          <div className="lowercircle2">
            <div className="lowercircle1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
