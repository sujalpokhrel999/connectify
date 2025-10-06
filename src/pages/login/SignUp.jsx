import React, { useState } from 'react';
import { signup } from '../../config/firebase';
import './Login.css';
import emailImg from '../../assets/email.png';
import passwordImg from '../../assets/password.png';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import FormTabs from './FormTabs.jsx';
import {Eye, EyeOff} from 'lucide-react'
const Signup = () => {
  const navigate = useNavigate();

  // Signup state
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false
  });

  const [showPassword, setShowPassword]= useState(false);
  const [showConfirmPassword, setShowConfirmPassword]= useState(false);

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if(!signupData.firstName || !signupData.lastName || !signupData.email || !signupData.password) {
      toast.error("Please fill all required fields");
      return;
    }

    if(!signupData.terms){
      toast.error("You must agree to the Terms and Conditions");
      return;
    }

    if(signupData.password !== signupData.confirmPassword){
      toast.error("Passwords do not match");
      return;
    }
    

    try {
      await signup(
        signupData.firstName,
        signupData.lastName,
        signupData.email,
        signupData.password,
        signupData.confirmPassword,
        signupData.terms
      );
      localStorage.setItem('justSignedUp', true);
      toast.success("User successfully registered");
      navigate('/');  // navigate to login page after signup
    } catch(error) {
      console.error(error);
      toast.error(error.code.split('/')[1].split('-').join(' '));
    }
  }

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
            <form onSubmit={handleSignUpSubmit} className="signup-form" >
              <div className="input-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={signupData.firstName}
        
                    onChange={(e) =>
                      setSignupData({ ...signupData, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={signupData.lastName}
                    onChange={(e) =>
                      setSignupData({ ...signupData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="input-group">
                <img src={emailImg} className="email" alt="email" />
                <input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
             
                  onChange={(e) =>
                    setSignupData({ ...signupData, email: e.target.value })
                  }
                />
              </div>

              <div className="input-group relative">
                <img src={passwordImg} className="email" alt="password" />
                <input
                 type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signupData.password}
       
                  onChange={(e) =>
                    setSignupData({ ...signupData, password: e.target.value })
                  }
                  className="pr-10"
                />
                  {signupData.password && (
      <span
        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer eye"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </span>
      )}
              </div>

              <div className="input-group">
                <img src={passwordImg} className="email" alt="password" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={signupData.confirmPassword}
     
                  onChange={(e) =>
                    setSignupData({ ...signupData, confirmPassword: e.target.value })
                  }
                  className="pr-10"
                />
                        {signupData.confirmPassword && (
      <span
        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer eye"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      >
        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </span>
      )}


              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={signupData.terms}
       
                    onChange={(e) =>
                      setSignupData({ ...signupData, terms: e.target.checked })
                    }
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    I agree to the <Link to="#" className="terms-link">Terms and Conditions</Link>
                  </span>
                </label>
              </div>

              <div className="form-footer">
                <button type="submit" className="signup-btn">Create Account</button>
              </div>

              <p className="switch">
                Already have an account? <Link to="/login">Login</Link>
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

export default Signup;
