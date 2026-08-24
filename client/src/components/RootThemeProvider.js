import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { THEME_REGISTRY } from '../theme';

// Applies the user's stored theme/dark-mode choice at the very top of the app —
// not just inside AppShell — so pre-login pages (Login, Register, password
// reset) match the same theme as the authenticated app instead of always
// showing the garden look. Theme/dark-mode preference is stored in
// localStorage and is NOT cleared on logout, so it's already available here.
const RootThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'garden');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const syncTheme = () => setThemeName(localStorage.getItem('themeName') || 'garden');
    const syncDark = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('themeChanged', syncTheme);
    window.addEventListener('darkModeChanged', syncDark);
    return () => {
      window.removeEventListener('themeChanged', syncTheme);
      window.removeEventListener('darkModeChanged', syncDark);
    };
  }, []);

  const activeTheme = (THEME_REGISTRY[themeName] || THEME_REGISTRY.garden)[darkMode ? 'dark' : 'light'];

  // Mirror the active palette onto CSS custom properties so plain-CSS rules
  // (e.g. the scrollbar in index.css, which can't reach the MUI theme) stay
  // in sync with the selected theme instead of being stuck on garden colors.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--app-bg', activeTheme.palette.background.default);
    root.setProperty('--app-text', activeTheme.palette.text.primary);
    root.setProperty('--app-scrollbar-thumb', activeTheme.palette.primary.main);
    root.setProperty('--app-scrollbar-thumb-hover', activeTheme.palette.primary.dark);
  }, [activeTheme]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default RootThemeProvider;
