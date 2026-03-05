import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import HomePage from './pages/HomePage';
import ImageUploadPage from './pages/ImageUploadPage';

function App() {
  const [userInfo, setUserInfo] = useState(null);

  // themeMode: 'system' | 'light' | 'dark'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system';
  });

  // Track the actual system preference
  const [systemIsDark, setSystemIsDark] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Resolve the actual darkMode boolean from themeMode
  const darkMode = themeMode === 'system' ? systemIsDark : themeMode === 'dark';

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  // Apply dark mode class to HTML element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Listen for system theme changes in real-time
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Save themeMode changes to localStorage
  const handleSetThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
  };

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
      element: <HomePage token={token} onLogin={handleLogin} userInfo={userInfo} onLogout={handleLogout} darkMode={darkMode} themeMode={themeMode} setThemeMode={handleSetThemeMode} />,
    },
    {
      path: '/gallery',
      element: token
        ? <ImageUploadPage token={token} userInfo={userInfo} onLogout={handleLogout} darkMode={darkMode} themeMode={themeMode} setThemeMode={handleSetThemeMode} />
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
