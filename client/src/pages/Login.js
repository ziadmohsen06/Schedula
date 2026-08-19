import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Alert,
  Paper, InputAdornment, IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await loginUser({ email, password });
      console.log('Login response:', data);
      
      if (!data.token) {
        setError('No token received from server');
        setLoading(false);
        return;
      }
      
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
            <Typography sx={{ fontSize: 60, mb: 1 }}>🌿</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2E4634' }}>
              Schedula
            </Typography>
            <Typography variant="body2" sx={{ color: '#6C7A6D', mt: 1 }}>
              Grow your productivity garden
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#69C37D' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#69C37D' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
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
              {loading ? '🌱 Growing...' : '🌱 Login'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#6C7A6D' }}>
              <Link to="/forgot-password" style={{ color: '#3F8F5A', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ color: '#6C7A6D', mt: 1 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#3F8F5A', textDecoration: 'none', fontWeight: 'bold' }}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;