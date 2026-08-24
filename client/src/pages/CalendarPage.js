import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Chip, Button,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Card, CardContent, IconButton,
  Tooltip, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getTasks, scheduleTask, rescheduleTask, setTaskScheduleHour } from '../services/api';
import AppShell from '../components/AppShell';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';

const priorityColor = { 
  low: { 
    light: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
    dark: { bg: '#1a2e1a', border: '#4caf50', text: '#81c784' },
    chip: 'success'
  },
  medium: { 
    light: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
    dark: { bg: '#2e2518', border: '#ff9800', text: '#ffb74d' },
    chip: 'warning'
  },
  high: { 
    light: { bg: '#ffebee', border: '#f44336', text: '#c62828' },
    dark: { bg: '#2e1a1a', border: '#f44336', text: '#ef9a9a' },
    chip: 'error'
  },
  urgent: { 
    light: { bg: '#fce4ec', border: '#d32f2f', text: '#b71c1c' },
    dark: { bg: '#3e1a1a', border: '#d32f2f', text: '#ef5350' },
    chip: 'error'
  }
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

const formatHour = (hour) => {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
};

const CalendarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const themeName = useThemeName();
  const content = getThemeContent(themeName);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [startDateDialog, setStartDateDialog] = useState(false);
  const [selectedTaskForSchedule, setSelectedTaskForSchedule] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [viewMode, setViewMode] = useState('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  useEffect(() => {
    const sync = () => setDarkMode(localStorage.getItem('darkMode') === 'true');
    window.addEventListener('darkModeChanged', sync);
    return () => window.removeEventListener('darkModeChanged', sync);
  }, []);

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchTasks();
  }, [user, navigate]);

  const fetchTasks = async () => {
    try {
      const { data } = await getTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDateAndHour = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.scheduledDays || task.scheduledDays.length === 0) return false;

      const scheduleInfo = task.scheduledDays.find(day => {
        const dayDate = new Date(day.date);
        const dayStr = dayDate.toISOString().split('T')[0];
        return dayStr === dateStr;
      });

      if (!scheduleInfo) return false;

      const effectiveHour = scheduleInfo.hour !== undefined && scheduleInfo.hour !== null
        ? scheduleInfo.hour
        : getPriorityHour(task.priority);
      return effectiveHour === hour;
    }).map(task => {
      const scheduleInfo = task.scheduledDays.find(day => {
        const dayDate = new Date(day.date);
        const dayStr = dayDate.toISOString().split('T')[0];
        return dayStr === dateStr;
      });
      return { ...task, scheduleInfo };
    });
  };

  const handleDragStart = (e, task, dateStr) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task._id, dateStr }));
  };

  const handleDropOnHour = async (e, hour) => {
    e.preventDefault();
    try {
      const { taskId, dateStr } = JSON.parse(e.dataTransfer.getData('application/json'));
      const { data } = await setTaskScheduleHour(taskId, dateStr, hour);
      setTasks(tasks.map(t => t._id === taskId ? data.task : t));
    } catch (err) {
      setError('Failed to move task to that time slot');
    }
  };

  const getPriorityHour = (priority) => {
    switch (priority) {
      case 'urgent': return 8;
      case 'high': return 10;
      case 'medium': return 13;
      case 'low': return 16;
      default: return 13;
    }
  };

  const getUnscheduledTasks = () => {
    return tasks.filter(task => !task.scheduledDays || task.scheduledDays.length === 0);
  };

  const handleOpenTaskDetail = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleOpenStartDate = (task) => {
    setSelectedTaskForSchedule(task);
    setStartDate('');
    setStartDateDialog(true);
  };

  const handleScheduleWithStartDate = async () => {
    if (!startDate || !selectedTaskForSchedule) return;
    
    try {
      await rescheduleTask(selectedTaskForSchedule._id, {
        deadline: startDate,
        priority: selectedTaskForSchedule.priority
      });
      
      const { data } = await scheduleTask(selectedTaskForSchedule._id);
      
      setTasks(tasks.map(t => t._id === selectedTaskForSchedule._id ? data.task : t));
      setStartDateDialog(false);
      setSelectedTaskForSchedule(null);
      setStartDate('');
    } catch (err) {
      setError('Failed to schedule task with start date');
    }
  };

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getTaskColors = (priority) => {
    const colors = priorityColor[priority] || priorityColor.medium;
    return darkMode ? colors.dark : colors.light;
  };

  return (
    <AppShell>
      <style>{`
        @keyframes cardEntrance {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .calendar-task-card {
          animation: cardEntrance 0.4s ease forwards;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          cursor: pointer;
        }
        .calendar-task-card:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 8px 24px ${alpha(theme.palette.primary.dark, 0.25)} !important;
          z-index: 10;
        }
        .week-cell {
          transition: background-color 0.2s ease;
        }
        .week-cell:hover {
          background-color: ${alpha(theme.palette.primary.main, darkMode ? 0.08 : 0.05)};
        }
      `}</style>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">📅 Calendar</Typography>
            <Typography color="text.secondary">
              Your AI-scheduled tasks by day and time
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, val) => { if (val) setViewMode(val); }}
              size="small"
            >
              <ToggleButton value="week">
                <ViewWeekIcon sx={{ mr: 0.5 }} /> Week
              </ToggleButton>
              <ToggleButton value="day">
                <ViewDayIcon sx={{ mr: 0.5 }} /> Day
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={() => {
                const unscheduled = getUnscheduledTasks();
                if (unscheduled.length > 0) {
                  handleOpenStartDate(unscheduled[0]);
                } else {
                  window.dispatchEvent(new Event('openDailyPreference'));
                }
              }}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                }
              }}
            >
              When do you want to start?
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Unscheduled tasks banner */}
        {getUnscheduledTasks().length > 0 && (
          <Paper sx={{
            p: 2,
            mb: 3,
            bgcolor: (theme) => alpha(theme.palette.secondary.main, darkMode ? 0.15 : 0.12),
            border: '1px solid',
            borderColor: 'secondary.main',
            borderRadius: 2,
          }}>
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
              📋 {getUnscheduledTasks().length} task{getUnscheduledTasks().length > 1 ? 's' : ''} without schedule
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click a task to set a start date and let AI divide the work.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getUnscheduledTasks().map(task => (
                <Chip
                  key={task._id}
                  label={`${task.title} (${task.estimatedHours}hrs)`}
                  onClick={() => handleOpenStartDate(task)}
                  color="warning"
                  variant="outlined"
                  icon={<EventIcon />}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Week Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button variant="outlined" size="small" onClick={() => navigateWeek(-1)}>
            ← Previous
          </Button>
          <Typography variant="h6" fontWeight="bold">
            {formatDate(weekDates[0])} — {formatDate(weekDates[6])}
          </Typography>
          <Button variant="outlined" size="small" onClick={() => navigateWeek(1)}>
            Next →
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'week' ? (
          /* WEEK VIEW WITH HOURS */
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 1000 }}>
              {/* Header Row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 1, mb: 1 }}>
                <Box />
                {weekDates.map((date, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, isToday(date) ? 0.2 : 0.12),
                      color: isToday(date) ? 'primary.main' : 'inherit',
                      border: isToday(date) ? '2px solid' : 'none',
                      borderColor: 'primary.dark',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Typography>
                    <Typography variant="caption">
                      {formatDate(date)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Time Rows */}
              {HOURS.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '80px repeat(7, 1fr)',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  {/* Time Label */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 1,
                  }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      {formatHour(hour)}
                    </Typography>
                  </Box>

                  {/* Day Cells */}
                  {weekDates.map((date, dayIndex) => {
                    const dayTasks = getTasksForDateAndHour(date, hour);
                    return (
                      <Box
                        key={dayIndex}
                        className="week-cell"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnHour(e, hour)}
                        sx={{
                          minHeight: 60,
                          p: 0.5,
                          borderRadius: 1,
                          bgcolor: dayTasks.length > 0
                            ? getTaskColors(dayTasks[0].priority).bg
                            : 'action.hover',
                          border: `1px solid ${dayTasks.length > 0
                            ? getTaskColors(dayTasks[0].priority).border
                            : theme.palette.divider}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        {dayTasks.length === 0 ? (
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>
                            —
                          </Typography>
                        ) : (
                          dayTasks.map((task, taskIndex) => (
                            <Card
                              key={task._id}
                              className="calendar-task-card"
                              draggable
                              onDragStart={(e) => handleDragStart(e, task, date.toISOString().split('T')[0])}
                              onClick={() => handleOpenTaskDetail(task)}
                              sx={{
                                cursor: 'grab',
                                animationDelay: `${taskIndex * 0.1}s`,
                                bgcolor: 'transparent',
                                boxShadow: 'none',
                                border: `1px solid ${getTaskColors(task.priority).border}`,
                                '&:hover': {
                                  bgcolor: 'background.paper',
                                }
                              }}
                            >
                              <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
                                <Typography 
                                  variant="caption" 
                                  fontWeight="bold" 
                                  sx={{ 
                                    fontSize: 10, 
                                    display: 'block',
                                    color: getTaskColors(task.priority).text,
                                  }}
                                >
                                  {task.title}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: 9, 
                                    display: 'block', 
                                    color: 'text.secondary',
                                  }}
                                >
                                  {task.scheduleInfo?.hoursPerDay} hrs
                                </Typography>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          /* DAY VIEW */
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              {formatFullDate(new Date())}
            </Typography>
            {HOURS.map((hour) => {
              const todayTasks = getTasksForDateAndHour(new Date(), hour);
              return (
                <Box key={hour} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Box sx={{ width: 80, textAlign: 'right', pr: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      {formatHour(hour)}
                    </Typography>
                  </Box>
                  <Box
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnHour(e, hour)}
                    sx={{
                      flex: 1,
                      minHeight: 60,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      border: '1px solid', borderColor: 'divider'
                    }}>
                    {todayTasks.length === 0 ? (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    ) : (
                      todayTasks.map((task) => (
                        <Card
                          key={task._id}
                          className="calendar-task-card"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, new Date().toISOString().split('T')[0])}
                          onClick={() => handleOpenTaskDetail(task)}
                          sx={{
                            mb: 0.5,
                            cursor: 'grab',
                            bgcolor: getTaskColors(task.priority).bg,
                            boxShadow: 'none',
                            border: `1px solid ${getTaskColors(task.priority).border}`,
                          }}
                        >
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: getTaskColors(task.priority).text }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.scheduleInfo?.hoursPerDay} hrs {task.scheduleInfo?.focus ? `— ${task.scheduleInfo.focus}` : ''}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Task Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${theme.palette.background.paper} 100%)`,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{content.logoEmoji} Task Details</Typography>
          <IconButton onClick={() => setDetailOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold">{selectedTask.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label={selectedTask.priority} color={priorityColor[selectedTask.priority]?.chip || 'default'} size="small" />
                  <Chip label={`${selectedTask.estimatedHours} hours`} size="small" variant="outlined" />
                </Box>
              </Box>

              {selectedTask.description && (
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="text.secondary">Description:</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>{selectedTask.description}</Typography>
                </Box>
              )}

              <Divider />

              <Box>
                <Typography variant="body2" color="text.secondary">
                  📅 Deadline: {new Date(selectedTask.deadline).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  ⏱ Estimated: {selectedTask.estimatedHours} hours
                </Typography>
              </Box>

              {selectedTask.scheduledDays && selectedTask.scheduledDays.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="primary.dark" sx={{ mb: 1 }}>
                    🗓 Full AI Schedule:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedTask.scheduledDays.map((day, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 1.5,
                          bgcolor: 'action.hover',
                          borderLeft: '4px solid', borderColor: 'primary.main',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Typography>
                          {day.focus && (
                            <Typography variant="caption" color="text.secondary">
                              🎯 {day.focus}
                            </Typography>
                          )}
                        </Box>
                        <Chip label={`${day.hoursPerDay} hrs`} size="small" />
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {(!selectedTask.scheduledDays || selectedTask.scheduledDays.length === 0) && (
                <Alert severity="info">
                  This task hasn't been scheduled yet. Click "Schedule with AI" to divide it across days.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedTask && (!selectedTask.scheduledDays || selectedTask.scheduledDays.length === 0) && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailOpen(false);
                handleOpenStartDate(selectedTask);
              }}
            >
              Schedule with AI
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Start Date Dialog */}
      <Dialog
        open={startDateDialog}
        onClose={() => setStartDateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📅 When do you want to start?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose a start date for <strong>{selectedTaskForSchedule?.title}</strong>. The AI will divide the work across days starting from this date.
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Start Date</Typography>
          <TextField
            type="date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleScheduleWithStartDate}
            disabled={!startDate}
          >
            Schedule with AI
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default CalendarPage;