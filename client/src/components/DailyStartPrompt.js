import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Paper, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getDailyPreference, updateDailyPreference } from '../services/api';

const DailyStartPrompt = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkDailyPrompt();
    
    // Listen for manual open event
    const handleOpenEvent = () => {
      setOpen(true);
    };
    window.addEventListener('openDailyPreference', handleOpenEvent);
    
    return () => {
      window.removeEventListener('openDailyPreference', handleOpenEvent);
    };
  }, []);

  const checkDailyPrompt = async () => {
    try {
      const { data } = await getDailyPreference();
      if (data.shouldPrompt) {
        setOpen(true);
      }
    } catch (err) {
      console.log('Could not check daily preference');
    }
  };

  const handleSelectPreference = async (preference) => {
    setLoading(true);
    try {
      await updateDailyPreference(preference);
      setOpen(false);
      window.dispatchEvent(new Event('preferenceUpdated'));
    } catch (err) {
      console.log('Failed to update preference');
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      value: 'early',
      label: 'Early Bird',
      icon: <WbSunnyIcon sx={{ fontSize: 40 }} />,
      description: 'Start at 8 AM',
      color: '#FFA726'
    },
    {
      value: 'mid',
      label: 'Mid Morning',
      icon: <WbTwilightIcon sx={{ fontSize: 40 }} />,
      description: 'Start at 10 AM',
      color: '#69C37D'
    },
    {
      value: 'late',
      label: 'Late Starter',
      icon: <NightsStayIcon sx={{ fontSize: 40 }} />,
      description: 'Start at 12 PM',
      color: '#7986CB'
    },
    {
      value: 'flexible',
      label: 'Flexible',
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      description: 'AI decides best time',
      color: '#F6C453'
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f0faf0 0%, #FCFFFC 100%)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">🌅 When do you want to start today?</Typography>
          <Typography variant="body2" color="text.secondary">
            This helps AI schedule your tasks at the right time
          </Typography>
        </Box>
        <IconButton onClick={() => setOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
          {options.map((option) => (
            <Paper
              key={option.value}
              onClick={() => !loading && handleSelectPreference(option.value)}
              sx={{
                p: 2,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                border: '2px solid transparent',
                opacity: loading ? 0.6 : 1,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: option.color,
                  boxShadow: `0 8px 24px ${option.color}33`,
                },
              }}
            >
              <Box sx={{ color: option.color, mb: 1 }}>
                {option.icon}
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {option.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={loading}>
          Skip for now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyStartPrompt;