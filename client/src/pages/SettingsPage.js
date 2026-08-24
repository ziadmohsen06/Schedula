import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Switch, TextField, Alert,
  FormControlLabel, Paper, Divider
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getAccountabilityPartner, updateAccountabilityPartner, getThemePreference, updateThemePreference } from '../services/api';
import AppShell from '../components/AppShell';
import { THEME_REGISTRY } from '../theme';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'garden');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerSaved, setPartnerSaved] = useState(false);

  const applyTheme = (name, dark) => {
    localStorage.setItem('themeName', name);
    localStorage.setItem('darkMode', dark);
    setThemeName(name);
    setDarkMode(dark);
    window.dispatchEvent(new Event('themeChanged'));
    window.dispatchEvent(new Event('darkModeChanged'));
  };

  const handleSelectTheme = (name) => {
    applyTheme(name, darkMode);
    updateThemePreference({ name }).catch(() => {});
  };

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    applyTheme(themeName, next);
    updateThemePreference({ darkMode: next }).catch(() => {});
  };

  // Reconcile with the account's saved preference once on mount — e.g. a fresh
  // login on a new browser should pick up the theme from the account, not fall
  // back to the local default.
  useEffect(() => {
    getThemePreference()
      .then(({ data }) => {
        const saved = data.themePreference;
        if (saved && (saved.name !== themeName || saved.darkMode !== darkMode)) {
          applyTheme(saved.name, saved.darkMode);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getAccountabilityPartner().then(({ data }) => setPartnerEmail(data.accountabilityPartnerEmail || '')).catch(() => {});
  }, []);

  const handleSavePartner = async () => {
    setPartnerSaved(false);
    try {
      await updateAccountabilityPartner(partnerEmail);
      setPartnerSaved(true);
    } catch (err) {
      // no-op; field stays editable
    }
  };

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
            <Switch checked={darkMode} onChange={handleToggleDarkMode} />
          </Box>

          <Divider />

          <Box sx={{ py: 2, px: 1 }}>
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>Theme</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(THEME_REGISTRY).map(([key, t]) => (
                <Box
                  key={key}
                  onClick={() => handleSelectTheme(key)}
                  sx={{
                    cursor: 'pointer', px: 1.5, py: 1, borderRadius: 2,
                    border: '2px solid', borderColor: themeName === key ? t.swatch : 'divider',
                    display: 'flex', alignItems: 'center', gap: 1,
                    '&:hover': { borderColor: t.swatch }
                  }}
                >
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: t.swatch }} />
                  <Typography variant="body2">{t.label}</Typography>
                </Box>
              ))}
            </Box>
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
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, px: 1 }}
            onClick={() => navigate('/security')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ShieldIcon color="action" />
              <Box>
                <Typography variant="body1" fontWeight="medium">Security</Typography>
                <Typography variant="body2" color="text.secondary">Security score, sessions, login history, and data</Typography>
              </Box>
            </Box>
            <Typography color="text.secondary">›</Typography>
          </Box>

          <Divider />

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, px: 1 }}
            onClick={() => navigate('/social')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GroupIcon color="action" />
              <Box>
                <Typography variant="body1" fontWeight="medium">Study Buddies</Typography>
                <Typography variant="body2" color="text.secondary">Friends, leaderboard, and shared progress</Typography>
              </Box>
            </Box>
            <Typography color="text.secondary">›</Typography>
          </Box>

          <Divider />

          <Box sx={{ py: 2, px: 1 }}>
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 0.5 }}>Accountability Partner</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Automatically email your weekly progress report to a friend or mentor
            </Typography>
            {partnerSaved && <Alert severity="success" sx={{ mb: 1.5 }}>Saved</Alert>}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small" fullWidth type="email" placeholder="partner@example.com"
                value={partnerEmail}
                onChange={(e) => { setPartnerEmail(e.target.value); setPartnerSaved(false); }}
              />
              <Button variant="outlined" onClick={handleSavePartner}>Save</Button>
            </Box>
          </Box>

          <Divider />

          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, cursor: 'pointer', '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) }, borderRadius: 1, px: 1 }}
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