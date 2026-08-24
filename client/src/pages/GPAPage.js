import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Alert, Paper, List, ListItem,
  ListItemText, IconButton, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import { getCourses, createCourse, updateCourse, deleteCourse, getGPA } from '../services/api';
import AppShell from '../components/AppShell';

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

const GPAPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [gpaData, setGpaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [grade, setGrade] = useState('');
  const [semester, setSemester] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, gpaRes] = await Promise.all([getCourses(), getGPA()]);
      setCourses(coursesRes.data);
      setGpaData(gpaRes.data);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !credits) {
      setError('Please provide course name and credits');
      return;
    }
    try {
      await createCourse({ name, credits: Number(credits), grade: grade || undefined, semester });
      setName(''); setCredits(3); setGrade(''); setSemester('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add course');
    }
  };

  const handleGradeChange = async (id, newGrade) => {
    try {
      await updateCourse(id, { grade: newGrade });
      loadData();
    } catch (err) {
      setError('Failed to update grade');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCourse(id);
      loadData();
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">🎓 GPA Tracker</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Current GPA</Typography>
              <Typography variant="h3" fontWeight="bold" color="primary.main">
                {gpaData?.gpa ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {gpaData?.gradedCount || 0} graded course{gpaData?.gradedCount === 1 ? '' : 's'}, {gpaData?.totalCredits || 0} credits
              </Typography>

              {gpaData?.needsAttention?.length > 0 && (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 0.5 }}>⚠️ Needs attention</Typography>
                  {gpaData.needsAttention.map((c) => (
                    <Typography key={c._id} variant="body2" color="text.secondary">
                      {c.name} — {c.grade}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Course</Typography>
              <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Course Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} required />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Credits" type="number" fullWidth value={credits} onChange={(e) => setCredits(e.target.value)} inputProps={{ min: 0.5, step: 0.5 }} />
                  <FormControl fullWidth>
                    <InputLabel>Grade (optional)</InputLabel>
                    <Select value={grade} label="Grade (optional)" onChange={(e) => setGrade(e.target.value)}>
                      <MenuItem value="">Not graded yet</MenuItem>
                      {GRADES.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <TextField label="Semester (optional)" fullWidth value={semester} onChange={(e) => setSemester(e.target.value)} />
                <Button type="submit" variant="contained">Add Course</Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon fontSize="small" /> Courses
              </Typography>
              {courses.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No courses yet.</Typography>
              ) : (
                <List disablePadding>
                  {courses.map((c) => (
                    <ListItem
                      key={c._id}
                      disableGutters
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControl size="small" sx={{ minWidth: 90 }}>
                            <Select value={c.grade || ''} displayEmpty onChange={(e) => handleGradeChange(c._id, e.target.value)}>
                              <MenuItem value="">—</MenuItem>
                              {GRADES.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <IconButton edge="end" onClick={() => handleDelete(c._id)}>
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={c.name}
                        secondary={`${c.credits} credits${c.semester ? ` · ${c.semester}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </>
        )}
      </Container>
    </AppShell>
  );
};

export default GPAPage;
