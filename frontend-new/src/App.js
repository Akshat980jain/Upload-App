import React, { useState, useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import ImageUploadPage from './pages/ImageUploadPage';
import VideoUploadPage from './pages/VideoUploadPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import Header from './components/Header';
import ProfileModal from './components/ProfileModal';
import Chatbot from './components/Chatbot';

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const handleLogout = () => {
    // Save the profilePicture in a cache before logout
    if (userInfo && userInfo.email && userInfo.profilePicture) {
      const cache = JSON.parse(localStorage.getItem('profilePictureCache') || '{}');
      cache[userInfo.email] = userInfo.profilePicture;
      localStorage.setItem('profilePictureCache', JSON.stringify(cache));
    }
    localStorage.removeItem('userInfo');
    setUserInfo(null);
  };

  const handleLogin = (newUserInfo) => {
    // On login, if backend returns blank profilePicture, use cached one if available
    let user = { ...newUserInfo };
    if (!user.profilePicture && user.email) {
      const cache = JSON.parse(localStorage.getItem('profilePictureCache') || '{}');
      if (cache[user.email]) {
        user.profilePicture = cache[user.email];
      }
    }
    localStorage.setItem('userInfo', JSON.stringify(user));
    setUserInfo(user);
  };

  const handleUserInfoUpdate = (updatedUserInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    setUserInfo(updatedUserInfo);
  };

  const openProfileModal = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  const token = userInfo ? userInfo.token : null;

  // Route elements with props
  const getElement = (Component, props = {}) => <Component {...props} />;

  const router = createBrowserRouter([
    {
      path: '/',
      element: getElement(HomePage, { token, onLogin: handleLogin }),
    },
    {
      path: '/upload',
      element: token ? getElement(ImageUploadPage, { token }) : <Navigate to="/" replace />,
    },
    {
      path: '/videos',
      element: token ? getElement(VideoUploadPage, { token }) : <Navigate to="/" replace />,
    },
    {
      path: '/documents',
      element: token ? getElement(DocumentUploadPage, { token }) : <Navigate to="/" replace />,
    },
    // Document type routes
    ...['pdf','ppt','excel','pptx','xls','xlsx','doc','docx','txt','zip','csv'].map(type => ({
      path: `/documents/${type}`,
      element: token ? getElement(DocumentUploadPage, { token }) : <Navigate to="/" replace />,
    })),
  ], {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }
  });

  return (
    <div className="App">
      {userInfo && <Header userInfo={userInfo} onLogout={handleLogout} onProfileClick={openProfileModal} />}
      <RouterProvider router={router} />
      {showProfileModal && <ProfileModal token={token} closeModal={closeProfileModal} onUserInfoUpdate={handleUserInfoUpdate} userInfo={userInfo} onProfileClick={openProfileModal} onLogout={handleLogout} />}
      {userInfo && <Chatbot token={token} userInfo={userInfo} />}
    </div>
  );
}

export default App;
