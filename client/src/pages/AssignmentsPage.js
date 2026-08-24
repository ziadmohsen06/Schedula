import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, TextField, Alert, Paper,
  List, ListItem, ListItemText, IconButton, Chip, CircularProgress, Link
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../services/api';
import AppShell from '../components/AppShell';

const statusColor = { pending: 'default', submitted: 'info', graded: 'success' };

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courseName, setCourseName] = useState('');
  const [title, setTitle] = useState('');
  const [weightPercentage, setWeightPercentage] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [deadline, setDeadline] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAssignments();
      setAssignments(data);
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!courseName || !title || !deadline) {
      setError('Please provide course name, title, and deadline');
      return;
    }
    try {
      await createAssignment({
        courseName, title,
        weightPercentage: weightPercentage ? Number(weightPercentage) : undefined,
        submissionLink, deadline
      });
      setCourseName(''); setTitle(''); setWeightPercentage(''); setSubmissionLink(''); setDeadline('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add assignment');
    }
  };

  const handleMarkSubmitted = async (id) => {
    try {
      await updateAssignment(id, { status: 'submitted' });
      loadData();
    } catch (err) {
      setError('Failed to update assignment');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAssignment(id);
      loadData();
    } catch (err) {
      setError('Failed to delete assignment');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">📝 Assignments</Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Add Assignment</Typography>
          <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Course Name" fullWidth value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
            <TextField label="Assignment Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Weight % (optional)" type="number" fullWidth value={weightPercentage} onChange={(e) => setWeightPercentage(e.target.value)} inputProps={{ min: 0, max: 100 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Deadline</Typography>
                <TextField type="date" fullWidth value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              </Box>
            </Box>
            <TextField label="Submission Link (optional)" fullWidth value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} />
            <Button type="submit" variant="contained">Add Assignment</Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Your Assignments</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : assignments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No assignments yet.</Typography>
          ) : (
            <List disablePadding>
              {assignments.map((a) => (
                <ListItem
                  key={a._id}
                  disableGutters
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {a.status === 'pending' && (
                        <IconButton size="small" onClick={() => handleMarkSubmitted(a._id)} title="Mark as submitted">
                          <CheckCircleIcon fontSize="small" color="action" />
                        </IconButton>
                      )}
                      <IconButton edge="end" onClick={() => handleDelete(a._id)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">{a.title}</Typography>
                        <Chip label={a.status} size="small" color={statusColor[a.status]} />
                      </Box>
                    }
                    secondary={
                      <>
                        {a.courseName}{a.weightPercentage ? ` · ${a.weightPercentage}% of grade` : ''} · Due {new Date(a.deadline).toLocaleDateString()}
                        {a.submissionLink && (
                          <>
                            {' · '}
                            <Link href={a.submissionLink} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}>
                              Submit <OpenInNewIcon sx={{ fontSize: 12 }} />
                            </Link>
                          </>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </AppShell>
  );
};

export default AssignmentsPage;
