import React, { useState } from 'react';
import { signup } from '../../config/firebase';
import './Login.css';
import emailImg from '../../assets/email.png';
import passwordImg from '../../assets/password.png';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormTabs from './FormTabs.jsx';
import { Eye, EyeOff, X } from 'lucide-react';
import emailjs from '@emailjs/browser';

const Signup = () => {
  const navigate = useNavigate();

  const SERVICE_ID = "service_f8tfyyg";
  const TEMPLATE_ID = "template_1470u7r";
  const PUBLIC_KEY = "0NkpXaUqg5csR9dmr";

  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpPopupVisible, setIsOtpPopupVisible] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // --- NEW VALIDATION HELPER ---
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  // --- ADDED: password strength checker ---
  const getPasswordStrength = (password) => {
    if (!password) return null;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial, password.length >= 8].filter(Boolean).length;
    if (score <= 2) return { label: "Weak", color: "#e74c3c" };
    if (score <= 3) return { label: "Fair", color: "#f39c12" };
    if (score === 4) return { label: "Good", color: "#2ecc71" };
    return { label: "Strong", color: "#27ae60" };
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Empty Fields Validation
    if (!signupData.firstName.trim() || !signupData.lastName.trim() || !signupData.email.trim() || !signupData.password) {
      return toast.error("Please fill all required fields");
    }

    // 2. Name Length Validation
    if (signupData.firstName.length < 2) {
      return toast.error("First name must be at least 2 characters");
    }

    // --- ADDED: Last name length validation (mirrors existing first name check) ---
    if (signupData.lastName.length < 2) {
      return toast.error("Last name must be at least 2 characters");
    }

    // --- ADDED: Name format validation (no numbers or special characters) ---
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(signupData.firstName)) {
      return toast.error("First name must contain only letters");
    }
    if (!nameRegex.test(signupData.lastName)) {
      return toast.error("Last name must contain only letters");
    }

    // 3. Email Format Validation
    if (!validateEmail(signupData.email)) {
      return toast.error("Please enter a valid email address");
    }

    // 4. Password Strength Validation
    if (signupData.password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    // --- ADDED: Password cannot contain spaces ---
    if (/\s/.test(signupData.password)) {
      return toast.error("Password must not contain spaces");
    }

    // --- ADDED: Password cannot be the same as the email ---
    if (signupData.password.toLowerCase() === signupData.email.toLowerCase()) {
      return toast.error("Password cannot be the same as your email");
    }

    // 5. Password Matching
    if (signupData.password !== signupData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    // 6. Terms Validation
    if (!signupData.terms) {
      return toast.error("Please agree to the Terms and Conditions");
    }

    setLoading(true);

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    const templateParams = {
      to_name: signupData.firstName,
      to_email: signupData.email,
      otp_code: newOtp,
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then(() => {
        setLoading(false);
        setIsOtpPopupVisible(true);
        toast.success("Verification code sent to your email!");
      })
      .catch((error) => {
        setLoading(false);
        console.error("EmailJS Error:", error);
        toast.error("Failed to send email. Check your console.");
      });
  };

  const handleVerifyAndSignup = async () => {
    // OTP Input Validation
    if (!otpInput || otpInput.length !== 6) {
      return toast.error("Please enter a 6-digit code");
    }
    
    if (otpInput !== generatedOtp) {
      return toast.error("Invalid verification code");
    }

    setLoading(true);
    try {
      await signup(
        signupData.firstName,
        signupData.lastName,
        signupData.email,
        signupData.password
      );
      
      localStorage.setItem('justSignedUp', true);
      toast.success("Account successfully registered!");

      setTimeout(() => {
        navigate('/chat');
      }, 500);

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
      setIsOtpPopupVisible(false);
    }
  };

  // --- ADDED: derived password strength for display ---
  const passwordStrength = getPasswordStrength(signupData.password);

  return (
    <div className="login">
      <div className="upperCircle"><div className="circle3"><div className="circle2"><div className="circle1"></div></div></div></div>

      <div className="container">
        <div className="card">
          <div className="card-left">
            <FormTabs />
            <form onSubmit={handleSignUpSubmit} className="signup-form">
              <div className="input-row">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    value={signupData.firstName}
                    onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                    maxLength={50}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    value={signupData.lastName}
                    onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="input-group">
                <img src={emailImg} className="email" alt="email" />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  maxLength={254}
                />
              </div>

              <div className="input-group relative">
                <img src={passwordImg} className="email" alt="password" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  minLength="6"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="pr-10"
                  maxLength={128}
                />
                {signupData.password && (
                  <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                )}
              </div>

              {/* ADDED: Password strength indicator */}
              {passwordStrength && (
                <div style={{ marginTop: "-8px", marginBottom: "8px", fontSize: "12px", color: passwordStrength.color, fontWeight: 500 }}>
                  Password strength: {passwordStrength.label}
                  <div style={{ height: "4px", borderRadius: "2px", background: "#eee", marginTop: "4px" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: "2px",
                      background: passwordStrength.color,
                      width: passwordStrength.label === "Weak" ? "25%" : passwordStrength.label === "Fair" ? "50%" : passwordStrength.label === "Good" ? "75%" : "100%",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
              )}

              <div className="input-group relative">
                <img src={passwordImg} className="email" alt="password" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="pr-10"
                  maxLength={128}
                />
                {signupData.confirmPassword && (
                  <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                )}
              </div>

              {/* ADDED: Inline confirm password mismatch hint */}
              {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                <p style={{ fontSize: "12px", color: "#e74c3c", marginTop: "-8px", marginBottom: "8px" }}>
                  Passwords do not match
                </p>
              )}

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    checked={signupData.terms}
                    onChange={(e) => setSignupData({ ...signupData, terms: e.target.checked })}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    I agree to the <Link to="#" className="terms-link">Terms and Conditions</Link>
                  </span>
                </label>
              </div>

              <div className="form-footer">
                <button type="submit" className="signup-btn" disabled={loading}>
                  {loading ? "Sending Code..." : "Create Account"}
                </button>
              </div>

              <p className="switch">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          </div>

          <div className="card-right">
            <div className="rightcircle1"><div className="rightcircle2"><div className="rightcircle3"></div></div></div>
          </div>
        </div>
      </div>

      {isOtpPopupVisible && (
        <div className="otp-overlay">
          <div className="otp-card">
            <button className="close-otp" onClick={() => setIsOtpPopupVisible(false)}>
              <X size={24} />
            </button>
            <h2>Verify Email</h2>
            <p>Enter the 6-digit code sent to <br /> <strong>{signupData.email}</strong></p>
            
            <input 
              type="text" 
              placeholder="000000" 
              maxLength="6"
              pattern="\d*"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))} // Only allows numbers
              className="otp-field"
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                setOtpInput(pasted);
              }}
            />
            
            <button className="verify-btn" onClick={handleVerifyAndSignup} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Sign Up"}
            </button>
            
            <p className="resend-text">
              Didn't get the code? <span onClick={handleSignUpSubmit}>Resend OTP</span>
            </p>
          </div>
        </div>
      )}

      <div className="lowerCircle"><div className="lowercircle3"><div className="lowercircle2"><div className="lowercircle1"></div></div></div></div>
    </div>
  );
};

export default Signup;