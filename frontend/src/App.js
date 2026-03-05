import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import HomePage from './pages/HomePage';
import ImageUploadPage from './pages/ImageUploadPage';

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  // Dark mode sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
  };

  const handleLogin = (newUserInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    setUserInfo(newUserInfo);
  };

  const token = userInfo ? userInfo.token : null;

  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomePage token={token} onLogin={handleLogin} userInfo={userInfo} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />,
    },
    {
      path: '/gallery',
      element: token
        ? <ImageUploadPage token={token} userInfo={userInfo} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
        : <Navigate to="/" replace />,
    },
  ], {
    future: { v7_startTransition: true }
  });

  return (
    <div className="App">
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: 90 }}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontFamily: 'var(--font)',
            background: 'var(--surface)',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </div>
  );
}

export default App;
