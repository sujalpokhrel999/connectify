import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from './AppContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AppContext);

  // Show spinner while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-12 w-12 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    );
  }

  // Redirect if not logged in
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};