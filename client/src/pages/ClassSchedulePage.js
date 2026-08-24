import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, Paper, IconButton, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getClassSchedule, createClassSlot, deleteClassSlot } from '../services/api';
import AppShell from '../components/AppShell';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ClassSchedulePage = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courseName, setCourseName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getClassSchedule();
      setSlots(data);
    } catch (err) {
      setError('Failed to load class schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!courseName) {
      setError('Please provide a course name');
      return;
    }
    try {
      await createClassSlot({ courseName, dayOfWeek: Number(dayOfWeek), startTime, endTime });
      setCourseName('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add class');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClassSlot(id);
      loadData();
    } catch (err) {
      setError('Failed to delete class');
    }
  };

  const slotsByDay = DAYS.map((_, i) => slots.filter((s) => s.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime)));

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">📚 Class Schedule</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add your weekly timetable — Schedula factors your class hours into your daily capacity when
          judging your workload, so study time doesn't overlap class time.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Class</Typography>
          <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Course Name" fullWidth value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
            <FormControl fullWidth>
              <InputLabel>Day</InputLabel>
              <Select value={dayOfWeek} label="Day" onChange={(e) => setDayOfWeek(e.target.value)}>
                {DAYS.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Start Time</Typography>
                <TextField type="time" fullWidth value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>End Time</Typography>
                <TextField type="time" fullWidth value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </Box>
            </Box>
            <Button type="submit" variant="contained">Add Class</Button>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          DAYS.map((day, i) => (
            <Paper key={day} sx={{ p: 2, mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: slotsByDay[i].length ? 1 : 0 }}>{day}</Typography>
              {slotsByDay[i].length === 0 ? (
                <Typography variant="body2" color="text.secondary">No classes</Typography>
              ) : (
                slotsByDay[i].map((slot) => (
                  <Box key={slot._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    <Typography variant="body2">{slot.courseName} · {slot.startTime}–{slot.endTime}</Typography>
                    <IconButton size="small" onClick={() => handleDelete(slot._id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                ))
              )}
            </Paper>
          ))
        )}
      </Container>
    </AppShell>
  );
};

export default ClassSchedulePage;
