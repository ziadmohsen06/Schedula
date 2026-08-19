import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Alert,
  Paper, InputAdornment
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { forgotPasswordUser } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await forgotPasswordUser({ email });
      setSuccess(data.message || 'If an account exists, an email has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #69C37D 0%, #3F8F5A 50%, #2E4634 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative leaves */}
      <Typography sx={{ position: 'absolute', top: '5%', left: '5%', fontSize: 60, opacity: 0.15, transform: 'rotate(-30deg)' }}>🍃</Typography>
      <Typography sx={{ position: 'absolute', bottom: '10%', right: '8%', fontSize: 80, opacity: 0.1, transform: 'rotate(45deg)' }}>🌿</Typography>
      <Typography sx={{ position: 'absolute', top: '20%', right: '5%', fontSize: 50, opacity: 0.12, transform: 'rotate(-20deg)' }}>🍀</Typography>
      
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
            <Typography sx={{ fontSize: 60, mb: 1 }}>📧</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2E4634' }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" sx={{ color: '#6C7A6D', mt: 1 }}>
              We'll send you a reset code to your email
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
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#69C37D' }} />
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
              {loading ? '🌱 Sending...' : '🌱 Send Reset Code'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#6C7A6D' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#3F8F5A', textDecoration: 'none', fontWeight: 'bold' }}>
                Back to Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;