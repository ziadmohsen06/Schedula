import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, ButtonBase,
  Card, CardContent, CardActions, Chip, Alert, Skeleton,
  Stack, Paper, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { getTasks, getCompletedTasks, deleteTask, scheduleTask, rescheduleTask, completeTask, getWorkloadInsights, getMood, getSmartSuggestions, getHabits } from '../services/api';
import AppShell from '../components/AppShell';
import { getDeadlineStatus, formatDeadline } from '../utils/dateUtils';
import { playLeafSound, isSoundEnabled } from '../utils/soundUtils';
import { useThemeName } from '../hooks/useThemeName';
import { getThemeContent } from '../themeContent';

const LeafConfetti = ({ active, emojis }) => {
  const leaves = emojis !== undefined ? emojis : ['🍃', '🌿', '🍀', '🌱', '🍁'];
  if (!active || leaves.length === 0) return null;
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
  const theme = useTheme();
  const themeName = useThemeName();
  const content = getThemeContent(themeName);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lazyMode, setLazyMode] = useState(() => localStorage.getItem('lazyMode') === 'true');
  const [sortOrder, setSortOrder] = useState('priority-high');
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
  const [workload, setWorkload] = useState(null);
  const [habits, setHabits] = useState([]);
  const [mood, setMood] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [milestoneMessage, setMilestoneMessage] = useState('');
  const shownMilestonesRef = useRef(new Set());

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchTasksAndStats();
    fetchWorkload();
    fetchMood();
    fetchSuggestions();
    fetchHabits();
  }, [user, navigate]);

  useEffect(() => {
    const handleMoodUpdated = (e) => setMood(e.detail.mood);
    window.addEventListener('moodUpdated', handleMoodUpdated);
    return () => window.removeEventListener('moodUpdated', handleMoodUpdated);
  }, []);

  useEffect(() => {
    const syncLazy = () => setLazyMode(localStorage.getItem('lazyMode') === 'true');
    window.addEventListener('lazyModeChanged', syncLazy);
    return () => window.removeEventListener('lazyModeChanged', syncLazy);
  }, []);

  const toggleLazyMode = () => {
    const next = !lazyMode;
    localStorage.setItem('lazyMode', next);
    window.dispatchEvent(new Event('lazyModeChanged'));
  };

  const fetchHabits = async () => {
    try {
      const { data } = await getHabits();
      setHabits(data);
    } catch (err) {
      // non-critical widget; fail silently
    }
  };

  // Fetches active + completed tasks together and derives stats from that one
  // pair, instead of computing stats from whatever `tasks` state happens to be
  // at the time — fetchTasks() and fetchStats() used to run independently, so
  // if the completed-tasks request resolved first, stats were computed against
  // a stale/empty active-tasks list (e.g. showing 100% complete with an active
  // task still open).
  const fetchTasksAndStats = async () => {
    try {
      const [tasksRes, completedRes] = await Promise.all([getTasks(), getCompletedTasks()]);
      const activeTasks = tasksRes.data;
      const completedList = completedRes.data.tasks || completedRes.data;
      setTasks(activeTasks);
      calculateStats(activeTasks, completedList);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkload = async () => {
    try {
      const { data } = await getWorkloadInsights();
      setWorkload(data);
    } catch (err) {
      // non-critical widget; fail silently
    }
  };

  const fetchMood = async () => {
    try {
      const { data } = await getMood();
      setMood(data.mood);
    } catch (err) {
      // non-critical
    }
  };

  const fetchSuggestions = async () => {
    try {
      const { data } = await getSmartSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      // non-critical
    }
  };

  const calculateStats = (activeTasks, completed) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = activeTasks.filter(t => new Date(t.deadline) < today);
    const highPriority = activeTasks.filter(t => ['high', 'urgent'].includes(t.priority));
    const completedCount = completed.length || 0;
    const totalTasks = activeTasks.length + completedCount;

    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    if (completedCount > 0 && completedCount % 10 === 0 && !shownMilestonesRef.current.has(completedCount)) {
      shownMilestonesRef.current.add(completedCount);
      const message = content.milestoneMessages[Math.floor(Math.random() * content.milestoneMessages.length)];
      setMilestoneMessage(`${completedCount} tasks completed! ${message}`);
    }

    setStats({
      totalTasks,
      completedCount,
      completionRate,
      overdueCount: overdue.length,
      highPriorityCount: highPriority.length
    });
  };

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
      setTasks((prev) => prev.filter(task => task._id !== id));
      setCompletingId(null);
      fetchTasksAndStats();
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
  }
    const sortedTasks = getSortedTasks();
  const overdueTasks = sortedTasks.filter(t => getDeadlineStatus(t.deadline).isOverdue);
  const upcomingTasks = sortedTasks.filter(t => !getDeadlineStatus(t.deadline).isOverdue);
  const topTask = tasks.reduce((best, task) => {
    if (!best) return task;
    return priorityWeight[task.priority] > priorityWeight[best.priority] ? task : best;
  }, null);

  const renderTaskCard = (task, idx) => {
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

      <LeafConfetti active={showConfetti} emojis={content.ambientEmojis} />

      <Snackbar
        open={!!milestoneMessage}
        autoHideDuration={5000}
        onClose={() => setMilestoneMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setMilestoneMessage('')} sx={{ fontWeight: 'bold' }}>
          🎉 {milestoneMessage}
        </Alert>
      </Snackbar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {new Date().getHours() < 12 ? '☀️ Good Morning' : new Date().getHours() < 17 ? '🌤 Good Afternoon' : '🌙 Good Evening'}, {user?.name}
            </Typography>
            <Typography color="text.secondary">{content.growSubtitle}</Typography>
          </Box>
          {lazyMode && (
            <Chip label="🌙 Lazy Mode" sx={{ bgcolor: '#3949ab', color: '#fff', fontWeight: 'bold' }} />
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Burnout Warning */}
        {workload?.severity && (
          <Alert
            severity={workload.severity}
            icon={<WarningIcon />}
            sx={{ mb: 3 }}
            action={
              workload.burnoutRisk && !lazyMode ? (
                <Button color="inherit" size="small" onClick={toggleLazyMode}>
                  Enable Lazy Mode
                </Button>
              ) : undefined
            }
          >
            <Typography variant="body2" fontWeight="bold">
              {workload.title}
            </Typography>
            <Typography variant="body2">
              {workload.suggestion}
            </Typography>
          </Alert>
        )}

        {/* AI Insights: briefing + smart suggestions together, one voice */}
        <Paper sx={{
          p: 2, mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
          position: 'relative', overflow: 'hidden'
        }}>
          <Typography variant="h6" sx={{ mb: 1 }}>🤖 AI Insights</Typography>
          <Typography variant="body2" color="text.secondary">
            {(() => {
              const taskName = topTask ? `"${topTask.title}"` : 'your most important task';
              if (mood === 'stressed') return `😥 Sounds like a tough day. Consider Lazy Mode and just tackle ${taskName} — the rest can wait.`;
              if (mood === 'tired') return `😴 Low energy today? Ease in with ${taskName} and take breaks between tasks.`;
              if (lazyMode) return `🌙 Lazy Mode is on. Focus on ${taskName} first.`;
              if (mood === 'great') return `✨ Great energy today — a good day to make real progress on ${taskName}.`;
              return `${content.goodDayEmoji} Looks like a good day. Start with ${taskName}.`;
            })()}
          </Typography>

          {suggestions.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>💡 Worth noticing</Typography>
              {suggestions.map((s, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: i < suggestions.length - 1 ? 0.5 : 0 }}>
                  {s.message}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>

        {/* Stats Card */}
        <Paper sx={{
          p: 2,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.3),
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
            {habits.length > 0 && (
              <Box sx={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="secondary.main">
                  {habits.filter((h) => h.completedToday).length}/{habits.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Habits Today</Typography>
              </Box>
            )}
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
              background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              transition: 'width 0.5s ease',
              borderRadius: 5,
            }} />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
            {stats.completedCount} of {stats.totalTasks} tasks completed
          </Typography>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Quick Actions</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <Paper
            component={ButtonBase}
            onClick={() => navigate('/calendar')}
            sx={{
              flex: 1, p: 2, textAlign: 'left', display: 'block',
              borderLeft: '4px solid', borderColor: 'primary.main',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${theme.palette.primary.main}26` }
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">🧠 Smart Workload</Typography>
            <Typography variant="h6">Balanced across your week</Typography>
            <Typography variant="body2" color="text.secondary">Schedula spreads heavy work to keep your days realistic.</Typography>
            <Typography sx={{ position: 'absolute', top: 12, right: 14, color: 'text.secondary' }}>›</Typography>
          </Paper>
          <Paper
            component={ButtonBase}
            onClick={toggleLazyMode}
            sx={{
              flex: 1, p: 2, textAlign: 'left', display: 'block',
              borderLeft: '4px solid', borderColor: lazyMode ? 'secondary.main' : 'primary.dark',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${theme.palette.primary.main}26` }
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">{lazyMode ? '🌙 Lazy Mode ON' : `${content.goodDayEmoji} Lazy Mode`}</Typography>
            <Typography variant="h6">{lazyMode ? 'Easy day active' : 'Easy day mode'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {lazyMode ? 'Tap to turn off. Focus timer is 15 min.' : 'Tap to activate an easier day.'}
            </Typography>
            <Typography sx={{ position: 'absolute', top: 12, right: 14, color: 'text.secondary' }}>›</Typography>
          </Paper>
          <Paper
            component={ButtonBase}
            onClick={() => navigate('/streak')}
            sx={{
              flex: 1, p: 2, textAlign: 'left', display: 'block',
              borderLeft: '4px solid', borderColor: 'secondary.main',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${theme.palette.secondary.main}26` }
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">{content.progressCardEmoji} Progress</Typography>
            <Typography variant="h6">Stay consistent</Typography>
            <Typography variant="body2" color="text.secondary">You have {tasks.length} task{tasks.length === 1 ? '' : 's'} in view.</Typography>
            <Typography sx={{ position: 'absolute', top: 12, right: 14, color: 'text.secondary' }}>›</Typography>
          </Paper>
        </Stack>

        <Paper
          component={ButtonBase}
          onClick={() => navigate('/timer')}
          sx={{
            p: 2, mb: 3, width: '100%', textAlign: 'left', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${theme.palette.primary.main}26` }
          }}
        >
          <Box>
            <Typography variant="h6">⏱ Focus Timer</Typography>
            <Typography variant="body2" color="text.secondary">Start a focus session{lazyMode ? ' — Lazy Mode is on' : ''}.</Typography>
          </Box>
          <Typography sx={{ color: 'text.secondary' }}>›</Typography>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{content.tasksEmoji} Your Tasks</Typography>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Skeleton variant="text" width="45%" height={32} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Box>
                  <Skeleton variant="text" width="70%" sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="35%" />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rounded" width={70} height={30} />
                  <Skeleton variant="rounded" width={90} height={30} />
                  <Skeleton variant="rounded" width={60} height={30} />
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h2">{content.emptyStateEmoji}</Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>{content.emptyStateTitle}</Typography>
            <Typography color="text.secondary">{content.emptyStateSubtitle}</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/add-task')}>
              {content.emptyStateCta}
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {overdueTasks.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" color="error.main" sx={{ mb: 1 }}>
                  ⚠️ Overdue ({overdueTasks.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {overdueTasks.map((task, idx) => renderTaskCard(task, idx))}
                </Box>
              </Box>
            )}
            {upcomingTasks.length > 0 && (
              <Box>
                {overdueTasks.length > 0 && (
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    {content.tasksEmoji} Active
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {upcomingTasks.map((task, idx) => renderTaskCard(task, idx))}
                </Box>
              </Box>
            )}
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