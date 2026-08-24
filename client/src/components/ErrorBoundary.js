import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Schedula crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          bgcolor: 'background.default',
          px: 3
        }}>
          <Typography sx={{ fontSize: 80, mb: 1 }}>🥀</Typography>
          <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
            Something went wrong.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            An unexpected error occurred. Let's get you back on track.
          </Typography>
          <Button variant="contained" onClick={this.handleReload}>
            Back to Dashboard
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
