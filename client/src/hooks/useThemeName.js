import { useState, useEffect } from 'react';

// Reads the selected theme key ('garden' | 'ocean' | 'space' | 'minimal') from
// localStorage and stays in sync with SettingsPage's theme picker via the same
// 'themeChanged' event pattern used for darkMode/lazyMode.
export const useThemeName = () => {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'garden');

  useEffect(() => {
    const sync = () => setThemeName(localStorage.getItem('themeName') || 'garden');
    window.addEventListener('themeChanged', sync);
    return () => window.removeEventListener('themeChanged', sync);
  }, []);

  return themeName;
};
