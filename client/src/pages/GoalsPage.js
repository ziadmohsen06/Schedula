import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, Alert, Paper,
  LinearProgress, Checkbox, FormControlLabel, IconButton, CircularProgress, Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getGoals, createGoal, toggleMilestone, deleteGoal } from '../services/api';
import AppShell from '../components/AppShell';

const GoalsPage = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGoals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !targetDate) {
      setError('Please provide a title and target date');
      return;
    }
    try {
      await createGoal({ title, description, targetDate });
      setTitle(''); setDescription(''); setTargetDate('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add goal');
    }
  };

  const handleToggleMilestone = async (goalId, milestoneId) => {
    try {
      const { data } = await toggleMilestone(goalId, milestoneId);
      setGoals((prev) => prev.map((g) => (g._id === goalId ? data : g)));
    } catch (err) {
      setError('Failed to update milestone');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id);
      loadData();
    } catch (err) {
      setError('Failed to delete goal');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">🎯 Goals</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Goal</Typography>
          <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Goal Title" placeholder='e.g. "Learn Python"' fullWidth value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField label="Description (optional)" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Target Date</Typography>
              <TextField type="date" fullWidth value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </Box>
            <Button type="submit" variant="contained">Add Goal — auto-generate weekly milestones</Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : goals.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No goals yet.</Typography>
        ) : (
          goals.map((goal) => {
            const completedCount = goal.milestones.filter((m) => m.completed).length;
            const progress = goal.milestones.length ? Math.round((completedCount / goal.milestones.length) * 100) : 0;
            const isExpanded = !!expanded[goal._id];

            return (
              <Paper key={goal._id} sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">{goal.title}</Typography>
                    {goal.description && <Typography variant="body2" color="text.secondary">{goal.description}</Typography>}
                    <Typography variant="caption" color="text.secondary">
                      Target: {new Date(goal.targetDate).toLocaleDateString()} · {completedCount}/{goal.milestones.length} milestones
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleDelete(goal._id)}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Box>

                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, my: 1.5 }} />

                <Button
                  size="small"
                  onClick={() => setExpanded((prev) => ({ ...prev, [goal._id]: !prev[goal._id] }))}
                  endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {isExpanded ? 'Hide milestones' : 'Show milestones'}
                </Button>

                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 1 }}>
                    {goal.milestones.map((m) => (
                      <FormControlLabel
                        key={m._id}
                        sx={{ display: 'flex', width: '100%' }}
                        control={<Checkbox checked={m.completed} onChange={() => handleToggleMilestone(goal._id, m._id)} />}
                        label={
                          <Typography
                            variant="body2"
                            sx={{ textDecoration: m.completed ? 'line-through' : 'none', color: m.completed ? 'text.secondary' : 'text.primary' }}
                          >
                            {m.title} — {new Date(m.targetDate).toLocaleDateString()}
                          </Typography>
                        }
                      />
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            );
          })
        )}
      </Container>
    </AppShell>
  );
};

export default GoalsPage;
