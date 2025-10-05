import React, {useContext} from "react";
import { AppContext } from '../../context/AppContext';

import {useNavigate} from 'react-router-dom'

const Profile = () => {
  const { userData } = useContext(AppContext);
  const navigate= useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-blue-100 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left column - Profile Image */}
              <div className="flex flex-col items-center lg:w-1/3">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                  
                      <img
                        src={userData?.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) 
                  </div>
                
                </div>

                <div className="mt-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-800">{userData?.name || 'Your Name'}</h3>
                  <p className="text-gray-600 mt-1">{userData?.email}</p>
                </div>
              </div>

              {/* Right column - Profile Details */}
              <div className="lg:w-2/3">
                <div className="space-y-6">
                  {/* Profile Information Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                      
                   <button
                         onClick ={()=> navigate('/chat')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
           <svg
  className="w-4 h-4"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    d="M15 19l-7-7 7-7"
  />
</svg>

                          Back to chat
                        </button> 
                   <button
                         onClick ={()=> navigate('/EditProfile')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                          Edit Profile
                        </button> 
                   
                    </div>

                    <div className="space-y-4">
                      {/* Name Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                       
                          <p className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-800">
                            {userData?.name || 'Not provided'}
                          </p>
                        
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                   
                          <p className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-800">
                            {userData?.email || 'Not provided'}
                          </p>
                        
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">Security</h2>
            
                    </div>
       
                    <div className="flex items-center gap-3 text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="green" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Password is secure</span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;