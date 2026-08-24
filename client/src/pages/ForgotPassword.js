import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, Link,
  InputAdornment
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { forgotPasswordUser } from '../services/api';
import AuthPageShell from '../components/AuthPageShell';

const ForgotPassword = () => {
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
    <AuthPageShell title="Forgot Password" subtitle="We'll send you a reset code to your email">
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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
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
          sx={{ py: 1.5, fontSize: 16, fontWeight: 'bold' }}
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </Button>
      </form>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Remember your password?{' '}
          <Link component={RouterLink} to="/login" underline="hover" fontWeight="bold">
            Back to Login
          </Link>
        </Typography>
      </Box>
    </AuthPageShell>
  );
};

export default ForgotPassword;
