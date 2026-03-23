import React, { useState, useEffect } from 'react';
import Home from './pages/Home.jsx';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Home darkMode={darkMode} setDarkMode={setDarkMode} />
    </div>
  );
}
