import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, Tooltip, Avatar, Stack, Divider, Link } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SettingsIcon from '@mui/icons-material/Settings';
import TimerIcon from '@mui/icons-material/Timer';
import HistoryIcon from '@mui/icons-material/History';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../context/AuthContext';
import SidebarNavPanel from './SidebarNavPanel';
import DailyStartPrompt from './DailyStartPrompt';
import MoodCheckIn from './MoodCheckIn';
import ChatWidget from './ChatWidget';
import AmbientLeaves from './AmbientLeaves';
import { THEME_REGISTRY } from '../theme';
import { getThemeContent } from '../themeContent';

const AppShell = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'garden');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const syncDarkMode = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    syncDarkMode();
    window.addEventListener('darkModeChanged', syncDarkMode);
    return () => window.removeEventListener('darkModeChanged', syncDarkMode);
  }, []);

  useEffect(() => {
    const syncTheme = () => setThemeName(localStorage.getItem('themeName') || 'garden');
    window.addEventListener('themeChanged', syncTheme);
    return () => window.removeEventListener('themeChanged', syncTheme);
  }, []);

  const activeTheme = (THEME_REGISTRY[themeName] || THEME_REGISTRY.garden)[darkMode ? 'dark' : 'light'];
  const content = getThemeContent(themeName);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.style.backgroundColor = activeTheme.palette.background.default;
    document.body.style.color = activeTheme.palette.text.primary;
  }, [darkMode, activeTheme]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openDrawer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerOpen(true);
  };

  // Closes right away — used for explicit actions (picking a nav item, Escape key).
  const closeDrawerImmediately = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerOpen(false);
  };

  // Closes after a short delay so briefly crossing a gap while moving the mouse
  // toward the bottom of the panel (e.g. the tip card) doesn't slam it shut.
  // openDrawer() cancels this if the mouse re-enters in time.
  const closeDrawer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setDrawerOpen(false);
      closeTimerRef.current = null;
    }, 300);
  };

  const handleSelectPanel = (panel) => {
    closeDrawerImmediately();
    if (panel === 'history') navigate('/history');
    else if (panel === 'streak') navigate('/streak');
    else if (panel === 'current') navigate('/current-tasks');
    else if (panel === 'home') navigate('/dashboard');
    else if (panel === 'calendar') navigate('/calendar');
    else if (panel === 'gpa') navigate('/gpa');
    else if (panel === 'assignments') navigate('/assignments');
    else if (panel === 'class-schedule') navigate('/class-schedule');
    else if (panel === 'goals') navigate('/goals');
    else if (panel === 'habits') navigate('/habits');
    else if (panel === 'weekly-review') navigate('/weekly-review');
    else if (panel === 'social') navigate('/social');
  };

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: 'text.primary'
      }}>
        <AmbientLeaves />

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
                {content.logoEmoji} Schedula
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Home" arrow>
                <IconButton color="inherit" onClick={() => navigate('/dashboard')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <HomeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Calendar" arrow>
                <IconButton color="inherit" onClick={() => navigate('/calendar')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <CalendarMonthIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Streak" arrow>
                <IconButton color="inherit" onClick={() => navigate('/streak')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <LocalFireDepartmentIcon sx={{ color: '#ff6f00' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="History" arrow>
                <IconButton color="inherit" onClick={() => navigate('/history')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Focus Timer" arrow>
                <IconButton color="inherit" onClick={() => navigate('/timer')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <TimerIcon />
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
          onClose={closeDrawerImmediately}
          hideBackdrop={true}
          disableScrollLock={true}
          transitionDuration={{ enter: 300, exit: 200 }}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: '0 20px 20px 0',
              boxShadow: 4,
              border: '1px solid',
              borderColor: 'divider',
              borderLeft: 'none',
              width: 320,
              pointerEvents: 'auto',
              overflow: 'hidden',
            }
          }}
        >
          <Box
            onMouseEnter={openDrawer}
            onMouseLeave={closeDrawer}
            sx={{ height: '100%' }}
          >
            <SidebarNavPanel
              onClose={closeDrawer}
              onSelect={handleSelectPanel}
              darkMode={darkMode}
              content={content}
            />
          </Box>
        </Drawer>

        <Box component="footer" sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.secondary'
        }}>
          <Box sx={{ maxWidth: 1080, mx: 'auto', px: 3, py: 4 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '1.4fr repeat(4, 1fr)' },
                gap: 4
              }}
            >
              <Box sx={{ maxWidth: 260 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>{content.logoEmoji} Schedula</Typography>
                <Typography variant="body2" color="text.secondary">
                  {content.description}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Navigate</Typography>
                <Stack spacing={0.5}>
                  {[
                    { label: 'Dashboard', path: '/dashboard' },
                    { label: 'Calendar', path: '/calendar' },
                    { label: 'Current Tasks', path: '/current-tasks' },
                    { label: 'History', path: '/history' },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      component="button"
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      onClick={() => navigate(item.path)}
                      sx={{ textAlign: 'left' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Academics</Typography>
                <Stack spacing={0.5}>
                  {[
                    { label: 'GPA Tracker', path: '/gpa' },
                    { label: 'Assignments', path: '/assignments' },
                    { label: 'Class Schedule', path: '/class-schedule' },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      component="button"
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      onClick={() => navigate(item.path)}
                      sx={{ textAlign: 'left' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Productivity</Typography>
                <Stack spacing={0.5}>
                  {[
                    { label: 'Focus Timer', path: '/timer' },
                    { label: 'Goals', path: '/goals' },
                    { label: 'Habits', path: '/habits' },
                    { label: 'Weekly Review', path: '/weekly-review' },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      component="button"
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      onClick={() => navigate(item.path)}
                      sx={{ textAlign: 'left' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Account</Typography>
                <Stack spacing={0.5}>
                  {[
                    { label: 'Streak & Progress', path: '/streak' },
                    { label: 'Profile', path: '/profile' },
                    { label: 'Security', path: '/security' },
                    { label: 'Settings', path: '/settings' },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      component="button"
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      onClick={() => navigate(item.path)}
                      sx={{ textAlign: 'left' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'divider' }} />

            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1
            }}>
              <Typography variant="caption" color="text.secondary">
                © 2026 Schedula. {content.footerTagline}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Developed by <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>Ziad Mohamed Mohsen</Box>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Daily Start Prompt */}
        <DailyStartPrompt />

        {/* Mood Check-in */}
        <MoodCheckIn />

        {/* Chat Widget */}
        <ChatWidget />
      </Box>
    </ThemeProvider>
  );
};

export default AppShell;