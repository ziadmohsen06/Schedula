import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const DECORATION_SPOTS = [
  { top: '5%', left: '5%', fontSize: 60, opacity: 0.15, rotate: -30 },
  { top: '15%', right: '8%', fontSize: 80, opacity: 0.1, rotate: 45 },
  { bottom: '10%', left: '10%', fontSize: 70, opacity: 0.12, rotate: 20 },
  { bottom: '20%', right: '5%', fontSize: 50, opacity: 0.15, rotate: -45 }
];

// Shared visual shell for Login/Register/ForgotPassword/ChangePassword — themed
// gradient + decorative emoji + branding, pulling from the same theme registry
// the rest of the app uses (via RootThemeProvider), instead of each page
// hardcoding garden-green regardless of the user's stored theme preference.
const AuthPageShell = ({ title, subtitle, children }) => {
  const theme = useTheme();
  const themeName = useThemeName();
  const content = getThemeContent(themeName);

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.text.primary} 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {content.ambientEmojis.length > 0 && DECORATION_SPOTS.map((d, i) => (
        <Typography
          key={i}
          sx={{ position: 'absolute', top: d.top, left: d.left, right: d.right, bottom: d.bottom, fontSize: d.fontSize, opacity: d.opacity, transform: `rotate(${d.rotate}deg)` }}
        >
          {content.ambientEmojis[i % content.ambientEmojis.length]}
        </Typography>
      ))}

      <Container maxWidth="xs">
        <Paper sx={{
          p: 4,
          borderRadius: 4,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography sx={{ fontSize: 60, mb: 1 }}>{content.logoEmoji}</Typography>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {title || 'Schedula'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle || content.tagline}
            </Typography>
          </Box>
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthPageShell;
