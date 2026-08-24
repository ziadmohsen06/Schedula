import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Card, CardContent, CardActions,
  Chip, Button, Alert, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, Collapse, Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import TimerIcon from '@mui/icons-material/Timer';
import { useAuth } from '../context/AuthContext';
import { getTasks, deleteTask, scheduleTask, completeTask, rescheduleTask, addTaskNote } from '../services/api';
import AppShell from '../components/AppShell';
import FloatingLeaves from '../components/FloatingLeaves';
import TimeRedistributionDialog from '../components/TimeRedistributionDialog';
import { getDeadlineStatus, formatDeadline } from '../utils/dateUtils';
import { playLeafSound, isSoundEnabled } from '../utils/soundUtils';
import { exportToCSV, exportToJSON, exportToPDF } from '../utils/exportUtils';
import { TAG_COLORS as tagColors, getTagColor } from '../utils/tagColors';

const priorityColor = { low: 'success', medium: 'warning', high: 'error', urgent: 'error' };
const priorityWeight = { low: 1, medium: 2, high: 3, urgent: 4 };

const CurrentTasksPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [leafTrigger, setLeafTrigger] = useState(0);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [redistributionOpen, setRedistributionOpen] = useState(false);
  const [completedTask, setCompletedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState({});
  const [selectedTag, setSelectedTag] = useState('all');
  const [noteInput, setNoteInput] = useState({});
  const [addingNote, setAddingNote] = useState(false);
  const [sortOrder, setSortOrder] = useState('priority-high');
  const [exportMenu, setExportMenu] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchTasks();
  }, [user, navigate]);

  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = setInterval(() => {
      setPomodoroTime((prev) => {
        if (prev <= 1) {
          setPomodoroRunning(false);
          setPomodoroTask(null);
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pomodoroRunning]);

  const formatPomodoroTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const fetchTasks = async () => {
    try {
      const { data } = await getTasks();
      const sorted = [...data].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      setTasks(sorted);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(task => task._id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleSchedule = async (id) => {
    try {
      const { data } = await scheduleTask(id);
      setTasks(tasks.map(task => task._id === id ? data.task : task));
    } catch (err) {
      setError('Failed to schedule task');
    }
  };

  const handleComplete = async (id) => {
    try {
      const taskToComplete = tasks.find(task => task._id === id);
      setCompletingTaskId(id);
      
      setLeafTrigger(prev => prev + 1);
      
      if (isSoundEnabled()) {
        playLeafSound();
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await completeTask(id);
      setTasks(tasks.filter(task => task._id !== id));
      setCompletingTaskId(null);
      
      if (tasks.length > 1) {
        setCompletedTask(taskToComplete);
        setRedistributionOpen(true);
      }
    } catch (err) {
      setError('Failed to complete task');
      setCompletingTaskId(null);
    }
  };

  const handleRedistributed = async () => {
    await fetchTasks();
  };

  const handleAddNote = async (taskId) => {
    const noteText = noteInput[taskId]?.trim();
    if (!noteText) return;
    
    setAddingNote(true);
    try {
      const { data } = await addTaskNote(taskId, noteText);
      setTasks(tasks.map(t => t._id === taskId ? data.task : t));
      setNoteInput(prev => ({ ...prev, [taskId]: '' }));
    } catch (err) {
      setError('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const openReschedule = (task) => {
    setSelectedTask(task);
    setNewPriority(task.priority);
    setNewDeadline('');
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    try {
      const { data } = await rescheduleTask(selectedTask._id, {
        deadline: newDeadline,
        priority: newPriority
      });
      setTasks(tasks.map(task => task._id === selectedTask._id ? data.task : task).sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]));
      setRescheduleOpen(false);
      setSelectedTask(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule task');
    }
  };

  const toggleNotes = (taskId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getSortedTasks = () => {
    let copy = [...tasks];
    
    if (searchQuery.trim()) {
      copy = copy.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedTag !== 'all') {
      copy = copy.filter(task => 
        task.tags && task.tags.includes(selectedTag)
      );
    }
    
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
  const allTags = ['all', ...new Set(tasks.flatMap(t => t.tags || ['Other']))];

  return (
    <AppShell>
      <FloatingLeaves trigger={leafTrigger} count={12} />
      
      <TimeRedistributionDialog
        open={redistributionOpen}
        onClose={() => setRedistributionOpen(false)}
        completedTask={completedTask}
        allTasks={tasks}
        onRedistributed={handleRedistributed}
      />
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">Current Tasks</Typography>
            <Typography color="text.secondary">Your active tasks.</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportMenu(!exportMenu)}
            >
              Export
            </Button>
            {exportMenu && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button size="small" onClick={() => { exportToCSV(tasks); setExportMenu(false); }}>CSV</Button>
                <Button size="small" onClick={() => { exportToJSON(tasks); setExportMenu(false); }}>JSON</Button>
                <Button size="small" onClick={() => { exportToPDF(tasks); setExportMenu(false); }}>TXT</Button>
              </Box>
            )}
            <TextField
              size="small"
              placeholder="🔍 Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
              }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Filter</InputLabel>
              <Select value={selectedTag} label="Filter" onChange={(e) => setSelectedTag(e.target.value)}>
                {allTags.map(tag => (
                  <MenuItem key={tag} value={tag}>{tag === 'all' ? 'All Tags' : tag}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : sortedTasks.length === 0 && searchQuery ? (
          <Alert severity="info">No tasks found matching "{searchQuery}"</Alert>
        ) : sortedTasks.length === 0 ? (
          <Typography color="text.secondary">No active tasks. Add one from the button above!</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedTasks.map((task, index) => {
              const deadlineStatus = getDeadlineStatus(task.deadline);
              const isNotesExpanded = expandedNotes[task._id] || false;
              return (
                <Card 
                  key={task._id} 
                  className="garden-card"
                  sx={{ 
                    border: deadlineStatus.isOverdue ? '2px solid #d32f2f' : 'inherit',
                    opacity: completingTaskId === task._id ? 0.5 : 1,
                    transform: completingTaskId === task._id ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.5s ease',
                    animation: 'cardEntrance 0.4s ease forwards',
                    animationDelay: `${index * 0.05}s`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography sx={{
                    position: 'absolute', top: 8, right: 12,
                    fontSize: 32, opacity: 0.06, pointerEvents: 'none',
                    userSelect: 'none'
                  }}>
                    🍃
                  </Typography>

                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                          #{index + 1}
                        </Typography>
                        <Typography variant="h6">{task.title}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        {deadlineStatus.isOverdue && <Chip label="Overdue" color="error" size="small" />}
                        <Chip label={task.priority} color={priorityColor[task.priority]} size="small" />
                      </Box>
                    </Box>
                    
                    {task.tags && task.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        {task.tags.map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              bgcolor: tagColors[tag] + '20',
                              color: tagColors[tag],
                              border: `1px solid ${tagColors[tag]}`,
                              fontSize: '10px',
                              height: 20,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    {task.description && (
                      <Typography color="text.secondary" sx={{ mt: 1 }}>{task.description}</Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
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
                    
                    <Button
                      size="small"
                      onClick={() => toggleNotes(task._id)}
                      endIcon={isNotesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      📝 Notes {task.notes && task.notes.length > 0 ? `(${task.notes.length})` : ''}
                    </Button>
                    
                    <Collapse in={isNotesExpanded}>
                      <Paper sx={{ p: 1.5, mt: 1, bgcolor: 'rgba(105, 195, 125, 0.05)' }}>
                        {task.notes && task.notes.length > 0 ? (
                          task.notes.map((note, i) => (
                            <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              • {note.text}
                            </Typography>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            No notes yet. Add your first note below!
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Add a note..."
                            value={noteInput[task._id] || ''}
                            onChange={(e) => setNoteInput(prev => ({ ...prev, [task._id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !addingNote) {
                                handleAddNote(task._id);
                              }
                            }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddNote(task._id)}
                            disabled={addingNote || !noteInput[task._id]?.trim()}
                          >
                            Add
                          </Button>
                        </Box>
                      </Paper>
                    </Collapse>
                    
                    {task.scheduledDays && task.scheduledDays.length > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(105, 195, 125, 0.08)', border: '1px solid rgba(105,195,125,0.2)' }}>
                        <Typography variant="body2" fontWeight="bold" color="primary.dark">🗓 AI Schedule:</Typography>
                        {task.scheduledDays.map((day, i) => (
                          <Typography key={i} variant="body2" color="text.secondary">
                            {new Date(day.date).toLocaleDateString()} — {day.hoursPerDay} hrs {day.focus ? `— ${day.focus}` : ''}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="success" 
                      onClick={() => handleComplete(task._id)}
                      disabled={completingTaskId === task._id}
                      sx={{ '&:hover': { transform: 'scale(1.05)' } }}
                    >
                      {completingTaskId === task._id ? '✓ Completing...' : '✓ Done'}
                    </Button>
                    <Button 
                      size="small" 
                      color="secondary"
                      startIcon={<TimerIcon />}
                      onClick={() => {
                        setPomodoroTask(task._id);
                        setPomodoroTime(25 * 60);
                        setPomodoroRunning(true);
                      }}
                    >
                      Focus
                    </Button>
                    {deadlineStatus.isOverdue && (
                      <Button size="small" color="warning" onClick={() => openReschedule(task)}>
                        Reschedule
                      </Button>
                    )}
                    <Button size="small" color="primary" onClick={() => handleSchedule(task._id)}>
                      🤖 Schedule
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(task._id)}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Pomodoro Timer */}
        {pomodoroTask && (
          <Paper sx={{ 
            p: 3, 
            mt: 3, 
            bgcolor: 'rgba(246, 196, 83, 0.1)',
            border: '2px solid #F6C453',
            borderRadius: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h6">🍅 Focus Session</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Focusing on: {tasks.find(t => t._id === pomodoroTask)?.title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main">
              {formatPomodoroTime(pomodoroTime)}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                sx={{ mr: 1 }}
              >
                {pomodoroRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setPomodoroRunning(false);
                  setPomodoroTask(null);
                  setPomodoroTime(25 * 60);
                }}
              >
                Stop
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rescheduling: <strong>{selectedTask?.title}</strong>
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>New Deadline</Typography>
              <TextField
                type="date"
                fullWidth
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                required
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newPriority}
                label="Priority"
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleReschedule}
            disabled={!newDeadline}
          >
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
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
    </AppShell>
  );
};

export default CurrentTasksPage;