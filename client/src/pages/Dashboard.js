import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button,
  Card, CardContent, CardActions, Chip, Alert, CircularProgress,
  Stack, Paper, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../context/AuthContext';
import { getTasks, getCompletedTasks, deleteTask, scheduleTask, rescheduleTask, completeTask } from '../services/api';
import AppShell from '../components/AppShell';
import { getDeadlineStatus, formatDeadline } from '../utils/dateUtils';
import { playLeafSound, isSoundEnabled } from '../utils/soundUtils';

const LeafConfetti = ({ active }) => {
  const leaves = ['🍃', '🌿', '🍀', '🌱', '🍁'];
  if (!active) return null;
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: '-50px',
            left: `${Math.random() * 100}%`,
            fontSize: '24px',
            animation: `leafFall ${1.5 + Math.random() * 2}s ease-in forwards`,
            animationDelay: `${Math.random() * 1}s`,
          }}
        >
          {leaves[Math.floor(Math.random() * leaves.length)]}
        </Box>
      ))}
    </Box>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lazyMode, setLazyMode] = useState(() => localStorage.getItem('lazyMode') === 'true');
  const [sortOrder, setSortOrder] = useState('priority-high');
  const [focusTime, setFocusTime] = useState(() => (localStorage.getItem('lazyMode') === 'true' ? 15 * 60 : 25 * 60));
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTaskId, setScheduleTaskId] = useState(null);
  const [scheduleDeadline, setScheduleDeadline] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedCount: 0,
    completionRate: 0,
    overdueCount: 0,
    highPriorityCount: 0
  });

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchTasks();
    fetchStats();
  }, [user, navigate]);

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

  const fetchStats = async () => {
    try {
      const { data } = await getCompletedTasks();
      const completedList = data.tasks || data;
      calculateStats(completedList);
    } catch (err) {
      console.log('Failed to fetch stats');
    }
  };

  const calculateStats = (completed) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue = tasks.filter(t => new Date(t.deadline) < today);
    const highPriority = tasks.filter(t => ['high', 'urgent'].includes(t.priority));
    const completedCount = completed.length || 0;
    const totalTasks = tasks.length + completedCount;
    
    setStats({
      totalTasks,
      completedCount,
      completionRate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
      overdueCount: overdue.length,
      highPriorityCount: highPriority.length
    });
  };

  const getBurnoutWarning = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasks = tasks.filter(t => new Date(t.deadline) < today);
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) return null;
    
    const overdueRatio = overdueTasks.length / totalTasks;
    
    if (overdueTasks.length >= 5 || overdueRatio > 0.5) {
      return {
        level: 'high',
        severity: 'error',
        title: '🔥 Burnout Risk!',
        message: `You have ${overdueTasks.length} overdue tasks. Consider rescheduling some to avoid burnout.`
      };
    } else if (overdueTasks.length >= 3 || overdueRatio > 0.3) {
      return {
        level: 'medium',
        severity: 'warning',
        title: '⚠️ Workload Warning',
        message: `You have ${overdueTasks.length} overdue tasks. Take a break and tackle them one at a time.`
      };
    } else if (overdueTasks.length > 0) {
      return {
        level: 'low',
        severity: 'info',
        title: '💡 Heads Up',
        message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Try to complete them soon.`
      };
    }
    
    return null;
  };

  const burnoutWarning = getBurnoutWarning();

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(task => task._id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleComplete = async (id) => {
    try {
      setCompletingId(id);
      
      if (isSoundEnabled()) {
        playLeafSound();
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await completeTask(id);
      setTasks(tasks.filter(task => task._id !== id));
      setCompletingId(null);
      fetchStats();
    } catch (err) {
      setError('Failed to complete task');
      setCompletingId(null);
    }
  };

  const handleSchedule = async (id) => {
    const task = tasks.find(t => t._id === id);
    const isOverdue = new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0));
    if (isOverdue) {
      setScheduleTaskId(id);
      setScheduleDialogOpen(true);
      return;
    }
    try {
      const { data } = await scheduleTask(id);
      setTasks(tasks.map(t => t._id === id ? data.task : t));
    } catch (err) {
      setError('Failed to schedule task');
    }
  };

  const handleScheduleConfirm = async () => {
    try {
      const task = tasks.find(t => t._id === scheduleTaskId);
      await rescheduleTask(scheduleTaskId, {
        deadline: scheduleDeadline,
        priority: task?.priority || 'medium'
      });
      const { data } = await scheduleTask(scheduleTaskId);
      setTasks(tasks.map(t => t._id === scheduleTaskId ? data.task : t));
      setScheduleDialogOpen(false);
      setScheduleTaskId(null);
      setScheduleDeadline('');
    } catch (err) {
      setError('Failed to schedule task');
    }
  };

  const priorityColor = { low: 'success', medium: 'warning', high: 'error', urgent: 'error' };
  const priorityWeight = { low: 1, medium: 2, high: 3, urgent: 4 };

  const getSortedTasks = () => {
    const copy = [...tasks];
    switch (sortOrder) {
      case 'priority-high': return copy.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      case 'priority-low': return copy.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
      case 'newest': return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest': return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'deadline': return copy.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      default: return copy;
    }
  };
    const sortedTasks = getSortedTasks();
  const topTask = tasks.reduce((best, task) => {
    if (!best) return task;
    return priorityWeight[task.priority] > priorityWeight[best.priority] ? task : best;
  }, null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <AppShell>
      <style>{`
        @keyframes leafFall {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes cardEntrance {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .garden-card {
          animation: cardEntrance 0.4s ease forwards;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .garden-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 32px rgba(63, 143, 90, 0.18) !important;
        }
      `}</style>

      <LeafConfetti active={showConfetti} />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {new Date().getHours() < 12 ? '☀️ Good Morning' : new Date().getHours() < 17 ? '🌤 Good Afternoon' : '🌙 Good Evening'}, {user?.name}
            </Typography>
            <Typography color="text.secondary">Today feels like a great day to grow 🌿</Typography>
          </Box>
          {lazyMode && (
            <Chip label="🌙 Lazy Mode" sx={{ bgcolor: '#3949ab', color: '#fff', fontWeight: 'bold' }} />
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Burnout Warning */}
        {burnoutWarning && (
          <Alert 
            severity={burnoutWarning.severity}
            icon={<WarningIcon />}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2" fontWeight="bold">
              {burnoutWarning.title}
            </Typography>
            <Typography variant="body2">
              {burnoutWarning.message}
            </Typography>
          </Alert>
        )}

        {/* Stats Card */}
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          background: 'linear-gradient(135deg, rgba(105,195,125,0.1) 0%, rgba(246,196,83,0.08) 100%)',
          border: '1px solid rgba(105,195,125,0.3)',
          borderRadius: 2,
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>📊 Progress Overview</Typography>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {stats.completionRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.completedCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">Completed</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.overdueCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">Overdue</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.highPriorityCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">High Priority</Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            width: '100%', 
            height: 10, 
            bgcolor: 'rgba(105,195,125,0.2)', 
            borderRadius: 5,
            overflow: 'hidden',
          }}>
            <Box sx={{ 
              width: `${stats.completionRate}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #69C37D, #3F8F5A)',
              transition: 'width 0.5s ease',
              borderRadius: 5,
            }} />
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
            {stats.completedCount} of {stats.totalTasks} tasks completed
          </Typography>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <Paper sx={{
            flex: 1, p: 2,
            borderLeft: '4px solid #69C37D',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(63,143,90,0.15)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">🧠 Smart Workload</Typography>
            <Typography variant="h6">Balanced across your week</Typography>
            <Typography variant="body2" color="text.secondary">Schedula spreads heavy work to keep your days realistic.</Typography>
          </Paper>
          <Paper sx={{
            flex: 1, p: 2,
            borderLeft: lazyMode ? '4px solid #3949ab' : '4px solid #3F8F5A',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(63,143,90,0.15)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">{lazyMode ? '🌙 Lazy Mode ON' : '🍃 Lazy Mode'}</Typography>
            <Typography variant="h6">{lazyMode ? 'Easy day active' : 'Easy day mode'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {lazyMode ? 'Focus timer is 15 min. Take it easy today.' : 'Toggle the crescent moon in the header to activate.'}
            </Typography>
          </Paper>
          <Paper sx={{
            flex: 1, p: 2,
            borderLeft: '4px solid #F6C453',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(246,196,83,0.15)' }
          }}>
            <Typography variant="subtitle2" color="text.secondary">🌱 Progress</Typography>
            <Typography variant="h6">Stay consistent</Typography>
            <Typography variant="body2" color="text.secondary">You have {tasks.length} task{tasks.length === 1 ? '' : 's'} in view.</Typography>
          </Paper>
        </Stack>

        <Paper sx={{
          p: 2, mb: 3,
          background: 'linear-gradient(135deg, rgba(105,195,125,0.08) 0%, rgba(246,196,83,0.06) 100%)',
          position: 'relative', overflow: 'hidden'
        }}>
          <Typography variant="h6" sx={{ mb: 1 }}>🌤 AI Daily Briefing</Typography>
          <Typography variant="body2" color="text.secondary">
            {lazyMode 
              ? `🌙 Lazy Mode is on. Focus on ${topTask ? topTask.title : 'your most important task'} first.`
              : `🍃 Looks like a good day. Start with "${topTask?.title}".`}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>⚡ Focus Session {lazyMode ? '🌙' : ''}</Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>{formatTime(focusTime)}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => setIsFocusRunning((prev) => !prev)}>
              {isFocusRunning ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outlined" onClick={() => { setIsFocusRunning(false); setFocusTime(lazyMode ? 15 * 60 : 25 * 60); }}>
              Reset
            </Button>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">🌿 Your Tasks</Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortOrder} label="Sort by" onChange={(e) => setSortOrder(e.target.value)}>
              <MenuItem value="priority-high">Priority: High to Low</MenuItem>
              <MenuItem value="priority-low">Priority: Low to High</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="deadline">Deadline Soonest</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h2">🌱</Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>Your garden is ready.</Typography>
            <Typography color="text.secondary">Plant your first task to start growing.</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/add-task')}>
              + Plant a Task
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedTasks.map((task, idx) => {
              const deadlineStatus = getDeadlineStatus(task.deadline);
              const isCompleting = completingId === task._id;
              return (
                <Card
                  key={task._id}
                  className="garden-card"
                  sx={{
                    border: deadlineStatus.isOverdue ? '2px solid #e57373' : 'none',
                    animationDelay: `${idx * 0.05}s`,
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isCompleting ? 0.5 : 1,
                    transition: 'all 0.5s ease',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">{task.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {deadlineStatus.isOverdue && <Chip label="Overdue" color="error" size="small" />}
                        <Chip label={task.priority} color={priorityColor[task.priority]} size="small" />
                      </Box>
                    </Box>
                    {task.description && (
                      <Typography color="text.secondary" sx={{ mt: 1 }}>{task.description}</Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        📅 {formatDeadline(task.deadline)}
                      </Typography>
                      <Chip 
                        label={deadlineStatus.text}
                        size="small"
                        color={deadlineStatus.isOverdue ? 'error' : deadlineStatus.color}
                        sx={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      ⏱ Estimated: {task.estimatedHours} hours
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="success"
                      onClick={() => handleComplete(task._id)}
                      disabled={isCompleting}
                    >
                      {isCompleting ? '✓ Completing...' : '✓ Done'}
                    </Button>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleSchedule(task._id)}
                    >
                      🤖 Schedule
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(task._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📅 Set New Deadline</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This task is overdue. Set a new deadline before the AI schedules it.
          </Typography>
          <TextField
            type="date"
            fullWidth
            value={scheduleDeadline}
            onChange={(e) => setScheduleDeadline(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScheduleConfirm} disabled={!scheduleDeadline}>
            Schedule with AI
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default Dashboard;