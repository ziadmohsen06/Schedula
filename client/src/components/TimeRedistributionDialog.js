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
import { alpha } from '@mui/material/styles';
import { rescheduleTask, scheduleTask } from '../services/api';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const TimeRedistributionDialog = ({ open, onClose, completedTask, allTasks, onRedistributed }) => {
  const themeName = useThemeName();
  const content = getThemeContent(themeName);
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" color="text.primary">
            ⏱ Time Redistribution
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You finished early! Spread the extra time to other tasks
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {completedTask && (
          <Paper sx={{
            p: 2,
            mb: 2,
            bgcolor: 'success.main',
            opacity: 0.15,
            border: '2px solid',
            borderColor: 'success.main',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="body1" fontWeight="bold" color="success.dark">
                ✅ Completed: {completedTask.title}
              </Typography>
              <Typography variant="body2" color="success.dark" sx={{ mt: 0.5 }}>
                Extra time available: {completedTask.estimatedHours} hours
              </Typography>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
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
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No other active tasks to redistribute time to. Enjoy your free time! {content.goodDayEmoji}
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
                    ? '2px solid'
                    : '1px solid',
                  borderColor: (distribution[task._id] || 0) > 0 ? 'primary.main' : 'divider',
                  bgcolor: (distribution[task._id] || 0) > 0
                    ? (theme) => alpha(theme.palette.primary.main, 0.1)
                    : 'action.hover',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Current: {task.estimatedHours} hrs | Priority: {task.priority}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveHours(task._id)}
                      disabled={loading || (distribution[task._id] || 0) <= 0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'rgba(255,0,0,0.1)' },
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>

                    <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{
                      minWidth: 50,
                      textAlign: 'center',
                    }}>
                      {distribution[task._id] || 0}h
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => handleAddHours(task._id)}
                      disabled={loading || remainingHours <= 0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) },
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

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
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