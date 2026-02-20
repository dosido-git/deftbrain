import React, { useState, useEffect, useContext, createContext } from 'react';

/**
 * Theme Context — single source of truth for theme across all components
 */
const ThemeContext = createContext(null);

/**
 * ThemeProvider — wrap your app with this to share theme state
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light
    return 'light';
  });

  // Persist theme changes to localStorage
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle between themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    setLightTheme: () => setTheme('light'),
    setDarkTheme: () => setTheme('dark'),
    isLight: theme === 'light',
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme hook — reads from shared context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider. Wrap your App with <ThemeProvider>.');
  }
  
  return context;
};
