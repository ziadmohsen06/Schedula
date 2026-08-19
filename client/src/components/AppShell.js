import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, Tooltip, Avatar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SettingsIcon from '@mui/icons-material/Settings';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { useAuth } from '../context/AuthContext';
import SidebarNavPanel from './SidebarNavPanel';
import DailyStartPrompt from './DailyStartPrompt';
import ChatWidget from './ChatWidget';
import gardenTheme, { darkGardenTheme } from '../theme';

const AppShell = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [lazyMode, setLazyMode] = useState(() => localStorage.getItem('lazyMode') === 'true');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const syncDarkMode = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    syncDarkMode();
    window.addEventListener('darkModeChanged', syncDarkMode);
    return () => window.removeEventListener('darkModeChanged', syncDarkMode);
  }, []);

  useEffect(() => {
    const syncLazy = () => setLazyMode(localStorage.getItem('lazyMode') === 'true');
    window.addEventListener('lazyModeChanged', syncLazy);
    return () => window.removeEventListener('lazyModeChanged', syncLazy);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.style.backgroundColor = darkMode ? '#0f1f12' : '#F4FAF3';
    document.body.style.color = darkMode ? '#d4edda' : '#2E4634';
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const toggleLazyMode = () => {
    const next = !lazyMode;
    setLazyMode(next);
    localStorage.setItem('lazyMode', next);
    window.dispatchEvent(new Event('lazyModeChanged'));
  };

  const openDrawer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerOpen(false);
  };

  const handleSelectPanel = (panel) => {
    closeDrawer();
    if (panel === 'history') navigate('/history');
    else if (panel === 'streak') navigate('/streak');
    else if (panel === 'current') navigate('/current-tasks');
    else if (panel === 'home') navigate('/dashboard');
    else if (panel === 'calendar') navigate('/calendar');
  };

  const activeTheme = darkMode ? darkGardenTheme : gardenTheme;

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}>
        <AppBar position="sticky" sx={{ top: 0, zIndex: 1100 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box
              onMouseEnter={openDrawer}
              sx={{ 
                cursor: 'pointer', 
                py: 1,
                px: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  userSelect: 'none',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  transition: 'opacity 0.2s ease',
                  '&:hover': { opacity: 0.85 }
                }}
                onClick={() => navigate('/dashboard')}
              >
                🌿 Schedula
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title={lazyMode ? 'Lazy Mode ON — click to disable' : 'Enable Lazy Mode'} arrow>
                <IconButton
                  color="inherit"
                  onClick={toggleLazyMode}
                  sx={{
                    bgcolor: lazyMode ? 'rgba(255,255,255,0.15)' : 'transparent',
                    borderRadius: 2,
                    transition: 'all 0.3s'
                  }}
                >
                  {lazyMode ? <WbSunnyIcon sx={{ color: '#F6C453' }} /> : <BedtimeIcon />}
                </IconButton>
              </Tooltip>
              <Button color="inherit" onClick={() => navigate('/add-task')} sx={{ fontWeight: 600 }}>
                + Add Task
              </Button>
              <Tooltip title="Profile" arrow>
                <IconButton onClick={() => navigate('/profile')} sx={{ p: 0.5 }}>
                  <Avatar
                    src={user?.photoUrl || undefined}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 'bold',
                      border: '2px solid rgba(255,255,255,0.4)',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  >
                    {!user?.photoUrl && (user?.name?.charAt(0)?.toUpperCase() || '?')}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <IconButton
                color="inherit"
                onClick={() => navigate('/settings')}
                aria-label="settings"
                sx={{ transition: 'transform 0.2s ease', '&:hover': { transform: 'rotate(30deg)' } }}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box 
          sx={{ flex: 1 }}
          onMouseEnter={closeDrawer}
        >
          {children}
        </Box>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={closeDrawer}
          hideBackdrop={true}
          disableScrollLock={true}
          transitionDuration={{ enter: 300, exit: 200 }}
          PaperProps={{
            sx: {
              bgcolor: darkMode ? '#162418' : '#FCFFFC',
              color: darkMode ? '#d4edda' : '#2E4634',
              borderRadius: '0 20px 20px 0',
              boxShadow: '4px 0 24px rgba(63, 143, 90, 0.15)',
              border: `1px solid rgba(105, 195, 125, 0.2)`,
              borderLeft: 'none',
              width: 320,
              pointerEvents: 'auto',
            }
          }}
        >
          <Box
            onMouseLeave={closeDrawer}
            sx={{ height: '100%' }}
          >
            <SidebarNavPanel
              onClose={closeDrawer}
              onSelect={handleSelectPanel}
              darkMode={darkMode}
            />
          </Box>
        </Drawer>

        <Box component="footer" sx={{
          py: 2,
          textAlign: 'center',
          borderTop: `1px solid rgba(105, 195, 125, 0.2)`,
          bgcolor: darkMode ? '#162418' : '#FCFFFC',
          color: 'text.secondary'
        }}>
          <Typography variant="body2">🌱 © 2026 Schedula. Grow every day.</Typography>
        </Box>

        {/* Daily Start Prompt */}
        <DailyStartPrompt />
        
        {/* Chat Widget */}
        <ChatWidget />
      </Box>
    </ThemeProvider>
  );
};

export default AppShell;