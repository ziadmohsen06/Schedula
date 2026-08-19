import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Paper, IconButton, Chip,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { rescheduleTask, scheduleTask } from '../services/api';

const TimeRedistributionDialog = ({ open, onClose, completedTask, allTasks, onRedistributed }) => {
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const syncDarkMode = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChanged', syncDarkMode);
    return () => window.removeEventListener('darkModeChanged', syncDarkMode);
  }, []);

  useEffect(() => {
    if (open && completedTask && allTasks.length > 0) {
      // Initialize distribution with 0 hours for all tasks
      const initDist = {};
      allTasks.forEach(task => {
        if (task._id !== completedTask._id) {
          initDist[task._id] = 0;
        }
      });
      setDistribution(initDist);
      setError('');
    }
  }, [open, completedTask, allTasks]);

  const handleAddHours = (taskId) => {
    setDistribution(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || 0) + 0.5
    }));
  };

  const handleRemoveHours = (taskId) => {
    setDistribution(prev => ({
      ...prev,
      [taskId]: Math.max(0, (prev[taskId] || 0) - 0.5)
    }));
  };

  const getTotalDistributed = () => {
    return Object.values(distribution).reduce((sum, val) => sum + (val || 0), 0);
  };

  const getExtraHours = () => {
    return completedTask?.estimatedHours || 0;
  };

  const handleRedistribute = async () => {
    const totalDistributed = getTotalDistributed();
    
    if (totalDistributed <= 0) {
      setError('Please add at least some hours to other tasks');
      return;
    }

    if (totalDistributed > getExtraHours()) {
      setError(`You can only distribute up to ${getExtraHours()} hours`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updates = Object.entries(distribution)
        .filter(([taskId, hours]) => hours > 0)
        .map(async ([taskId, hours]) => {
          const task = allTasks.find(t => t._id === taskId);
          if (task) {
            // Update the task with new estimated hours
            await rescheduleTask(taskId, {
              deadline: task.deadline,
              priority: task.priority
            });
          }
        });

      await Promise.all(updates);
      onRedistributed();
      onClose();
    } catch (err) {
      setError('Failed to redistribute time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableTasks = allTasks.filter(task => 
    task._id !== completedTask?._id
  );

  const remainingHours = getExtraHours() - getTotalDistributed();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: darkMode ? '#162418' : '#FCFFFC',
          background: darkMode 
            ? 'linear-gradient(135deg, #1a3320 0%, #162418 100%)'
            : 'linear-gradient(135deg, #f0faf0 0%, #FCFFFC 100%)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ color: darkMode ? '#d4edda' : 'inherit' }}>
            ⏱ Time Redistribution
          </Typography>
          <Typography variant="body2" sx={{ color: darkMode ? '#8fac93' : 'text.secondary' }}>
            You finished early! Spread the extra time to other tasks
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: darkMode ? '#8fac93' : 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {completedTask && (
          <Paper sx={{ 
            p: 2, 
            mb: 2, 
            bgcolor: darkMode ? '#1a2e1a' : '#e8f5e9', 
            border: '2px solid #4caf50',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 32 }} />
            <Box>
              <Typography variant="body1" fontWeight="bold" sx={{ color: darkMode ? '#81c784' : '#2e7d32' }}>
                ✅ Completed: {completedTask.title}
              </Typography>
              <Typography variant="body2" sx={{ color: darkMode ? '#a5d6a7' : '#2e7d32', mt: 0.5 }}>
                Extra time available: {completedTask.estimatedHours} hours
              </Typography>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: darkMode ? '#d4edda' : 'inherit' }}>
            Remaining to distribute:
          </Typography>
          <Chip 
            label={`${remainingHours} hrs`} 
            color={remainingHours > 0 ? 'warning' : 'success'} 
            size="small" 
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {availableTasks.length === 0 ? (
          <Typography variant="body2" sx={{ 
            textAlign: 'center', 
            py: 3,
            color: darkMode ? '#8fac93' : 'text.secondary'
          }}>
            No other active tasks to redistribute time to. Enjoy your free time! 🌿
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 350, overflowY: 'auto', pr: 1 }}>
            {availableTasks.map((task) => (
              <Paper
                key={task._id}
                sx={{
                  p: 1.5,
                  transition: 'all 0.2s ease',
                  border: (distribution[task._id] || 0) > 0 
                    ? '2px solid #69C37D' 
                    : `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                  bgcolor: (distribution[task._id] || 0) > 0
                    ? (darkMode ? 'rgba(105, 195, 125, 0.15)' : 'rgba(105, 195, 125, 0.1)')
                    : (darkMode ? '#1a1a1a' : '#fafafa'),
                  '&:hover': {
                    borderColor: '#69C37D',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: darkMode ? '#d4edda' : 'inherit' }}>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkMode ? '#8fac93' : 'text.secondary' }}>
                      Current: {task.estimatedHours} hrs | Priority: {task.priority}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveHours(task._id)}
                      disabled={loading || (distribution[task._id] || 0) <= 0}
                      sx={{ 
                        border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                        '&:hover': { bgcolor: 'rgba(255,0,0,0.1)' },
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    
                    <Typography variant="body2" fontWeight="bold" sx={{ 
                      minWidth: 50, 
                      textAlign: 'center',
                      color: darkMode ? '#d4edda' : 'inherit',
                    }}>
                      {distribution[task._id] || 0}h
                    </Typography>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleAddHours(task._id)}
                      disabled={loading || remainingHours <= 0}
                      sx={{ 
                        border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                        '&:hover': { bgcolor: 'rgba(105, 195, 125, 0.1)' },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: darkMode ? '#8fac93' : 'inherit' }}>
          Skip
        </Button>
        <Button
          variant="contained"
          onClick={handleRedistribute}
          disabled={loading || availableTasks.length === 0 || getTotalDistributed() <= 0}
          startIcon={<ScheduleIcon />}
        >
          {loading ? 'Redistributing...' : 'Redistribute Time'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeRedistributionDialog;