import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Switch,
  FormControlLabel, Paper, Divider
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.body.style.backgroundColor = darkMode ? '#121212' : '#f7f7f7';
    document.body.style.color = darkMode ? '#fff' : '#000';
    window.dispatchEvent(new Event('darkModeChanged'));
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Settings</Typography>

        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 0 }}>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DarkModeIcon color="action" />
              <Box>
                <Typography variant="body1" fontWeight="medium">Dark Mode</Typography>
                <Typography variant="body2" color="text.secondary">Switch between light and dark theme</Typography>
              </Box>
            </Box>
            <Switch checked={darkMode} onChange={() => setDarkMode(prev => !prev)} />
          </Box>

          <Divider />

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, px: 1 }}
            onClick={() => navigate('/change-password')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LockIcon color="action" />
              <Box>
                <Typography variant="body1" fontWeight="medium">Change Password</Typography>
                <Typography variant="body2" color="text.secondary">Update your account password</Typography>
              </Box>
            </Box>
            <Typography color="text.secondary">›</Typography>
          </Box>

          <Divider />

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, cursor: 'pointer', '&:hover': { bgcolor: '#ffebee' }, borderRadius: 1, px: 1 }}
            onClick={handleLogout}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LogoutIcon color="error" />
              <Box>
                <Typography variant="body1" fontWeight="medium" color="error">Log Out</Typography>
                <Typography variant="body2" color="text.secondary">Sign out of your account</Typography>
              </Box>
            </Box>
            <Typography color="error">›</Typography>
          </Box>

        </Paper>
      </Container>
    </AppShell>
  );
};

export default SettingsPage;