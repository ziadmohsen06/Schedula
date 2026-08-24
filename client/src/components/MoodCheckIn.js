import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Paper, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { getMood, updateMood } from '../services/api';

const OPTIONS = [
  { value: 'great', label: 'Great', icon: <SentimentVerySatisfiedIcon sx={{ fontSize: 40 }} />, color: '#69C37D' },
  { value: 'okay', label: 'Okay', icon: <SentimentSatisfiedIcon sx={{ fontSize: 40 }} />, color: '#F6C453' },
  { value: 'tired', label: 'Tired', icon: <SentimentDissatisfiedIcon sx={{ fontSize: 40 }} />, color: '#FFA726' },
  { value: 'stressed', label: 'Stressed', icon: <SentimentVeryDissatisfiedIcon sx={{ fontSize: 40 }} />, color: '#E57373' }
];

const MoodCheckIn = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMood()
      .then(({ data }) => { if (data.shouldPrompt) setOpen(true); })
      .catch(() => {});
  }, []);

  const handleSelect = async (mood) => {
    setLoading(true);
    try {
      await updateMood(mood);
      setOpen(false);
      window.dispatchEvent(new CustomEvent('moodUpdated', { detail: { mood } }));
    } catch (err) {
      // non-critical prompt; fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">🌤 How are you feeling today?</Typography>
          <Typography variant="body2" color="text.secondary">
            We'll tailor today's briefing to how you're doing
          </Typography>
        </Box>
        <IconButton onClick={() => setOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
          {OPTIONS.map((option) => (
            <Paper
              key={option.value}
              onClick={() => !loading && handleSelect(option.value)}
              sx={{
                p: 2, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s ease', border: '2px solid transparent',
                opacity: loading ? 0.6 : 1,
                '&:hover': { transform: 'translateY(-4px)', borderColor: option.color, boxShadow: `0 8px 24px ${option.color}33` }
              }}
            >
              <Box sx={{ color: option.color, mb: 1 }}>{option.icon}</Box>
              <Typography variant="h6" fontWeight="bold">{option.label}</Typography>
            </Paper>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={loading}>Skip for now</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MoodCheckIn;
