import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SchoolIcon from '@mui/icons-material/School';
import ShieldIcon from '@mui/icons-material/Shield';
import PaletteIcon from '@mui/icons-material/Palette';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const FEATURES = [
  {
    icon: AutoAwesomeIcon,
    title: 'AI Scheduling',
    text: 'Tell it what you need to do and Schedula splits the work across your week automatically.'
  },
  {
    icon: SchoolIcon,
    title: 'Built for Students',
    text: 'GPA tracking, assignments, class schedules, goals, and habits — all in one place.'
  },
  {
    icon: ShieldIcon,
    title: 'Real Security',
    text: '2FA, session management, login history, and a live security score for your account.'
  },
  {
    icon: PaletteIcon,
    title: 'Pick Your World',
    text: 'Garden, Ocean, Space, or Minimal — a full visual theme, not just a color swap.'
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const themeName = useThemeName();
  const content = getThemeContent(themeName);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.text.primary} 100%)`,
        color: 'primary.contrastText',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        {content.ambientEmojis.map((emoji, i) => (
          <Typography
            key={i}
            sx={{
              position: 'absolute',
              fontSize: 70,
              opacity: 0.12,
              top: `${10 + i * 25}%`,
              left: i % 2 === 0 ? '4%' : undefined,
              right: i % 2 === 1 ? '6%' : undefined,
              transform: `rotate(${i * 25 - 20}deg)`
            }}
          >
            {emoji}
          </Typography>
        ))}

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <Typography sx={{ fontSize: 72, mb: 1 }}>{content.logoEmoji}</Typography>
          <Typography variant="h2" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '2.2rem', md: '3rem' } }}>
            Schedula
          </Typography>
          <Typography variant="h6" sx={{ mb: 1, opacity: 0.95, fontWeight: 400 }}>
            {content.tagline}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.85, maxWidth: 520, mx: 'auto' }}>
            {content.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              size="large"
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'background.paper',
                color: 'primary.dark',
                fontWeight: 700,
                px: 4,
                '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) }
              }}
            >
              Get Started
            </Button>
            <Button
              size="large"
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: 'primary.contrastText',
                color: 'primary.contrastText',
                fontWeight: 600,
                px: 4,
                '&:hover': { borderColor: 'primary.contrastText', bgcolor: alpha(theme.palette.primary.contrastText, 0.1) }
              }}
            >
              Log In
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3
        }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Paper key={f.title} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Icon color="primary" sx={{ fontSize: 36, mb: 1.5 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {f.text}
                </Typography>
              </Paper>
            );
          })}
        </Box>
      </Container>

      <Box sx={{ textAlign: 'center', pb: 6 }}>
        <Typography variant="caption" color="text.secondary">
          © 2026 Schedula. {content.footerTagline}
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
