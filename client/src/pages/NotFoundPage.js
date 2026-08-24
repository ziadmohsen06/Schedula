import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const themeName = useThemeName();
  const content = getThemeContent(themeName);

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
      <Typography sx={{ fontSize: 90, mb: 1 }}>{content.emptyStateEmoji}</Typography>
      <Typography variant="h3" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        This page wandered off somewhere it shouldn't have.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        {content.logoEmoji} Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFoundPage;
