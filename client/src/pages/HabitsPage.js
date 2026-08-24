import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, Alert, Paper,
  Checkbox, IconButton, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { getHabits, createHabit, toggleHabit, deleteHabit } from '../services/api';
import AppShell from '../components/AppShell';

const EMOJI_OPTIONS = ['✅', '💪', '📖', '💧', '🧘', '🏃', '🥗', '😴'];

const HabitsPage = () => {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getHabits();
      setHabits(data);
    } catch (err) {
      setError('Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!name) {
      setError('Please provide a habit name');
      return;
    }
    try {
      await createHabit({ name, emoji });
      setName(''); setEmoji('✅');
      loadData();
    } catch (err) {
      setError('Failed to add habit');
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await toggleHabit(id);
      setHabits((prev) => prev.map((h) => (h._id === id ? data : h)));
    } catch (err) {
      setError('Failed to update habit');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHabit(id);
      loadData();
    } catch (err) {
      setError('Failed to delete habit');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">🔁 Habits</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Habit</Typography>
          <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {EMOJI_OPTIONS.map((e) => (
                <Box
                  key={e}
                  onClick={() => setEmoji(e)}
                  sx={{
                    cursor: 'pointer', fontSize: 20, p: 0.5, borderRadius: 1,
                    border: '2px solid', borderColor: emoji === e ? 'primary.main' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  {e}
                </Box>
              ))}
            </Box>
            <TextField label="Habit Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gym" />
            <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>Add</Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : habits.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No habits yet.</Typography>
        ) : (
          habits.map((habit) => (
            <Paper key={habit._id} sx={{ p: 2, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Checkbox checked={habit.completedToday} onChange={() => handleToggle(habit._id)} />
                <Typography sx={{ fontSize: 22 }}>{habit.emoji}</Typography>
                <Box>
                  <Typography variant="body1" fontWeight="medium">{habit.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <LocalFireDepartmentIcon sx={{ fontSize: 16, color: habit.streak > 0 ? '#ff6f00' : 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">{habit.streak} day streak</Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => handleDelete(habit._id)}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Paper>
          ))
        )}
      </Container>
    </AppShell>
  );
};

export default HabitsPage;
