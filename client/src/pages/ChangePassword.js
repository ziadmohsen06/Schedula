import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Alert,
  Paper, InputAdornment, IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import { changePasswordUser } from '../services/api';
import AppShell from '../components/AppShell';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await changePasswordUser({
        oldPassword,
        newPassword,
        confirmPassword
      });
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Box sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #69C37D 0%, #3F8F5A 50%, #2E4634 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}>
        {/* Decorative leaves */}
        <Typography sx={{ position: 'absolute', top: '5%', left: '5%', fontSize: 60, opacity: 0.15, transform: 'rotate(-30deg)' }}>🍃</Typography>
        <Typography sx={{ position: 'absolute', top: '15%', right: '8%', fontSize: 80, opacity: 0.1, transform: 'rotate(45deg)' }}>🌿</Typography>
        <Typography sx={{ position: 'absolute', bottom: '10%', left: '10%', fontSize: 70, opacity: 0.12, transform: 'rotate(20deg)' }}>🌱</Typography>
        <Typography sx={{ position: 'absolute', bottom: '20%', right: '5%', fontSize: 50, opacity: 0.15, transform: 'rotate(-45deg)' }}>🍀</Typography>
        
        <Container maxWidth="xs">
          <Paper sx={{
            p: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography sx={{ fontSize: 60, mb: 1 }}>🔐</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#2E4634' }}>
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#6C7A6D', mt: 1 }}>
                Keep your garden secure
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Current Password"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: '#69C37D' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOldPassword(!showOldPassword)}>
                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#69C37D' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#69C37D' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #69C37D 0%, #3F8F5A 100%)',
                  fontSize: 16,
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7DD38F 0%, #4FA56A 100%)',
                  },
                }}
              >
                {loading ? '🌱 Updating...' : '🌱 Update Password'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                onClick={() => navigate('/settings')}
                sx={{ color: '#3F8F5A', textTransform: 'none' }}
              >
                ← Back to Settings
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </AppShell>
  );
};

export default ChangePassword;