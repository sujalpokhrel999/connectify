import { useState } from "react";
import { auth } from "../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendLink = async () => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      setEmail("");
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      toast.error(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center">Forgot Password</h2>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSendLink}
            disabled={loading}
            className="
              w-full
              px-8
              py-3
              text-white
              font-semibold
              rounded-[12px]
              cursor-pointer
              shadow-[0_4px_15px_rgba(79,172,254,0.3)]
              transition-all
              duration-300
              bg-gradient-to-tr from-[#4facfe] to-[#00f2fe]
              hover:opacity-90
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? "Sending..." : "Send Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
