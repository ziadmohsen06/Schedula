import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Button, Paper, Divider,
  Switch, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import AppShell from '../components/AppShell';
import { startFocusSound, stopFocusSound } from '../utils/focusSound';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const TimerPage = () => {
  const themeName = useThemeName();
  const content = getThemeContent(themeName);
  const [lazyMode, setLazyMode] = useState(() => localStorage.getItem('lazyMode') === 'true');
  const [focusTime, setFocusTime] = useState(() => (localStorage.getItem('lazyMode') === 'true' ? 15 * 60 : 25 * 60));
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [focusSound, setFocusSound] = useState('off');

  useEffect(() => {
    const syncLazy = () => {
      const lazy = localStorage.getItem('lazyMode') === 'true';
      setLazyMode(lazy);
      setIsFocusRunning(false);
      setFocusTime(lazy ? 15 * 60 : 25 * 60);
    };
    window.addEventListener('lazyModeChanged', syncLazy);
    return () => window.removeEventListener('lazyModeChanged', syncLazy);
  }, []);

  const toggleLazyMode = () => {
    const next = !lazyMode;
    localStorage.setItem('lazyMode', next);
    window.dispatchEvent(new Event('lazyModeChanged'));
  };

  useEffect(() => {
    if (!isFocusRunning) return;
    const timer = setInterval(() => {
      setFocusTime((prev) => {
        if (prev <= 1) { setIsFocusRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFocusRunning]);

  useEffect(() => {
    if (isFocusRunning && focusSound !== 'off') {
      startFocusSound(focusSound);
    } else {
      stopFocusSound();
    }
    return () => stopFocusSound();
  }, [isFocusRunning, focusSound]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>⏱ Focus Timer</Typography>

        <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BedtimeIcon color={lazyMode ? 'secondary' : 'action'} />
            <Box>
              <Typography variant="body1" fontWeight="medium">Lazy Mode</Typography>
              <Typography variant="body2" color="text.secondary">
                {lazyMode ? 'Easy day active — 15 min focus sessions' : 'Shortens focus sessions to 15 minutes on tough days'}
              </Typography>
            </Box>
          </Box>
          <Switch checked={lazyMode} onChange={toggleLazyMode} />
        </Paper>

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {lazyMode ? `${content.goodDayEmoji} Easy day session` : 'Focus session'}
          </Typography>
          <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main', fontSize: { xs: '3.5rem', sm: '5rem' } }}>
            {formatTime(focusTime)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Button variant="contained" size="large" onClick={() => setIsFocusRunning((prev) => !prev)}>
              {isFocusRunning ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outlined" size="large" onClick={() => { setIsFocusRunning(false); setFocusTime(lazyMode ? 15 * 60 : 25 * 60); }}>
              Reset
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Focus Sound</InputLabel>
            <Select value={focusSound} label="Focus Sound" onChange={(e) => setFocusSound(e.target.value)}>
              <MenuItem value="off">Off</MenuItem>
              <MenuItem value="brown">🌊 Brown Noise</MenuItem>
              <MenuItem value="rain">🌧 Rain</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </Container>
    </AppShell>
  );
};

export default TimerPage;
